import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { reportsAPI, logsAPI } from '../services/api';
import VietMap, { fetchVietMapRoute } from '../components/VietMap';

export default function ReportDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Route state
  const [userLocation, setUserLocation] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [vehicle, setVehicle] = useState('motorcycle');

  useEffect(() => { loadReport(); }, [id]);

  // Lấy vị trí hiện tại của người dùng khi vào trang
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log('Không thể lấy vị trí hiện tại')
      );
    }
  }, []);

  async function loadReport() {
    setLoading(true);
    try {
      const res = await reportsAPI.getById(id);
      setReport(res.data);
    } catch (err) {
      setError(err.message || 'Không tìm thấy báo cáo');
    }
    setLoading(false);
  }

  // Gọi VietMap Route API
  const handleGetRoute = async () => {
    if (!userLocation) {
      setRouteError('Không thể lấy vị trí hiện tại. Hãy bật GPS và thử lại.');
      return;
    }
    setRouteLoading(true);
    setRouteError('');
    setRouteData(null);
    setRouteInfo(null);
    try {
      const destination = { lat: report.latitude, lng: report.longitude };
      const result = await fetchVietMapRoute(userLocation, destination, vehicle);
      setRouteData({
        coordinates: result.coordinates,
        bbox: result.bbox,
      });
      setRouteInfo({
        distance: result.distance,
        time: result.time,
        instructions: result.instructions,
      });
    } catch (err) {
      setRouteError(err.message || 'Không tìm được đường đi');
    }
    setRouteLoading(false);
  };

  // Xóa route
  const handleClearRoute = () => {
    setRouteData(null);
    setRouteInfo(null);
    setShowInstructions(false);
  };

  if (loading) return <div className="loading-screen">Đang tải...</div>;
  if (error) return <div className="error-page"><h2>❌ {error}</h2><button onClick={() => navigate('/')} className="btn">Về trang chủ</button></div>;
  if (!report) return null;

  const statusLabels = {
    pending: '🟡 Chờ tiếp nhận',
    confirmed: '🔵 Đã xác nhận',
    in_progress: '🟣 Đang xử lý',
    resolved: '🟢 Đã hoàn thành',
    rejected: '🔴 Đã từ chối',
  };

  return (
    <div className="report-detail-page">
      <button className="btn btn-back" onClick={() => navigate(-1)}>← Quay lại</button>

      <div className="detail-layout">
        <div className="detail-info">
          <div className="detail-header">
            <span className={`detail-status status-${report.status}`}>{statusLabels[report.status]}</span>
            <span className="detail-category">{report.category_name}</span>
          </div>

          <h1>{report.title}</h1>

          <div className="detail-meta">
            <span>👤 {report.reporter_name}</span>
            <span>📅 {new Date(report.created_at).toLocaleString('vi-VN')}</span>
          </div>

          <div className="detail-description">
            <h3>Mô tả chi tiết</h3>
            <p>{report.description}</p>
          </div>

          {(report.images?.length > 0 || report.image_url) && (
            <div className="detail-images">
              <h3>📷 Ảnh hiện trường</h3>
              <div className="image-gallery">
                {report.image_url && <img src={`http://localhost:5000${report.image_url}`} alt="main" />}
                {report.images?.map(img => (
                  <img key={img.image_id} src={`http://localhost:5000${img.image_url}`} alt="report" />
                ))}
              </div>
            </div>
          )}

          {report.logs?.length > 0 && (
            <div className="detail-logs">
              <h3>📋 Lịch sử xử lý</h3>
              <div className="timeline">
                {report.logs.map(log => (
                  <div key={log.log_id} className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <strong>{log.changed_by_name}</strong>
                        <span className="timeline-role">({log.changed_by_role})</span>
                        <span className="timeline-date">{new Date(log.updated_at).toLocaleString('vi-VN')}</span>
                      </div>
                      <p className="timeline-status">
                        {getStatusLabel(log.old_status)} → <strong>{getStatusLabel(log.new_status)}</strong>
                      </p>
                      {log.note && <p className="timeline-note">💬 {log.note}</p>}
                      {log.proof_image_url && (
                        <img src={`http://localhost:5000${log.proof_image_url}`} alt="proof" className="proof-img" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="detail-map">
          <VietMap
            reports={[report]}
            center={[report.longitude, report.latitude]}
            zoom={16}
            routeData={routeData}
            userLocation={userLocation}
            onUserLocationFound={(loc) => setUserLocation(loc)}
          />

          {/* Route Controls */}
          <div className="route-controls">
            <div className="route-vehicle-select">
              <label>Phương tiện:</label>
              <select value={vehicle} onChange={e => { setVehicle(e.target.value); handleClearRoute(); }}>
                <option value="motorcycle">🏍️ Xe máy</option>
                <option value="car">🚗 Ô tô</option>
                <option value="bike">🚲 Xe đạp</option>
                <option value="foot">🚶 Đi bộ</option>
              </select>
            </div>

            {!routeData ? (
              <button className="btn btn-primary btn-route" onClick={handleGetRoute} disabled={routeLoading}>
                {routeLoading ? '⏳ Đang tìm đường...' : '🧭 Chỉ đường đến đây'}
              </button>
            ) : (
              <button className="btn btn-danger btn-route" onClick={handleClearRoute}>
                ✕ Xóa chỉ đường
              </button>
            )}

            {routeError && <div className="route-error">⚠️ {routeError}</div>}

            {userLocation && (
              <div className="user-location-info">
                📍 Vị trí của bạn: {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
              </div>
            )}

            {routeInfo && (
              <div className="route-info-card">
                <div className="route-summary">
                  <div className="route-stat">
                    <span className="route-stat-icon">📏</span>
                    <div>
                      <strong>{(routeInfo.distance / 1000).toFixed(1)} km</strong>
                      <small>khoảng cách</small>
                    </div>
                  </div>
                  <div className="route-stat">
                    <span className="route-stat-icon">⏱️</span>
                    <div>
                      <strong>{Math.ceil(routeInfo.time / 60000)} phút</strong>
                      <small>thời gian</small>
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-sm btn-toggle-instructions"
                  onClick={() => setShowInstructions(!showInstructions)}
                >
                  {showInstructions ? '▲ Ẩn hướng dẫn' : '▼ Xem hướng dẫn chi tiết'}
                </button>

                {showInstructions && routeInfo.instructions && (
                  <div className="route-instructions">
                    {routeInfo.instructions.map((inst, i) => (
                      <div key={i} className="instruction-step">
                        <span className="step-number">{i + 1}</span>
                        <div className="step-content">
                          <p>{inst.text}</p>
                          <small>
                            {inst.distance > 0 ? `${(inst.distance / 1000).toFixed(1)} km` : ''}
                            {inst.time > 0 ? ` • ${Math.ceil(inst.time / 60000)} phút` : ''}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusLabel(s) {
  return { pending: 'Chờ tiếp nhận', confirmed: 'Đã xác nhận', in_progress: 'Đang xử lý', resolved: 'Đã hoàn thành', rejected: 'Đã từ chối' }[s] || s;
}
