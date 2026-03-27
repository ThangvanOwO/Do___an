/**
 * Chuẩn bị dữ liệu cho Analytics (từ mảng reports API).
 */

const STATUS_ORDER = ['pending', 'in_progress', 'completed', 'cancelled'];

export function buildStatusSlices(reports) {
  const list = Array.isArray(reports) ? reports : [];
  const counts = { pending: 0, in_progress: 0, completed: 0, cancelled: 0 };
  for (const r of list) {
    const s = r.status;
    if (counts[s] !== undefined) counts[s] += 1;
  }
  const total = list.length || 1;
  return STATUS_ORDER.map((key) => ({
    key,
    count: counts[key],
    pct: total ? (counts[key] / total) * 100 : 0,
  })).filter((x) => x.count > 0 || list.length === 0);
}

export function buildCategoryBars(reports, limit = 8) {
  const list = Array.isArray(reports) ? reports : [];
  const map = new Map();
  for (const r of list) {
    const name = (r.category_name || 'Khác').trim() || 'Khác';
    map.set(name, (map.get(name) || 0) + 1);
  }
  const rows = [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  const max = rows[0]?.count || 1;
  return rows.map((r) => ({ ...r, widthPct: (r.count / max) * 100 }));
}

export function buildLastNDaysSeries(reports, days = 7) {
  const list = Array.isArray(reports) ? reports : [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    const label = d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' });
    let count = 0;
    for (const r of list) {
      if (!r.created_at) continue;
      const t = new Date(r.created_at);
      if (t.getFullYear() === y && t.getMonth() === m && t.getDate() === day) count += 1;
    }
    series.push({ label, count, date: d });
  }
  const max = Math.max(...series.map((s) => s.count), 1);
  return { series, max };
}
