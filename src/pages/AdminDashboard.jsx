import { useState, useEffect } from 'react';
import { statisticsAPI, reportsAPI } from '../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [byStatus, setByStatus] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      statisticsAPI.getOverview(),
      statisticsAPI.byCategory(),
      statisticsAPI.byStatus(),
      reportsAPI.getAll('?limit=10&sort_by=created_at&sort_order=desc'),
    ]).then(([ovRes, catRes, stRes, rptRes]) => {
      setStats(ovRes.data);
      setByCategory(catRes.data);
      setByStatus(stRes.data);
      setRecentReports(rptRes.data.reports);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen">Đang tải thống kê...</div>;

  const statusColors = {
    pending: '#f59e0b', confirmed: '#3b82f6',
    in_progress: '#8b5cf6', resolved: '#10b981', rejected: '#ef4444',
  };
  const statusLabels = {
    pending: 'Chờ tiếp nhận', confirmed: 'Đã xác nhận',
    in_progress: 'Đang xử lý', resolved: 'Đã hoàn thành', rejected: 'Đã từ chối',
  };

  const totalByStatus = byStatus.reduce((sum, s) => sum + s.count, 0) || 1;

  return (
    <div className="admin-dashboard">
      <h2>📊 Bảng điều khiển quản trị</h2>

      {/* Overview Cards */}
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon">📝</div><div className="stat-info"><h3>{stats?.total_reports ?? 0}</h3><p>Tổng báo cáo</p></div></div>
        <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-info"><h3>{stats?.total_users ?? 0}</h3><p>Người dùng</p></div></div>
        <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-info"><h3>{stats?.resolved_reports ?? 0}</h3><p>Đã giải quyết</p></div></div>
        <div className="stat-card"><div className="stat-icon">⏳</div><div className="stat-info"><h3>{stats?.pending_reports ?? 0}</h3><p>Chờ xử lý</p></div></div>
      </div>

      <div className="dashboard-grid">
        {/* Status Breakdown */}
        <div className="dashboard-card">
          <h3>Phân bổ theo trạng thái</h3>
          <div className="status-bars">
            {byStatus.map(s => (
              <div key={s.status} className="status-bar-row">
                <span className="bar-label">{statusLabels[s.status] || s.status}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{
                    width: `${(s.count / totalByStatus) * 100}%`,
                    backgroundColor: statusColors[s.status] || '#888'
                  }}></div>
                </div>
                <span className="bar-count">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="dashboard-card">
          <h3>Phân bổ theo danh mục</h3>
          <div className="category-stats">
            {byCategory.map(c => (
              <div key={c.category_id} className="cat-stat-row">
                <span className="cat-name">{c.name}</span>
                <span className="cat-count">{c.total_reports} sự cố</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="dashboard-card full-width">
        <h3>📋 Báo cáo gần đây</h3>
        <table className="reports-table">
          <thead>
            <tr><th>Tiêu đề</th><th>Danh mục</th><th>Trạng thái</th><th>Người báo cáo</th><th>Ngày</th></tr>
          </thead>
          <tbody>
            {recentReports.map(r => (
              <tr key={r.report_id}>
                <td><a href={`/report/${r.report_id}`}>{r.title}</a></td>
                <td>{r.category_name}</td>
                <td><span className={`status-badge status-${r.status}`}>{statusLabels[r.status]}</span></td>
                <td>{r.reporter_name}</td>
                <td>{new Date(r.created_at).toLocaleDateString('vi-VN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
