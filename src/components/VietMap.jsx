import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import vietmapgl from '@vietmap/vietmap-gl-js/dist/vietmap-gl';
import '@vietmap/vietmap-gl-js/dist/vietmap-gl.css';
import { API_BASE } from '../services/api.js';

const VIETMAP_API_KEY = '57a5a77555b7aef0739b533e3cd94eaa993ce8bcc6af834a';

/** Mã lỗi Route v3 — https://maps.vietmap.vn/docs/map-api/route-version/route-v3/ */
const ROUTE_CODE_VI = {
  ZERO_RESULTS: 'Không có lộ trình giữa hai điểm (đường không nối được hoặc ngoài vùng dữ liệu).',
  INVALID_REQUEST: 'Tham số chỉ đường không hợp lệ.',
  OVER_DAILY_LIMIT:
    'API VietMap: đã vượt hạn mức ngày hoặc key chưa kích hoạt dịch vụ Route. Kiểm tra tài khoản / gói VietMap Maps API.',
  MAX_POINTS_EXCEED: 'Vượt quá số điểm waypoint cho phép.',
  ERROR_UNKNOWN: 'Lỗi từ máy chủ VietMap.',
  /** HTTP 423 — proxy backend map sang mã này */
  SERVICE_LOCKED:
    'Route VietMap bị khóa với API key hiện tại (HTTP 423). Cần key có quyền Route / gói còn hạn — xem thêm trong nội dung chi tiết bên dưới.',
  INVALID_KEY: 'API key VietMap không hợp lệ hoặc không được phép.',
  HTTP_ERROR: 'VietMap trả lỗi HTTP (không phải JSON chuẩn Route).',
};

// Decode Google Polyline (precision 5)
function decodePolyline(encoded) {
  const points = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    points.push([lng / 1e5, lat / 1e5]); // [lng, lat] for GeoJSON
  }
  return points;
}

