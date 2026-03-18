import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsAPI } from '../services/api';

export default function MyReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => { loadReports(); }, [filter]);

  async function loadReports() {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await reportsAPI.getMyReports(params);
      setReports(res.data.reports);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa báo cáo này?')) return;
    try {
      await reportsAPI.remove(id);
      setReports(r => r.filter(x => x.report_id !== id));
    } catch (err) { alert(err.message); }
  };

  const statusLabels = {
    pending: '🟡 Chờ tiếp nhận', confirmed: '🔵 Đã xác nhận',
    in_progress: '🟣 Đang xử lý', resolved: '🟢 Đã hoàn thành', rejected: '🔴 Đã từ chối',
  };

  return (
    <div className="my-reports-page">
      <div className="page-header">
        <h2>📋 Báo cáo của tôi</h2>
        <button className="btn btn-primary" onClick={() => navigate('/create-report')}>+ Tạo mới</button>
      </div>

      <div className="filter-row">
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ tiếp nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="in_progress">Đang xử lý</option>
          <option value="resolved">Đã hoàn thành</option>
          <option value="rejected">Đã từ chối</option>
        </select>
      </div>

      {loading ? <div className="loading-screen">Đang tải...</div> : reports.length === 0 ? (
        <div className="empty-state">
          <p>📭 Bạn chưa có báo cáo nào.</p>
          <button className="btn btn-primary" onClick={() => navigate('/create-report')}>Tạo báo cáo đầu tiên</button>
        </div>
      ) : (
        <div className="reports-table-wrapper">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Thế loại</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>

                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.report_id}>
                  <td className="td-title" onClick={() => navigate(`/report/${r.report_id}`)}>{r.title}</td>
                  <td>{r.category_name}</td>
                  <td><span className={`status-badge status-${r.status}`}>{statusLabels[r.status]}</span></td>
                  <td>{new Date(r.created_at).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <button className="btn btn-sm" onClick={() => navigate(`/report/${r.report_id}`)}>Xem</button>
                    {r.status === 'pending' && (
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.report_id)}>Xóa</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
