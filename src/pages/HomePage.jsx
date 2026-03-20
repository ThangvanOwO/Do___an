import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VietMap, { fetchVietMapRoute } from '../components/VietMap';
import { reportsAPI, categoriesAPI } from '../services/api';

export default function HomePage() {
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState({ status: '', category_id: '' });
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.category_id) params.set('category_id', filter.category_id);

      const [mapRes, catRes] = await Promise.all([
        reportsAPI.getMapData(params.toString() ? `?${params}` : ''),
        categoriesAPI.getAll(),
      ]);
      setReports(mapRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  // Handler chỉ đường đến report
  const handleRouteToReport = async (report) => {
    if (!userLocation) { alert('Không thể lấy vị trí hiện tại. Hãy bật GPS.'); return; }
    setRouteLoading(true);
    setSelectedReport(report);
    try {
      const result = await fetchVietMapRoute(userLocation, { lat: report.latitude, lng: report.longitude });
      setRouteData({ coordinates: result.coordinates, bbox: result.bbox });
      setRouteInfo({ distance: result.distance, time: result.time });
    } catch (err) {
      alert(err.message || 'Không tìm được đường đi');
    }
    setRouteLoading(false);
  };

  const handleClearRoute = () => {
    setRouteData(null);
    setRouteInfo(null);
    setSelectedReport(null);
  };

  return (
    <div className="home-page">
      <div className="map-filters">
        <h2>🗺️ Bản đồ Sự cố Cộng đồng</h2>
        <div className="filter-row">
          <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
            <option value="">Tất cả trạng thái</option>
            <option value="pending">🟡 Chờ tiếp nhận</option>
            <option value="in_progress">🔵 Đang xử lý</option>
            <option value="completed">🟢 Đã hoàn thành</option>
            <option value="cancelled">🔴 Đã hủy</option>
          </select>
          <select value={filter.category_id} onChange={e => setFilter(f => ({ ...f, category_id: e.target.value }))}>
            <option value="">Tất cả danh mục</option>
            {categories.map(c => (
              <option key={c.category_id} value={c.category_id}>{c.name}</option>
            ))}
          </select>
          <span className="report-count">{loading ? '...' : `${reports.length} sự cố`}</span>
        </div>
      </div>

      <div className="map-wrapper">
        <VietMap
          reports={reports}
          onMarkerClick={(report) => navigate(`/report/${report.report_id}`)}
          routeData={routeData}
          userLocation={userLocation}
          onUserLocationFound={(loc) => setUserLocation(loc)}
        />
        {routeInfo && selectedReport && (
          <div className="route-banner">
            <span>🧭 <strong>{selectedReport.title}</strong> — {(routeInfo.distance / 1000).toFixed(1)} km, ~{Math.ceil(routeInfo.time / 60000)} phút</span>
            <button className="btn btn-sm btn-danger" onClick={handleClearRoute}>✕ Xóa</button>
          </div>
        )}
      </div>

      <div className="reports-list-section">
        <h3>📋 Danh sách sự cố gần đây</h3>
        <div className="reports-grid">
          {reports.slice(0, 12).map(r => (
            <div key={r.report_id} className="report-card" onClick={() => navigate(`/report/${r.report_id}`)}>
              <div className="card-header">
                <span className="card-category-name">{r.category_name}</span>
                <span className={`card-status status-${r.status}`}>{getStatusLabel(r.status)}</span>
              </div>
              <h4>{r.title}</h4>
              <p className="card-category">{r.category_name}</p>
              <div className="card-footer">
                <span>{new Date(r.created_at).toLocaleDateString('vi-VN')}</span>
                <button
                  className="btn btn-sm btn-route-card"
                  onClick={(e) => { e.stopPropagation(); handleRouteToReport(r); }}
                  disabled={routeLoading}
                  title="Chỉ đường đến sự cố"
                >
                  🧭
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Status labels theo CSDL: pending, in_progress, completed, cancelled
function getStatusLabel(s) {
  return { pending: 'Chờ tiếp nhận', in_progress: 'Đang xử lý', completed: 'Đã hoàn thành', cancelled: 'Đã hủy' }[s] || s;
}