/** Tránh XSS trong popup HTML */
function escapeHtml(s) {
  if (s == null || s === '') return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Pin kiểu Google Maps: giọt màu + chấm trắng (sự cố theo trạng thái).
 * anchor: bottom — đỉnh nhọn trùng tọa độ.
 */
function buildGmapsIncidentMarker(color, title) {
  const el = document.createElement('div');
  el.className = 'gmaps-incident-marker';
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', title || 'Sự cố');
  el.innerHTML = `
    <div class="gmaps-incident-marker__pin" style="--pin-color: ${color};">
      <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M18 0C8.059 0 0 7.611 0 17c0 12.5 18 31 18 31s18-18.5 18-31C36 7.611 27.941 0 18 0z" fill="var(--pin-color)"/>
        <circle cx="18" cy="16" r="6.5" fill="white"/>
        <path d="M18 12.5v7M14.5 16h7" stroke="var(--pin-color)" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    </div>
  `;
  return el;
}

const VietMap = forwardRef(function VietMap(
  {
    reports = [],
    onMarkerClick,
    onMapClick,
    selectedLocation,
    center,
    zoom = 13,
    routeData,
    userLocation,
    onUserLocationFound,
    /** Thêm class cho container (vd: full height) */
    containerClassName = '',
    /** 'gmaps' = pin giọt giống Google; 'classic' = marker cũ */
    markersStyle = 'gmaps',
    navigationControl = true,
    geolocateControl = true,
  },
  ref
) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const selectedMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Expose map methods to parent via ref
  useImperativeHandle(ref, () => ({
    getMap: () => mapRef.current,
    flyTo: (center, zoom) => mapRef.current?.flyTo({ center, zoom }),
  }));

  // Khởi tạo map
  useEffect(() => {
    if (mapRef.current) return;

    const map = new vietmapgl.Map({
      container: mapContainer.current,
      style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${VIETMAP_API_KEY}`,
      center: center || [106.6977, 10.7750],
      zoom: zoom,
    });

    if (navigationControl) {
      map.addControl(new vietmapgl.NavigationControl(), 'top-right');
    }

    if (geolocateControl) {
      try {
        const geolocate = new vietmapgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        });
        map.addControl(geolocate, 'top-right');
        geolocate.on('geolocate', (e) => {
          if (onUserLocationFound) {
            onUserLocationFound({ lat: e.coords.latitude, lng: e.coords.longitude });
          }
        });
      } catch (err) {
        console.warn('GeolocateControl không khả dụng:', err);
      }
    }

    map.on('load', () => {
      setMapLoaded(true);

      // Tự lấy vị trí bằng navigator.geolocation (đáng tin cậy hơn GeolocateControl.trigger)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            if (onUserLocationFound) onUserLocationFound(userLoc);
            // Bay đến vị trí người dùng nếu không có center truyền vào
            if (!center) {
              map.flyTo({ center: [userLoc.lng, userLoc.lat], zoom: 14, speed: 1.5 });
            }
          },
          (err) => {
            console.warn('Không lấy được vị trí:', err.message);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      }
    });

    if (onMapClick) {
      map.on('click', (e) => {
        onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Bản đồ co giãn theo container (full map / đổi layout)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !mapContainer.current) return;
    const map = mapRef.current;
    const ro = new ResizeObserver(() => {
      map.resize();
    });
    ro.observe(mapContainer.current);
    return () => ro.disconnect();
  }, [mapLoaded]);

  // Hiển thị vị trí người dùng bằng marker riêng (nếu được truyền prop)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      el.innerHTML = `
        <div class="user-dot-outer">
          <div class="user-dot-inner"></div>
        </div>
      `;

      userMarkerRef.current = new vietmapgl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(mapRef.current);
    }
  }, [userLocation, mapLoaded]);

  // Vẽ route trên bản đồ
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    // Xóa route cũ nếu có
    if (map.getLayer('route-line')) map.removeLayer('route-line');
    if (map.getLayer('route-line-border')) map.removeLayer('route-line-border');
    if (map.getSource('route-source')) map.removeSource('route-source');

    if (!routeData || !routeData.coordinates || routeData.coordinates.length === 0) return;

    // Thêm source + layer cho route
    map.addSource('route-source', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: routeData.coordinates, // [[lng, lat], ...]
        },
      },
    });

    // Border (viền đậm)
    map.addLayer({
      id: 'route-line-border',
      type: 'line',
      source: 'route-source',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#1d4ed8', 'line-width': 8, 'line-opacity': 0.4 },
    });

    // Đường chính
    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route-source',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#2563eb', 'line-width': 5, 'line-opacity': 0.85 },
    });

    // Fit bounds để hiển thị toàn bộ route
    if (routeData.bbox) {
      map.fitBounds(
        [[routeData.bbox[0], routeData.bbox[1]], [routeData.bbox[2], routeData.bbox[3]]],
        { padding: 60, maxZoom: 16 }
      );
    }
  }, [routeData, mapLoaded]);

  // Cập nhật markers khi reports thay đổi
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Xóa markers cũ
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Status colors theo CSDL: pending, in_progress, completed, cancelled
    const statusColors = {
      pending: '#f59e0b',      // Vàng - Chờ tiếp nhận
      in_progress: '#3b82f6',  // Xanh dương - Đang xử lý
      completed: '#10b981',    // Xanh lá - Đã hoàn thành
      cancelled: '#ef4444',    // Đỏ - Đã hủy
    };

    reports.forEach((report) => {
      const color = statusColors[report.status] || '#6b7280';
      const title = report.title || 'Sự cố';

      let el;
      if (markersStyle === 'classic') {
        el = document.createElement('div');
        el.className = 'custom-marker';
        el.innerHTML = `<div class="marker-pin" style="background:${color}" title="${escapeHtml(title)}">
        <span>📍</span>
      </div>`;
      } else {
        el = buildGmapsIncidentMarker(color, title);
      }

      const popup = new vietmapgl.Popup({
        offset: markersStyle === 'gmaps' ? 40 : 25,
        closeButton: true,
        maxWidth: '280px',
      }).setHTML(`
          <div class="marker-popup">
            <h4>${escapeHtml(report.title)}</h4>
            <p class="popup-category">${escapeHtml(report.category_name || '')}</p>
            <p class="popup-status status-${escapeHtml(report.status)}">${escapeHtml(getStatusLabel(report.status))}</p>
          </div>
        `);

      const marker = new vietmapgl.Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat([report.longitude, report.latitude])
        .setPopup(popup)
        .addTo(mapRef.current);

      el.addEventListener('click', () => {
        if (onMarkerClick) onMarkerClick(report);
      });

      markersRef.current.push(marker);
    });
  }, [reports, mapLoaded, markersStyle]);

  // Hiển thị selected location (khi tạo report, chọn vị trí trên bản đồ)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }

    if (selectedLocation) {
      const el = document.createElement('div');
      el.className = 'selected-marker';
      el.innerHTML = '<div class="selected-pin">📍</div>';

      selectedMarkerRef.current = new vietmapgl.Marker({ element: el, draggable: true, anchor: 'bottom' })
        .setLngLat([selectedLocation.lng, selectedLocation.lat])
        .addTo(mapRef.current);

      selectedMarkerRef.current.on('dragend', () => {
        const lngLat = selectedMarkerRef.current.getLngLat();
        if (onMapClick) onMapClick({ lat: lngLat.lat, lng: lngLat.lng });
      });

      mapRef.current.flyTo({ center: [selectedLocation.lng, selectedLocation.lat], zoom: 16 });
    }
  }, [selectedLocation, mapLoaded]);

  return <div ref={mapContainer} className={`vietmap-container ${containerClassName}`.trim()} />;
});

export default VietMap;

/** VietMap Route v3 chỉ hỗ trợ: car | motorcycle | truck */
const ROUTE_VEHICLE_V3 = {
  car: 'car',
  motorcycle: 'motorcycle',
  truck: 'truck',
  bike: 'motorcycle',
  foot: 'motorcycle',
};

/**
 * Gọi chỉ đường qua backend `/api/vietmap/route` (tránh CORS, key có thể đặt trong env server).
 */
export async function fetchVietMapRoute(origin, destination, vehicle = 'motorcycle') {
  const olat = Number(origin.lat);
  const olng = Number(origin.lng);
  const dlat = Number(destination.lat);
  const dlng = Number(destination.lng);
  if (![olat, olng, dlat, dlng].every((n) => Number.isFinite(n))) {
    throw new Error('Tọa độ xuất phát hoặc đích không hợp lệ.');
  }

  const v = ROUTE_VEHICLE_V3[vehicle] || 'car';
  const qs = new URLSearchParams({
    olat: String(olat),
    olng: String(olng),
    dlat: String(dlat),
    dlng: String(dlng),
    vehicle: v,
  });

  let res;
  try {
    res = await fetch(`${API_BASE}/vietmap/route?${qs.toString()}`);
  } catch {
    throw new Error('Không kết nối được máy chủ (backend). Hãy chạy API tại cổng 5000 và thử lại.');
  }

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error('Phản hồi chỉ đường không phải JSON. Kiểm tra backend và mạng.');
  }

  if (data.code !== 'OK' || !Array.isArray(data.paths) || !data.paths.length) {
    const apiMsg = typeof data.messages === 'string' ? data.messages.trim() : '';
    const byCode = data.code ? ROUTE_CODE_VI[data.code] : '';
    /** Ưu tiên nội dung chi tiết từ proxy (423, HTML→text, v.v.) */
    const msg = apiMsg || [byCode].filter(Boolean).join(' ') || 'Không tìm được đường đi.';
    throw new Error(msg);
  }

  const path = data.paths[0];
  let coordinates;
  if (path.points_encoded === false && Array.isArray(path.points)) {
    coordinates = path.points.map((pair) => {
      const lat = pair[0];
      const lng = pair[1];
      return [lng, lat];
    });
  } else if (path.points && typeof path.points === 'string') {
    coordinates = decodePolyline(path.points);
  } else {
    throw new Error('Dữ liệu đường đi từ VietMap không có polyline hợp lệ.');
  }

  if (!coordinates?.length) {
    throw new Error('Giải mã lộ trình rỗng. Thử lại hoặc đổi điểm đầu/cuối.');
  }

  return {
    coordinates,
    distance: path.distance,
    time: path.time,
    bbox: path.bbox,
    instructions: path.instructions,
  };
}

// Status labels theo CSDL: pending, in_progress, completed, cancelled
function getStatusLabel(status) {
  const labels = {
    pending: 'Chờ tiếp nhận',
    in_progress: 'Đang xử lý',
    completed: 'Đã hoàn thành',
    cancelled: 'Đã hủy',
  };
  return labels[status] || status;
}
