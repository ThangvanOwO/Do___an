/**
 * Model: dữ liệu thuần + quy tắc nghiệp vụ chi tiết báo cáo (không UI).
 */

export const API_ORIGIN = 'http://localhost:5000';

export function mediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_ORIGIN}${path}`;
}

export function categoryTextLooksCorrupt(s) {
  if (s == null) return true;
  const t = String(s);
  if (!t.trim()) return true;
  if (t.includes('\uFFFD')) return true;
  if (/\?{2,}/.test(t)) return true;
  return false;
}

export function buildCategoriesMap(list) {
  const m = {};
  (list || []).forEach((c) => {
    m[c.category_id] = c;
  });
  return m;
}

export function resolveCategoryName(report, categoriesById) {
  if (!report) return '—';
  const joined = report.category_name;
  if (!categoryTextLooksCorrupt(joined)) return String(joined).trim();
  const mapped = report.category_id && categoriesById[report.category_id];
  if (mapped?.name && !categoryTextLooksCorrupt(mapped.name)) return String(mapped.name).trim();
  return (joined && String(joined).trim()) || '—';
}

export function resolveCategoryDescription(report, categoriesById) {
  if (!report) return '';
  const joined = report.category_description;
  if (!categoryTextLooksCorrupt(joined) && joined && String(joined).trim()) return String(joined).trim();
  const mapped = report.category_id && categoriesById[report.category_id];
  if (mapped?.description && String(mapped.description).trim()) return String(mapped.description).trim();
  return '';
}

export function getAssigneeFromLogs(logs) {
  if (!logs?.length) return '';
  const rev = [...logs].reverse();
  const hit = rev.find((l) => l.changed_by_role === 'admin' || l.changed_by_role === 'staff');
  return hit?.changed_by_name || '';
}

export function teamLabelFromCategory(catName, priorityLevel) {
  const n = Number(priorityLevel);
  const base =
    n === 1 ? 'Phản ứng nhanh' : n === 2 ? 'Kỹ thuật / hiện trường' : n === 3 ? 'Tiếp nhận & theo dõi' : 'Điều phối';
  return catName && catName !== '—' ? `${base} · ${catName}` : base;
}

export function priorityUI(level) {
  const labels = { 1: 'Nghiêm trọng', 2: 'Trung bình', 3: 'Thấp' };
  const dots = { 1: 'bg-error', 2: 'bg-amber-500', 3: 'bg-slate-400' };
  return {
    label: labels[level] || '—',
    dotClass: dots[level] || 'bg-slate-300',
    isSevere: Number(level) === 1,
  };
}

export const STATUS_UI = {
  pending: { label: 'Chờ tiếp nhận', badgeClass: 'bg-amber-50 text-amber-800 ring-1 ring-amber-100' },
  in_progress: { label: 'Đang xử lý', badgeClass: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  completed: { label: 'Đã hoàn thành', badgeClass: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100' },
  cancelled: { label: 'Đã hủy', badgeClass: 'bg-red-50 text-red-800 ring-1 ring-red-100' },
  confirmed: { label: 'Đã xác nhận', badgeClass: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  resolved: { label: 'Đã hoàn thành', badgeClass: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100' },
  rejected: { label: 'Đã từ chối', badgeClass: 'bg-red-50 text-red-800 ring-1 ring-red-100' },
};

export function statusUI(status) {
  return (
    STATUS_UI[status] || {
      label: status || '—',
      badgeClass: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
    }
  );
}

export function timelineStatusLabel(s) {
  const map = {
    pending: 'Chờ tiếp nhận',
    in_progress: 'Đang xử lý',
    completed: 'Đã hoàn thành',
    cancelled: 'Đã hủy',
    confirmed: 'Đã xác nhận',
    resolved: 'Đã hoàn thành',
    rejected: 'Đã từ chối',
  };
  return map[s] || s || '—';
}

export const ROLE_LABELS_VI = {
  citizen: 'Người dân',
  admin: 'Quản lý',
  staff: 'Nhân viên',
};

/**
 * Danh sách ảnh hiển thị: ưu tiên mảng images, fallback image_url legacy.
 */
export function collectReportImages(report) {
  if (!report) return [];
  const out = [];
  if (report.image_url) out.push({ key: 'legacy', url: mediaUrl(report.image_url) });
  (report.images || []).forEach((img) => {
    out.push({ key: img.image_id, url: mediaUrl(img.image_url) });
  });
  return out;
}

/**
 * Dữ liệu đã chuẩn hóa cho View (tránh logic trong JSX).
 */
export function buildReportDetailDisplay(report, categoriesById) {
  if (!report) return null;
  const catName = resolveCategoryName(report, categoriesById);
  const catDesc = resolveCategoryDescription(report, categoriesById);
  const pri = priorityUI(report.priority_level);
  const st = statusUI(report.status);
  return {
    categoryName: catName,
    categoryDescription: catDesc,
    assignee: getAssigneeFromLogs(report.logs) || '—',
    team: teamLabelFromCategory(catName, report.priority_level),
    priorityLabel: pri.label,
    priorityDotClass: pri.dotClass,
    prioritySevere: pri.isSevere,
    statusLabel: st.label,
    statusBadgeClass: st.badgeClass,
    shortId: report.report_id ? `#${String(report.report_id).slice(0, 8)}` : '#—',
    formattedTime: report.created_at
      ? new Date(report.created_at).toLocaleString('vi-VN')
      : '—',
    locationLine:
      report.latitude != null && report.longitude != null
        ? `Tọa độ: ${Number(report.latitude).toFixed(5)}, ${Number(report.longitude).toFixed(5)}`
        : 'Chưa có tọa độ',
    reporterLine: report.reporter_name || '—',
    reporterPhone: report.reporter_phone || '—',
    images: collectReportImages(report),
  };
}
