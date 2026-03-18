import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import VietMap from '../components/VietMap';
import { floodsAPI } from '../services/api';

const severityOptions = [
  { value: 'low', label: '🟢 Nhẹ', desc: 'Nước ngập nhẹ, xe vẫn đi được', color: '#22c55e' },
  { value: 'medium', label: '🟡 Trung bình', desc: 'Nước ngập vừa, xe máy khó đi', color: '#eab308' },
  { value: 'high', label: '🟠 Nghiêm trọng', desc: 'Nước ngập sâu, không đi được', color: '#f97316' },
  { value: 'critical', label: '🔴 Rất nghiêm trọng', desc: 'Nguy hiểm, cần cứu hộ', color: '#ef4444' },
];

const severityColors = { low: '#22c55e', medium: '#eab308', high: '#f97316', critical: '#ef4444' };

export default function FloodReportPage() {
  const { user } = useAuth();
  const [floods, setFloods] = useState([]);
  const [location, setLocation] = useState(null);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedFlood, setSelectedFlood] = useState(null);
  const [form, setForm] = useState({
    severity_level: 'medium', description: '', address: '',
    water_level_cm: '', road_passable: '1',
  });
  const [geoError, setGeoError] = useState('');
  const mapRef = useRef(null);

  useEffect(() => {
    loadFloods();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGeoError('');
        },
        (err) => {
          console.warn('Geolocation error:', err);
          setLocation({ lat: 10.7750, lng: 106.6977 }); // fallback HCM
          if (err.code === 1) {
            setGeoError('⚠️ Bạn đã chặn quyền vị trí. Hãy bật lại trong cài đặt trình duyệt (🔒 biểu tượng ổ khóa bên trái thanh địa chỉ → Cho phép Vị trí). Hiện tại đang dùng vị trí mặc định TP.HCM.');
          } else if (err.code === 2) {
            setGeoError('⚠️ Không thể xác định vị trí. Hãy bật Location (Vị trí) trong Windows Settings → Privacy → Location. Đang dùng vị trí mặc định TP.HCM.');
          } else {
            setGeoError('⚠️ Lấy vị trí quá lâu. Đang dùng vị trí mặc định TP.HCM. Bạn có thể bấm vào bản đồ để chọn vị trí thủ công.');
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setLocation({ lat: 10.7750, lng: 106.6977 });
      setGeoError('⚠️ Trình duyệt không hỗ trợ Geolocation. Đang dùng vị trí mặc định.');
    }
  }, []);

  const loadFloods = async () => {
    try {
      const res = await floodsAPI.getMapData();
      setFloods(res.data || []);
    } catch { }
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleMapClick = (loc) => {
    if (showForm) {
      setLocation(loc);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) { setError('Vui lòng bấm vào bản đồ để ghim vị trí ngập lụt'); return; }
    if (!form.severity_level) { setError('Vui lòng chọn mức độ nghiêm trọng'); return; }
    if (images.length === 0) { setError('Vui lòng chụp ít nhất 1 ảnh hiện trường'); return; }

    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('latitude', location.lat);
      fd.append('longitude', location.lng);
      fd.append('severity_level', form.severity_level);
      fd.append('description', form.description);
      fd.append('address', form.address);
      fd.append('water_level_cm', form.water_level_cm || '0');
      fd.append('road_passable', form.road_passable);
      images.forEach(img => fd.append('images', img));

      const res = await floodsAPI.create(fd);
      setSuccess(res.message);
      setShowForm(false);
      setForm({ severity_level: 'medium', description: '', address: '', water_level_cm: '', road_passable: '1' });
      setImages([]); setPreviews([]);
      loadFloods();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Báo cáo ngập lụt thất bại');
    }
    setLoading(false);
  };

  const handleResolve = async (floodId) => {
    try {
      await floodsAPI.resolve(floodId);
      setSelectedFlood(null);
      loadFloods();
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="flood-page">
      <div className="flood-header">
        <div>
          <h2>🌊 Bản đồ Ngập lụt</h2>
          <p className="page-desc">Theo dõi & báo cáo các tuyến đường bị ngập lụt trong khu vực</p>
        </div>
        {user && (
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}>
            {showForm ? '✕ Đóng' : '📍 Báo cáo ngập lụt'}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {geoError && <div className="alert alert-warning" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', padding: '10px 16px', borderRadius: '8px', marginBottom: '12px', fontSize: '.9rem' }}>{geoError}</div>}

      {/* Legend */}
      <div className="flood-legend">
        {severityOptions.map(s => (
          <span key={s.value} className="legend-item">
            <span className="legend-dot" style={{ background: s.color }}></span>
            {s.label}
          </span>
        ))}
        <span className="legend-item"><strong>{floods.length}</strong> điểm ngập đang hoạt động</span>
      </div>

      <div className="flood-layout">
        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="flood-form">
            <h3>📍 Ghim tuyến đường bị ngập</h3>
            <p className="hint">Bấm vào bản đồ để chọn vị trí ngập lụt</p>

            <div className="form-group">
              <label>Vị trí ghim:</label>
              <div className="location-display">
                {location ? `📌 ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : '⏳ Chưa chọn - hãy bấm vào bản đồ'}
              </div>
            </div>

            <div className="form-group">
              <label>🚨 Mức độ nghiêm trọng *</label>
              <div className="severity-select">
                {severityOptions.map(s => (
                  <label key={s.value}
                    className={`severity-option ${form.severity_level === s.value ? 'active' : ''}`}
                    style={{ borderColor: form.severity_level === s.value ? s.color : '#ddd', background: form.severity_level === s.value ? s.color + '15' : '' }}>
                    <input type="radio" name="severity_level" value={s.value}
                      checked={form.severity_level === s.value} onChange={handleChange} />
                    <span className="sev-label">{s.label}</span>
                    <span className="sev-desc">{s.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>📷 Ảnh hiện trường * (tối đa 5 ảnh)</label>
              <input type="file" accept="image/*" multiple onChange={handleImageChange} />
              {previews.length > 0 && (
                <div className="image-previews">
                  {previews.map((src, i) => <img key={i} src={src} alt={`preview-${i}`} />)}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>📝 Mô tả tình trạng ngập</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                placeholder="VD: Nước ngập khoảng 30cm, xe máy không thể đi qua, nước có dấu hiệu dâng..." rows={3} />
            </div>

            <div className="form-group">
              <label>📍 Địa chỉ / Tên đường</label>
              <input type="text" name="address" value={form.address} onChange={handleChange}
                placeholder="VD: Đường Nguyễn Hữu Cảnh, Q.Bình Thạnh" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>💧 Mực nước (cm)</label>
                <input type="number" name="water_level_cm" value={form.water_level_cm} onChange={handleChange}
                  placeholder="VD: 30" min="0" max="500" />
              </div>
              <div className="form-group">
                <label>🚗 Xe có thể đi qua?</label>
                <select name="road_passable" value={form.road_passable} onChange={handleChange}>
                  <option value="1">Có - Đi được nhưng khó khăn</option>
                  <option value="0">Không - Không thể đi qua</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? '⏳ Đang gửi...' : '🌊 Gửi báo cáo ngập lụt'}
            </button>
          </form>
        )}

        {/* Map + List */}
        <div className={`flood-map-area ${showForm ? 'with-form' : ''}`}>
          <div className="flood-map-container">
            <VietMap
              ref={mapRef}
              reports={[]}
              selectedLocation={showForm ? location : null}
              onMapClick={handleMapClick}
              zoom={13}
            />
            {/* Overlay flood markers */}
            <FloodMarkers floods={floods} mapRef={mapRef} onSelect={setSelectedFlood} />
          </div>

          {/* Flood detail popup */}
          {selectedFlood && (
            <div className="flood-detail-card">
              <button className="close-btn" onClick={() => setSelectedFlood(null)}>✕</button>
              <div className="fd-severity" style={{ background: severityColors[selectedFlood.severity_level] }}>
                {severityOptions.find(s => s.value === selectedFlood.severity_level)?.label}
              </div>
              {selectedFlood.image_url && (
                <img src={`http://localhost:5000${selectedFlood.image_url}`} alt="flood" className="fd-image" />
              )}
              <p className="fd-address">📍 {selectedFlood.address || `${selectedFlood.latitude.toFixed(5)}, ${selectedFlood.longitude.toFixed(5)}`}</p>
              {selectedFlood.description && <p className="fd-desc">{selectedFlood.description}</p>}
              <div className="fd-meta">
                {selectedFlood.water_level_cm > 0 && <span>💧 {selectedFlood.water_level_cm}cm</span>}
                <span>{selectedFlood.road_passable ? '🚗 Đi được' : '🚫 Không đi được'}</span>
                <span>👤 {selectedFlood.reporter_name}</span>
                <span>🕐 {new Date(selectedFlood.created_at).toLocaleString('vi-VN')}</span>
              </div>
              <div className="fd-actions">
                {user && (user.role === 'admin' || user.role === 'staff' || user.user_id === selectedFlood.user_id) && (
                  <button className="btn btn-sm btn-success" onClick={() => handleResolve(selectedFlood.flood_id)}>
                    ✅ Đã hết ngập
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Bottom list */}
          <div className="flood-list">
            <h3>📋 Danh sách điểm ngập ({floods.length})</h3>
            {floods.length === 0 ? (
              <p className="empty-text">Chưa có báo cáo ngập lụt nào. Hãy là người đầu tiên!</p>
            ) : (
              <div className="flood-cards">
                {floods.map(f => (
                  <div key={f.flood_id} className="flood-card" onClick={() => {
                    setSelectedFlood(f);
                    mapRef.current?.flyTo([f.longitude, f.latitude], 15);
                  }}>
                    <span className="fc-severity" style={{ background: severityColors[f.severity_level] }}>
                      {f.severity_level === 'low' ? '🟢' : f.severity_level === 'medium' ? '🟡' : f.severity_level === 'high' ? '🟠' : '🔴'}
                    </span>
                    <div className="fc-info">
                      <strong>{f.address || `${f.latitude.toFixed(4)}, ${f.longitude.toFixed(4)}`}</strong>
                      <span className="fc-time">{new Date(f.created_at).toLocaleString('vi-VN')}</span>
                    </div>
                    {f.image_url && <img src={`http://localhost:5000${f.image_url}`} alt="" className="fc-thumb" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Flood markers overlay - renders HTML markers on the VietMap */
function FloodMarkers({ floods, mapRef, onSelect }) {
  const markersRef = useRef([]);

  useEffect(() => {
    // Clean old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const map = mapRef.current?.getMap?.();
    if (!map) return;

    // Wait for map to be loaded
    const addMarkers = () => {
      floods.forEach(flood => {
        const el = document.createElement('div');
        el.className = 'flood-marker';
        el.style.cssText = `
          width: 28px; height: 28px; border-radius: 50%;
          background: ${severityColors[flood.severity_level]};
          border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,.3);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 14px; transition: transform .15s;
        `;
        el.innerHTML = '🌊';
        el.title = flood.address || 'Điểm ngập lụt';
        el.onmouseenter = () => el.style.transform = 'scale(1.3)';
        el.onmouseleave = () => el.style.transform = 'scale(1)';
        el.onclick = (e) => { e.stopPropagation(); onSelect(flood); };

        // Use vietmapgl from the map instance
        const vietmapgl = window.vietmapgl || map.constructor?.__proto__?.constructor;

        // Create marker using map's internal reference
        try {
          const marker = new map.__proto__.constructor.Marker
            ? null
            : null;
        } catch {}

        // Fallback: add as HTML overlay
        const lngLat = [flood.longitude, flood.latitude];
        const point = map.project(lngLat);

        // Use dynamic import approach - create marker via DOM
        const markerContainer = document.createElement('div');
        markerContainer.style.cssText = 'position:absolute;pointer-events:auto;';
        markerContainer.appendChild(el);

        // Dynamic marker using map canvas overlay
        const updatePosition = () => {
          try {
            const p = map.project(lngLat);
            markerContainer.style.left = p.x - 14 + 'px';
            markerContainer.style.top = p.y - 14 + 'px';
          } catch {}
        };

        const container = map.getCanvasContainer().parentElement;
        // Find or create overlay div
        let overlay = container.querySelector('.flood-overlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.className = 'flood-overlay';
          overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:5;';
          container.appendChild(overlay);
        }
        markerContainer.style.pointerEvents = 'auto';
        overlay.appendChild(markerContainer);
        updatePosition();

        map.on('move', updatePosition);
        map.on('zoom', updatePosition);

        markersRef.current.push({
          remove: () => {
            markerContainer.remove();
            map.off('move', updatePosition);
            map.off('zoom', updatePosition);
          }
        });
      });
    };

    if (map.loaded()) {
      addMarkers();
    } else {
      map.on('load', addMarkers);
    }

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
    };
  }, [floods, mapRef, onSelect]);

  return null;
}
