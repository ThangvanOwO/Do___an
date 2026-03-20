import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import vietmapgl from '@vietmap/vietmap-gl-js/dist/vietmap-gl';
import '@vietmap/vietmap-gl-js/dist/vietmap-gl.css';

const VIETMAP_API_KEY = '57a5a77555b7aef0739b533e3cd94eaa993ce8bcc6af834a';

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

const VietMap = forwardRef(function VietMap(
  { reports = [], onMarkerClick, onMapClick, selectedLocation, center, zoom = 13, routeData, userLocation, onUserLocationFound },
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

    map.addControl(new vietmapgl.NavigationControl(), 'top-right');

    // Thêm nút geolocate (nếu hỗ trợ)
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

    reports.forEach(report => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.innerHTML = `<div class="marker-pin" style="background:${statusColors[report.status] || '#6b7280'}" title="${report.title}">
        <span>📍</span>
      </div>`;

      const popup = new vietmapgl.Popup({ offset: 25, closeButton: true, maxWidth: '280px' })
        .setHTML(`
          <div class="marker-popup">
            <h4>${report.title}</h4>
            <p class="popup-category">${report.category_name || ''}</p>
            <p class="popup-status status-${report.status}">${getStatusLabel(report.status)}</p>
          </div>
        `);

      const marker = new vietmapgl.Marker({ element: el })
        .setLngLat([report.longitude, report.latitude])
        .setPopup(popup)
        .addTo(mapRef.current);

      el.addEventListener('click', () => {
        if (onMarkerClick) onMarkerClick(report);
      });

      markersRef.current.push(marker);
    });
  }, [reports, mapLoaded]);

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

      selectedMarkerRef.current = new vietmapgl.Marker({ element: el, draggable: true })
        .setLngLat([selectedLocation.lng, selectedLocation.lat])
        .addTo(mapRef.current);

      selectedMarkerRef.current.on('dragend', () => {
        const lngLat = selectedMarkerRef.current.getLngLat();
        if (onMapClick) onMapClick({ lat: lngLat.lat, lng: lngLat.lng });
      });

      mapRef.current.flyTo({ center: [selectedLocation.lng, selectedLocation.lat], zoom: 16 });
    }
  }, [selectedLocation, mapLoaded]);

  return (
    <div ref={mapContainer} className="vietmap-container" />
  );
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

// Hàm gọi VietMap Route API v3 (docs: /api/route/v3, point=lat,lng)
export async function fetchVietMapRoute(origin, destination, vehicle = 'motorcycle') {
  const v = ROUTE_VEHICLE_V3[vehicle] || 'car';
  const params = new URLSearchParams({
    apikey: VIETMAP_API_KEY,
    points_encoded: 'true',
    vehicle: v,
  });
  params.append('point', `${origin.lat},${origin.lng}`);
  params.append('point', `${destination.lat},${destination.lng}`);

  const url = `https://maps.vietmap.vn/api/route/v3?${params.toString()}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));

  if (data.code !== 'OK' || !data.paths?.length) {
    let msg = 'Không tìm được đường đi';
    if (data.messages) {
      msg = typeof data.messages === 'string' ? data.messages : JSON.stringify(data.messages);
    } else if (data.code === 'ZERO_RESULTS') {
      msg = 'Không có lộ trình giữa hai điểm.';
    } else if (data.code === 'INVALID_REQUEST') {
      msg = 'Tham số chỉ đường không hợp lệ.';
    }
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
  } else {
    coordinates = decodePolyline(path.points);
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
