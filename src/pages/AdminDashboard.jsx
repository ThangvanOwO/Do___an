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

  if (loading) return <div className="loading-screen p-4">Đang tải thống kê...</div>;

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
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-10 space-y-8">
      {/* Header Section */}
      <section className="relative rounded-xl overflow-hidden min-h-[320px] flex items-center p-8 md:p-12">
        <div className="absolute inset-0 bg-primary/90 mix-blend-multiply z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-background-dark to-transparent z-10"></div>
        <img alt="GIS Network Map" className="absolute inset-0 w-full h-full object-cover grayscale brightness-50" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCB08O33vjEdKKR5bqkrD4Lf51QPz9Yoknpk-u6rjYsr1mZHhaNtYYUF_VWXsGMPT1H7Z8NLQjGjjjbkIJU0gO1GkgOGLdYFsbawwfZ_wNmvlilgLXv26tSXyu8XHSc3OHN8CIlQJ1n4sok8eeWLHMMHkCigwx1GgAyFZkSiQN8FfOzwtJCkraVIJ_WVcDGGAUtz2rAA0Oy9wiTUuQKpy_10-V_spC-I1kl-A7Xn3zwxlZIHKnyA5F-50b3khrspJ-shCRaw-lJ66o"/>
        <div className="relative z-20 max-w-2xl space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-xs font-bold text-white uppercase tracking-widest">
                System Active
            </div>
            <h1 className="text-white text-4xl md:text-6xl font-black leading-tight tracking-tighter">
                Bảng điều khiển quản trị
            </h1>
            <p className="text-slate-300 text-lg md:text-xl font-medium max-w-lg leading-relaxed">
                Thống kê và quản lý hệ thống. Giám sát các báo cáo, thông số người dùng.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button className="bg-white text-primary px-8 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined">map</span>
              Xem Bản đồ
            </button>
            <button className="bg-primary/30 text-white backdrop-blur-md border border-white/20 px-8 py-3 rounded-xl font-bold hover:bg-white/10 transition-all">
              Xem Báo cáo
            </button>
          </div>
        </div>
      </section>

      {/* Overview Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-xl flex flex-col gap-4 shadow-sm border border-slate-200/50">
          <div className="flex items-center justify-between">
            <div className="size-12 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined">description</span>
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Tổng báo cáo</p>
            <h3 className="text-4xl font-black tracking-tight mt-1">{stats?.total_reports ?? 0}</h3>
          </div>
        </div>
        
        <div className="glass-card p-6 rounded-xl flex flex-col gap-4 shadow-sm border border-slate-200/50">
          <div className="flex items-center justify-between">
            <div className="size-12 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined">group</span>
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Người dùng</p>
            <h3 className="text-4xl font-black tracking-tight mt-1">{stats?.total_users ?? 0}</h3>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl flex flex-col gap-4 shadow-sm border border-slate-200/50">
          <div className="flex items-center justify-between">
            <div className="size-12 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Đã giải quyết</p>
            <h3 className="text-4xl font-black tracking-tight mt-1">{stats?.resolved_reports ?? 0}</h3>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl flex flex-col gap-4 shadow-sm border border-slate-200/50">
          <div className="flex items-center justify-between">
            <div className="size-12 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Chờ xử lý</p>
            <h3 className="text-4xl font-black tracking-tight mt-1">{stats?.pending_reports ?? 0}</h3>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Breakdown */}
        <div className="glass-card p-6 rounded-xl shadow-sm border border-slate-200/50">
          <h3 className="text-lg font-bold mb-4">Phân bổ theo trạng thái</h3>
          <div className="space-y-4">
            {byStatus.map(s => (
              <div key={s.status} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{statusLabels[s.status] || s.status}</span>
                  <span className="font-bold">{s.count}</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${(s.count / totalByStatus) * 100}%`,
                    backgroundColor: statusColors[s.status] || '#888'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass-card p-6 rounded-xl shadow-sm border border-slate-200/50">
          <h3 className="text-lg font-bold mb-4">Phân bổ theo danh mục</h3>
          <div className="space-y-3">
            {byCategory.map(c => (
              <div key={c.category_id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                <span className="font-medium">{c.name}</span>
                <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-md font-bold">{c.total_reports} sự cố</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Reports */}
      <section className="glass-card p-6 rounded-xl shadow-sm border border-slate-200/50 overflow-hidden">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">list_alt</span>
          Báo cáo gần đây
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200/50 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Tiêu đề</th>
                <th className="py-3 px-4">Danh mục</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Người báo cáo</th>
                <th className="py-3 px-4">Ngày</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map(r => (
                <tr key={r.report_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4"><a href={`/report/${r.report_id}`} className="font-medium text-primary hover:underline">{r.title}</a></td>
                  <td className="py-3 px-4">{r.category_name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full text-xs font-bold" style={{
                      backgroundColor: `${statusColors[r.status]}20`,
                      color: statusColors[r.status]
                    }}>
                      {statusLabels[r.status]}
                    </span>
                  </td>
                  <td className="py-3 px-4">{r.reporter_name}</td>
                  <td className="py-3 px-4 text-slate-500">{new Date(r.created_at).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
