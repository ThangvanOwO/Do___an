import { useMemo, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  AlertTriangle,
  BarChart3,
  Settings,
  Shield,
  Search,
  Bell,
  LogOut,
  Plus,
  ZoomIn,
  ZoomOut,
  LocateFixed,
  Home,
  Share2,
  Printer,
  X,
  LineChart,
  Loader2,
} from 'lucide-react';
import VietMap from '../VietMap';
import {
  LIVE_MAP_RADIUS_KM,
  buildDashboardStats,
  filterReportsWithinKm,
  filterReportsBySearch,
  formatRelativeOrDate,
  getStatusConfig,
  normalizeReportsForMap,
} from './dashboardUtils';

const HCMC_CENTER = [106.7009, 10.7769];

const NAV_ACTIVE =
  'flex items-center gap-3 bg-blue-600/10 text-blue-400 font-semibold border-r-4 border-blue-500 px-6 py-4 cursor-pointer rounded-l-lg';
const NAV_IDLE =
  'flex items-center gap-3 text-slate-400 px-6 py-4 hover:bg-slate-800 hover:text-white transition-all cursor-pointer rounded-l-lg';

const LEGEND_ROWS = [
  { key: 'pending', dotClass: 'bg-amber-500', label: 'Chờ tiếp nhận' },
  { key: 'in_progress', dotClass: 'bg-primary', label: 'Đang xử lý' },
  { key: 'completed', dotClass: 'bg-emerald-500', label: 'Đã hoàn thành' },
];

/**
 * @typedef {Object} DashboardReport
 * @property {string} report_id
 * @property {string} title
 * @property {string} status
 * @property {string} created_at
 * @property {number} [latitude]
 * @property {number} [longitude]
 * @property {string} [description]
 * @property {string} [category_name]
 */

/**
 * Render một thẻ sự cố trong danh sách (tách hàm cho dễ đọc / test).
 * @param {{ report: DashboardReport, active: boolean, onSelect: (id: string) => void }} props
 */
function renderIncidentCardRow({ report, active, onSelect }) {
  const cfg = getStatusConfig(report.status);
  return (
    <button
      key={report.report_id}
      type="button"
      onClick={() => onSelect(report.report_id)}
      className={`incident-card w-full text-left bg-white p-5 rounded-lg border shadow-sm hover:border-primary/40 cursor-pointer group ${
        active ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200'
      }`}
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <h4 className="font-headline font-bold text-lg text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">
          {report.title}
        </h4>
        <span
          className={`shrink-0 text-[10px] font-bold px-3 py-1 rounded-full uppercase whitespace-nowrap ${cfg.badgeBg} ${cfg.badgeText}`}
        >
          {cfg.label}
        </span>
      </div>
      {report.description ? (
        <p className="text-slate-500 font-label text-sm line-clamp-2 mb-4">{report.description}</p>
      ) : null}
      <div className="flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-1.5 font-label text-xs font-medium">
          <span>{formatRelativeOrDate(report.created_at)}</span>
        </div>
        <span className="text-[10px] font-bold tracking-tight text-slate-500">
          #{String(report.report_id).slice(0, 8)}
        </span>
      </div>
    </button>
  );
}

/**
 * Một ô thống kê (dùng .map() ở component cha).
 */
