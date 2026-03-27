import { useMemo } from 'react';
import { TrendingUp, PieChart, Layers, Sparkles } from 'lucide-react';
import { getStatusConfig, buildDashboardStats } from './dashboardUtils';
import { buildStatusSlices, buildCategoryBars, buildLastNDaysSeries } from './analyticsUtils';

const COLORS = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  completed: '#10b981',
  cancelled: '#f43f5e',
};

/** Donut SVG — viền mảnh, khe trắng giữa các cung */
function StatusDonut({ slices, total }) {
  const cx = 100;
  const cy = 100;
  const rOuter = 78;
  const rInner = 52;
  const gap = 2.5; // degrees gap between segments

  let angle = -90;
  const paths = [];
  const full = total > 0 ? total : 1;

  for (const s of slices) {
    if (s.count === 0 && total > 0) continue;
    const frac = s.count / full;
    const sweep = frac * 360 - gap;
    if (sweep <= 0) continue;
    const start = (angle * Math.PI) / 180;
    const end = ((angle + sweep) * Math.PI) / 180;

    const x1o = cx + rOuter * Math.cos(start);
    const y1o = cy + rOuter * Math.sin(start);
    const x2o = cx + rOuter * Math.cos(end);
    const y2o = cy + rOuter * Math.sin(end);
    const x1i = cx + rInner * Math.cos(end);
    const y1i = cy + rInner * Math.sin(end);
    const x2i = cx + rInner * Math.cos(start);
    const y2i = cy + rInner * Math.sin(start);

    const large = sweep > 180 ? 1 : 0;
    const d = [
      `M ${x1o} ${y1o}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${x2o} ${y2o}`,
      `L ${x1i} ${y1i}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${x2i} ${y2i}`,
      'Z',
    ].join(' ');

    paths.push(
      <path
        key={s.key}
        d={d}
        fill={COLORS[s.key] || '#64748b'}
        className="transition-opacity duration-300 hover:opacity-90"
        stroke="rgba(15,23,42,0.35)"
        strokeWidth="0.5"
      />
    );
    angle += sweep + gap;
  }

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-full max-w-[220px] drop-shadow-[0_8px_32px_rgba(59,130,246,0.15)]">
        <defs>
          <filter id="glow-donut" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#glow-donut)">{paths}</g>
        <circle cx={cx} cy={cy} r={rInner - 4} className="fill-slate-900/90 dark:fill-slate-950/95" />
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className="fill-slate-400 text-[11px] font-label uppercase tracking-widest"
        >
          Tổng
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" className="fill-white font-headline text-2xl font-bold">
          {total}
        </text>
      </svg>
    </div>
  );
}

