/**
 * Tiện ích cho Dashboard sự cố (thuần JS, dùng lại được ở View/Controller).
 */

export const LIVE_MAP_RADIUS_KM = 30;

export const STATUS_CONFIG = {
  pending: {
    label: 'Chờ tiếp nhận',
    color: '#f59e0b',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
  },
  in_progress: {
    label: 'Đang xử lý',
    color: '#3b82f6',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
  },
  completed: {
    label: 'Đã hoàn thành',
    color: '#10b981',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
  },
  cancelled: {
    label: 'Đã hủy',
    color: '#ef4444',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
  },
};

export const getStatusConfig = (status) =>
  STATUS_CONFIG[status] ?? {
    label: status ?? '—',
    color: '#64748b',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
  };

/**
 * @param {Array<{ status?: string }>} reports
 */
export const buildDashboardStats = (reports) => {
  const list = Array.isArray(reports) ? reports : [];
  const total = list.length;
  const pending = list.filter((r) => r.status === 'pending').length;
  const inProgress = list.filter((r) => r.status === 'in_progress').length;
  const completed = list.filter((r) => r.status === 'completed').length;
  const pct = total ? ((completed / total) * 100).toFixed(1) : '0';
  return { total, pending, inProgress, completed, completedPercent: `${pct}%` };
};

export const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const toR = (d) => (d * Math.PI) / 180;
  const dLat = toR(lat2 - lat1);
  const dLon = toR(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export const filterReportsWithinKm = (reports, lat, lng, km) =>
  (reports || []).filter((r) => {
    if (r.latitude == null || r.longitude == null) return false;
    return haversineKm(lat, lng, Number(r.latitude), Number(r.longitude)) <= km;
  });

export const filterReportsBySearch = (reports, query) => {
  const q = (query || '').trim().toLowerCase();
  if (!q) return reports;
  return (reports || []).filter(
    (r) =>
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q))
  );
};

export const formatRelativeOrDate = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  if (h < 24) return `${h} giờ trước`;
  if (d < 7) return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
};

/** Chuẩn hóa báo cáo cho VietMap (cần category_name string) */
export const normalizeReportsForMap = (reports) =>
  (reports || []).map((r) => ({
    ...r,
    category_name: r.category_name ?? '',
  }));