function StatCard({ icon: Icon, iconWrapClass, title, value, extra }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${iconWrapClass}`}>
          <Icon className="w-5 h-5 text-current" strokeWidth={2} />
        </div>
        {extra ? <span className="text-xs font-label font-medium text-slate-500">{extra}</span> : null}
      </div>
      <h3 className="text-slate-500 font-label text-xs uppercase font-semibold">{title}</h3>
      <p className="text-3xl font-headline font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

const STAT_DEFS = [
  {
    key: 'total',
    title: 'Tổng sự cố',
    iconWrapClass: 'bg-primary/10 text-primary',
    icon: BarChart3,
    value: (s) => s.total,
  },
  {
    key: 'pending',
    title: 'Chờ tiếp nhận',
    iconWrapClass: 'bg-amber-100 text-amber-600',
    icon: AlertTriangle,
    value: (s) => s.pending,
    extra: 'Cần xử lý',
  },
  {
    key: 'in_progress',
    title: 'Đang xử lý',
    iconWrapClass: 'bg-primary/10 text-primary',
    icon: Settings,
    value: (s) => s.inProgress,
    extra: 'Đang sửa',
  },
  {
    key: 'completed',
    title: 'Đã hoàn thành',
    iconWrapClass: 'bg-emerald-100 text-emerald-600',
    icon: LayoutDashboard,
    value: (s) => s.completed,
    extra: (s) => s.completedPercent,
  },
];

/**
 * Dashboard quản lý sự cố (React).
 * Dữ liệu: mảng `reports` (tối thiểu: report_id, title, status, created_at; thêm latitude/longitude để hiện trên bản đồ).
 */
export default function IncidentManagementDashboard({
  reports = [],
  currentUser = { full_name: 'Người dùng', role: 'citizen' },
  onLogout = () => {},
}) {
  const mapRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [navMode, setNavMode] = useState('overview');
  const [liveMapUserPos, setLiveMapUserPos] = useState(null);
  const [showLiveHint, setShowLiveHint] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const baseList = useMemo(() => {
    let list = Array.isArray(reports) ? reports : [];
    if (liveMapUserPos) {
      list = filterReportsWithinKm(list, liveMapUserPos.lat, liveMapUserPos.lng, LIVE_MAP_RADIUS_KM);
    }
    return filterReportsBySearch(list, searchQuery);
  }, [reports, liveMapUserPos, searchQuery]);

  const stats = useMemo(() => buildDashboardStats(baseList), [baseList]);

  const mapReports = useMemo(
    () => normalizeReportsForMap(baseList.filter((r) => r.latitude != null && r.longitude != null)),
    [baseList]
  );

  const mapCenter = useMemo(() => {
    if (mapReports.length === 1) {
      return [mapReports[0].longitude, mapReports[0].latitude];
    }
    return HCMC_CENTER;
  }, [mapReports]);

  const selectedReport = useMemo(
    () => (selectedId ? reports.find((r) => r.report_id === selectedId) : null),
    [reports, selectedId]
  );

  const openDrawer = useCallback((id) => {
    setSelectedId(id);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const handleOverview = useCallback((e) => {
    e.preventDefault();
    setNavMode('overview');
    setLiveMapUserPos(null);
    setShowLiveHint(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLiveMap = useCallback((e) => {
    e.preventDefault();
    setNavMode('live');
    document.getElementById('live-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!navigator.geolocation) {
      setLiveMapUserPos(null);
      setShowLiveHint(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLiveMapUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setShowLiveHint(true);
      },
      () => {
        setLiveMapUserPos(null);
        setShowLiveHint(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  const roleLabel = { citizen: 'Người dân', admin: 'Quản lý', staff: 'Nhân viên' }[currentUser.role] ?? currentUser.role;

  const initials = (currentUser.full_name || '?')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2d] font-display antialiased">
      <aside className="bg-slate-900 h-screen w-20 md:w-64 flex flex-col fixed left-0 top-0 z-40 py-8">
        <div className="px-6 mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="hidden md:block min-w-0">
            <h1 className="text-xl font-bold text-white tracking-tight truncate">Sự Cố 24/7</h1>
            <p className="text-[10px] text-slate-400 font-label uppercase tracking-widest">Incident Management</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <a href="#" className={navMode === 'overview' ? NAV_ACTIVE : NAV_IDLE} onClick={handleOverview}>
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span className="hidden md:block font-label text-sm">Overview</span>
          </a>
          <a href="#live-map" className={navMode === 'live' ? NAV_ACTIVE : NAV_IDLE} onClick={handleLiveMap}>
            <Map className="w-5 h-5 shrink-0" />
            <span className="hidden md:block font-label text-sm">Live Map</span>
          </a>
          <a className={NAV_IDLE} href="#" onClick={(e) => e.preventDefault()}>
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="hidden md:block font-label text-sm">Incident Reports</span>
          </a>
          <a className={NAV_IDLE} href="#" onClick={(e) => e.preventDefault()}>
            <BarChart3 className="w-5 h-5 shrink-0" />
            <span className="hidden md:block font-label text-sm">Analytics</span>
          </a>
          <a className={NAV_IDLE} href="#" onClick={(e) => e.preventDefault()}>
            <Settings className="w-5 h-5 shrink-0" />
            <span className="hidden md:block font-label text-sm">Settings</span>
          </a>
        </nav>

        <div className="mt-auto px-6 py-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-transparent">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shrink-0">
              {initials}
            </div>
            <div className="hidden md:block min-w-0">
              <p className="text-xs font-bold text-white truncate">{currentUser.full_name}</p>
              <p className="text-[10px] text-slate-500 font-label">{roleLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:block">Đăng xuất</span>
          </button>
        </div>
      </aside>

      <header
        className="bg-slate-50/70 backdrop-blur-xl fixed top-0 z-30 flex justify-between items-center px-8 py-4 ml-20 md:ml-64 w-[calc(100%-5rem)] md:w-[calc(100%-16rem)]"
      >
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full bg-slate-200/50 border-none rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 font-label outline-none"
            placeholder="Tìm kiếm sự cố..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button type="button" className="hover:bg-slate-100 rounded-full p-2 transition-colors relative shrink-0">
          <Bell className="w-5 h-5 text-slate-700" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full border-2 border-white" />
        </button>
      </header>

      <main className="ml-20 md:ml-64 p-8 pt-24 min-h-screen space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STAT_DEFS.map((def) => (
            <StatCard
              key={def.key}
              icon={def.icon}
              iconWrapClass={def.iconWrapClass}
              title={def.title}
              value={def.value(stats)}
              extra={typeof def.extra === 'function' ? def.extra(stats) : def.extra ?? null}
            />
          ))}
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div id="live-map" className="xl:col-span-2 space-y-6 scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-headline font-bold tracking-tight text-slate-900">Giám sát trực tiếp</h2>
                <p className="text-slate-500 font-label text-sm">Bản đồ thời gian thực khu vực quản lý</p>
                {showLiveHint ? (
                  <p className="mt-1 text-sm font-label font-semibold text-primary">
                    Đang hiển thị sự cố trong bán kính {LIVE_MAP_RADIUS_KM} km quanh vị trí của bạn.
                  </p>
                ) : null}
              </div>
              <Link
                to="/create-report"
                className="bg-primary hover:opacity-95 text-white px-6 py-2.5 rounded-full font-label text-sm font-semibold shadow-lg shadow-primary/20 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Báo cáo sự cố mới
              </Link>
            </div>

            <div className="relative bg-slate-200 h-[600px] rounded-lg overflow-hidden border border-slate-200 shadow-sm">
              <div className="absolute inset-0 [&_.vietmap-container]:h-full [&_.vietmap-container]:min-h-[400px]">
                <VietMap
                  ref={mapRef}
                  reports={mapReports}
                  center={mapCenter}
                  zoom={mapReports.length === 1 ? 15 : 13}
                  onMarkerClick={(r) => openDrawer(r.report_id)}
                />
              </div>
              <div className="absolute top-6 right-6 flex flex-col gap-2 z-10 pointer-events-auto">
                <button
                  type="button"
                  className="w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-700 hover:text-primary"
                  onClick={() => mapRef.current?.getMap()?.zoomIn({ duration: 300 })}
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-700 hover:text-primary"
                  onClick={() => mapRef.current?.getMap()?.zoomOut({ duration: 300 })}
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-700 hover:text-primary mt-2"
                  title="Vị trí của tôi"
                    onClick={() => {
                    navigator.geolocation?.getCurrentPosition(
                      (pos) => {
                        mapRef.current?.flyTo([pos.coords.longitude, pos.coords.latitude], 15);
                      },
                      () => {}
                    );
                  }}
                >
                  <LocateFixed className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-700 hover:text-primary"
                  title="Về mặc định"
                  onClick={() => mapRef.current?.flyTo(HCMC_CENTER, 13)}
                >
                  <Home className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute bottom-6 left-6 bg-white/85 backdrop-blur-md px-6 py-4 rounded-xl border border-white/40 shadow-xl flex flex-wrap items-center gap-4 md:gap-6 z-10 pointer-events-none">
                {LEGEND_ROWS.map((row) => (
                  <div key={row.key} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${row.dotClass}`} />
                    <span className="text-xs font-label font-bold uppercase text-slate-600">{row.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-headline font-bold tracking-tight text-slate-900">Sự cố mới nhất</h2>
              <span className="text-primary font-label text-sm font-semibold">Xem tất cả</span>
            </div>
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1 [scrollbar-width:thin]">
              {baseList.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Loader2 className="w-10 h-10 mx-auto mb-2 animate-spin opacity-50" />
                  <p className="font-label text-sm">Không có sự cố phù hợp bộ lọc.</p>
                </div>
              ) : (
                baseList.map((report) =>
                  renderIncidentCardRow({
                    report,
                    active: selectedId === report.report_id,
                    onSelect: openDrawer,
                  })
                )
              )}
            </div>
            <div className="bg-slate-900 p-6 rounded-lg relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-white font-headline font-bold text-lg">Báo cáo phân tích</h3>
                <p className="text-slate-400 font-label text-sm mt-1">Xem xu hướng sự cố hàng tháng.</p>
                <button
                  type="button"
                  className="mt-4 bg-white text-slate-900 px-4 py-2 rounded-full text-xs font-bold hover:bg-primary hover:text-white transition-colors"
                >
                  Tải PDF ngay
                </button>
              </div>
              <LineChart className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 rotate-12 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>
      </main>

      {/* Drawer đơn giản — dữ liệu từ report đã chọn */}
      <div
        className={`fixed inset-0 left-20 md:left-64 z-50 bg-black/30 transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeDrawer}
        aria-hidden={!drawerOpen}
      />
      <aside
        className={`fixed top-0 right-0 w-[min(450px,95vw)] h-screen bg-[#f9f9ff] shadow-2xl z-50 border-l border-slate-200 flex flex-col transition-transform duration-300 ease-out ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-8">
          {selectedReport ? (
            <>
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <div className="flex justify-between items-start gap-3 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-label font-bold px-3 py-1.5 rounded-full uppercase tracking-wide ${getStatusConfig(selectedReport.status).badgeBg} ${getStatusConfig(selectedReport.status).badgeText}`}
                    >
                      {getStatusConfig(selectedReport.status).label}
                    </span>
                    <span className="text-slate-400 font-label text-xs">#{String(selectedReport.report_id).slice(0, 8)}</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button type="button" className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600">
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600"
                      onClick={() => window.print()}
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600"
                      onClick={closeDrawer}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-headline font-bold text-xl text-slate-900 mb-3">{selectedReport.title}</h3>
                <p className="text-slate-600 font-label text-sm leading-relaxed">
                  {selectedReport.description || 'Không có mô tả.'}
                </p>
                <p className="mt-4 text-xs font-label text-slate-400">
                  Báo lúc: {new Date(selectedReport.created_at).toLocaleString('vi-VN')}
                </p>
                <Link
                  to={`/report/${selectedReport.report_id}`}
                  className="mt-4 inline-block w-full text-center py-3 rounded-full bg-primary text-white font-label text-sm font-bold hover:opacity-95"
                  onClick={closeDrawer}
                >
                  Xem chi tiết đầy đủ
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