/** Biểu đồ vùng + đường cong mượt */
function TrendAreaChart({ series, max }) {
  const w = 560;
  const h = 200;
  const pad = { t: 16, r: 16, b: 36, l: 44 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const n = series.length || 1;

  const points = series.map((s, i) => {
    const x = pad.l + (i / Math.max(n - 1, 1)) * innerW;
    const y = pad.t + innerH - (s.count / max) * innerH * 0.92;
    return { x, y, ...s };
  });

  const lineD =
    points.length === 0
      ? ''
      : points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');

  const areaD =
    points.length === 0
      ? ''
      : `${lineD} L ${points[points.length - 1].x} ${pad.t + innerH} L ${points[0].x} ${pad.t + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[220px]">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={pad.l}
          y1={pad.t + innerH * t}
          x2={w - pad.r}
          y2={pad.t + innerH * t}
          stroke="currentColor"
          className="text-slate-700/40"
          strokeWidth="0.5"
          strokeDasharray="4 6"
        />
      ))}
      {areaD ? <path d={areaD} fill="url(#areaGrad)" /> : null}
      {lineD ? (
        <path
          d={lineD}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" className="fill-slate-900 stroke-[#3b82f6]" strokeWidth="2" />
          <text
            x={p.x}
            y={h - 8}
            textAnchor="middle"
            className="fill-slate-500 text-[9px] font-label"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function CategoryLuxBars({ rows }) {
  if (!rows.length) {
    return (
      <p className="text-slate-500 font-label text-sm py-8 text-center">Chưa có phân bổ danh mục</p>
    );
  }
  return (
    <div className="space-y-4">
      {rows.map((r, i) => (
        <div key={r.name} className="group">
          <div className="flex justify-between text-xs font-label mb-1.5">
            <span className="text-slate-300 truncate pr-2 font-medium">{r.name}</span>
            <span className="text-slate-400 tabular-nums">{r.count}</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-800/80 overflow-hidden ring-1 ring-slate-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600/90 via-indigo-500 to-cyan-400/90 transition-all duration-700 ease-out group-hover:brightness-110"
              style={{ width: `${Math.max(r.widthPct, 4)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPanel({ reports = [] }) {
  const slices = useMemo(() => buildStatusSlices(reports), [reports]);
  const categoryRows = useMemo(() => buildCategoryBars(reports, 8), [reports]);
  const { series, max } = useMemo(() => buildLastNDaysSeries(reports, 7), [reports]);
  const total = reports.length;
  const fullStats = useMemo(() => buildDashboardStats(reports), [reports]);

  const summaryLine = useMemo(() => {
    const { pending, inProgress, completed } = fullStats;
    return `${pending} chờ · ${inProgress} đang xử lý · ${completed} hoàn thành`;
  }, [fullStats]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-primary/90 font-label text-xs font-semibold uppercase tracking-[0.2em] mb-2">
            <Sparkles className="w-4 h-4" />
            Analytics
          </div>
          <h2 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight text-slate-900 dark:text-white">
            Phân tích sự cố
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-label text-sm mt-2 max-w-xl">
            Tổng quan trạng thái, xu hướng 7 ngày và phân bổ theo danh mục — dữ liệu theo báo cáo hiện tại.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm px-5 py-3 shadow-sm">
          <p className="text-[10px] font-label uppercase tracking-wider text-slate-500">Tóm tắt nhanh</p>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">{summaryLine || '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Cột trái: donut + legend */}
        <div className="xl:col-span-4 rounded-2xl border border-slate-200/90 dark:border-slate-700/70 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white p-8 shadow-xl shadow-slate-900/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_50%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_45%)] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-xl bg-white/10 ring-1 ring-white/10">
                <PieChart className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg">Trạng thái</h3>
                <p className="text-slate-400 text-xs font-label">Phân bổ theo pipeline xử lý</p>
              </div>
            </div>
            <StatusDonut slices={slices} total={total} />
            <ul className="mt-8 space-y-3">
              {['pending', 'in_progress', 'completed', 'cancelled'].map((key) => {
                const cfg = getStatusConfig(key);
                const row = slices.find((s) => s.key === key);
                const c = row?.count ?? 0;
                return (
                  <li key={key} className="flex items-center justify-between text-sm font-label">
                    <span className="flex items-center gap-2 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[key] }} />
                      {cfg.label}
                    </span>
                    <span className="text-white font-semibold tabular-nums">{c}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Cột phải: trend */}
        <div className="xl:col-span-8 rounded-2xl border border-slate-200/90 dark:border-slate-700/70 bg-white dark:bg-slate-900/50 p-6 md:p-8 shadow-lg dark:shadow-none">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg text-slate-900 dark:text-white">Xu hướng 7 ngày</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-label">Số báo cáo mới theo ngày</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 p-4 mt-4">
            {total === 0 ? (
              <p className="text-center text-slate-500 font-label py-16">Chưa có dữ liệu để vẽ biểu đồ</p>
            ) : (
              <TrendAreaChart series={series} max={max} />
            )}
          </div>
        </div>
      </div>

      {/* Hàng dưới: category bars */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700/70 bg-gradient-to-br from-white to-slate-50/90 dark:from-slate-900 dark:to-slate-950 p-6 md:p-8 shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-headline font-bold text-lg text-slate-900 dark:text-white">Theo danh mục</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-label">Top danh mục có nhiều sự cố nhất</p>
          </div>
        </div>
        <div className="max-w-3xl">
          <CategoryLuxBars rows={categoryRows} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-6 py-2.5 text-sm font-label font-semibold text-slate-700 dark:text-slate-200 hover:border-primary hover:text-primary transition-colors"
        >
          Xuất báo cáo (sắp có)
        </button>
      </div>
    </div>
  );
}
