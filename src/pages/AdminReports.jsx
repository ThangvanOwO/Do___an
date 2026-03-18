import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsAPI, categoriesAPI } from '../services/api';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category_id: '' });
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1 });
  const [modal, setModal] = useState(null); // { report_id, action }
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { categoriesAPI.getAll().then(r => setCategories(r.data)).catch(() => {}); }, []);
  useEffect(() => { loadReports(); }, [filters, pagination.page]);

  async function loadReports() {
    setLoading(true);
    try {
      let params = `?page=${pagination.page}&limit=20&sort_by=created_at&sort_order=desc`;
      if (filters.status) params += `&status=${filters.status}`;
      if (filters.category_id) params += `&category_id=${filters.category_id}`;
      const res = await reportsAPI.getAll(params);
      setReports(res.data.reports);
      setPagination(p => ({ ...p, total_pages: res.data.pagination.total_pages }));
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const handleUpdateStatus = async () => {
    if (!modal) return;
    setUpdating(true);
    try {
      await reportsAPI.updateStatus(modal.report_id, {
        new_status: modal.action,
      });
      setModal(null);
      loadReports();
    } catch (err) { alert(err.message); }
    setUpdating(false);
  };

  const statusLabels = {
    pending: '🟡 Chờ tiếp nhận', confirmed: '🔵 Đã xác nhận',
    in_progress: '🟣 Đang xử lý', resolved: '🟢 Đã hoàn thành', rejected: '🔴 Đã từ chối',
  };

  const nextActions = {
    pending: [{ action: 'confirmed', label: '✅ Xác nhận' }, { action: 'rejected', label: '❌ Từ chối' }],
    confirmed: [{ action: 'in_progress', label: '🔧 Bắt đầu xử lý' }],
    in_progress: [{ action: 'resolved', label: '✅ Đã giải quyết' }],
  };

  return (
    <div className="admin-reports-page">
      <h2>🛠️ Quản lý báo cáo</h2>

      <div className="filter-row">
        <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPagination(p => ({ ...p, page: 1 })); }}>
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ tiếp nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="in_progress">Đang xử lý</option>
          <option value="resolved">Đã hoàn thành</option>
          <option value="rejected">Đã từ chối</option>
        </select>
        <select value={filters.category_id} onChange={e => { setFilters(f => ({ ...f, category_id: e.target.value })); setPagination(p => ({ ...p, page: 1 })); }}>
          <option value="">Tất cả danh mục</option>
          {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? <div className="loading-screen">Đang tải...</div> : (
        <div className="reports-table-wrapper">
          <table className="reports-table">
            <thead>
              <tr><th>#</th><th>Tiêu đề</th><th>Danh mục</th><th>Trạng thái</th><th>Người báo cáo</th><th>Ngày tạo</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {reports.map((r, idx) => (
                <tr key={r.report_id}>
                  <td>{(pagination.page - 1) * 20 + idx + 1}</td>
                  <td className="td-title" onClick={() => navigate(`/report/${r.report_id}`)}>{r.title}</td>
                  <td>{r.category_name}</td>
                  <td><span className={`status-badge status-${r.status}`}>{statusLabels[r.status]}</span></td>
                  <td>{r.reporter_name}</td>
                  <td>{new Date(r.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="action-cell">
                    {nextActions[r.status]?.map(a => (
                      <button key={a.action} className={`btn btn-sm btn-action-${a.action}`}
                        onClick={() => setModal({ report_id: r.report_id, action: a.action, title: r.title })}>
                        {a.label}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="pagination">
          <button disabled={pagination.page <= 1} onClick={() => setPagination(p => ({...p, page: p.page - 1}))}>« Trước</button>
          <span>Trang {pagination.page} / {pagination.total_pages}</span>
          <button disabled={pagination.page >= pagination.total_pages} onClick={() => setPagination(p => ({...p, page: p.page + 1}))}>Sau »</button>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Cập nhật trạng thái</h3>
            <p>Báo cáo: <strong>{modal.title}</strong></p>
            <p>Hành động: <strong>{statusLabels[modal.action]}</strong></p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setModal(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleUpdateStatus} disabled={updating}>
                {updating ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
