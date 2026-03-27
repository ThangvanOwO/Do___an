import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { reportsAPI } from '../services/api';
import IncidentManagementDashboard from '../components/dashboard/IncidentManagementDashboard';

/**
 * Trang bọc: lấy `reports` từ API rồi đổ vào IncidentManagementDashboard.
 * Mỗi phần tử tối thiểu: report_id, title, status, created_at (API thực tế trả thêm lat/lng, description...).
 */
export default function DashboardReactPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsAPI.getAll();
      if (res.success && Array.isArray(res.data)) setReports(res.data);
      else setReports([]);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    navigate('/login');
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9ff] dark:bg-background-dark font-display text-slate-600 dark:text-slate-400">
        Đang tải dashboard…
      </div>
    );
  }

  return (
    <IncidentManagementDashboard
      reports={reports}
      currentUser={user ? { full_name: user.full_name, role: user.role, avatar_url: user.avatar_url } : undefined}
      onLogout={handleLogout}
    />
  );
}
