import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
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
  List,
  ChevronUp,
} from 'lucide-react';
import VietMap from '../VietMap';
import SettingsPage from '../../pages/SettingsPage';
import AnalyticsPanel from './AnalyticsPanel';
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
      className={`incident-card w-full text-left bg-white dark:bg-slate-800/80 p-5 rounded-lg border shadow-sm hover:border-primary/40 cursor-pointer group ${
        active ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 dark:border-slate-600'
      }`}
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <h4 className="font-headline font-bold text-lg text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-primary transition-colors">
          {report.title}
        </h4>
        <span
          className={`shrink-0 text-[10px] font-bold px-3 py-1 rounded-full uppercase whitespace-nowrap ${cfg.badgeBg} ${cfg.badgeText}`}
        >
          {cfg.label}
        </span>
      </div>
      {report.description ? (
        <p className="text-slate-500 dark:text-slate-400 font-label text-sm line-clamp-2 mb-4">{report.description}</p>
      ) : null}
      <div className="flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-1.5 font-label text-xs font-medium">
          <span>{formatRelativeOrDate(report.created_at)}</span>
        </div>
        <span className="text-[10px] font-bold tracking-tight text-slate-500 dark:text-slate-400">
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
    <div className="bg-white dark:bg-slate-800/80 p-6 rounded-lg border border-slate-200/80 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${iconWrapClass}`}>
          <Icon className="w-5 h-5 text-current" strokeWidth={2} />
        </div>
        {extra ? <span className="text-xs font-label font-medium text-slate-500 dark:text-slate-400">{extra}</span> : null}
      </div>
      <h3 className="text-slate-500 dark:text-slate-400 font-label text-xs uppercase font-semibold">{title}</h3>
      <p className="text-3xl font-headline font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
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
  const [liveListOpen, setLiveListOpen] = useState(false);
  const [liveSidebarHover, setLiveSidebarHover] = useState(false);

  const liveRailCollapsed = navMode === 'live' && !liveSidebarHover;

  const layoutGutter = useMemo(() => {
    if (navMode === 'live' && !liveSidebarHover) {
      return { ml: 'ml-14', headerW: 'w-[calc(100%-3.5rem)]', drawerLeft: 'left-14' };
    }
    if (navMode === 'live') {
      return { ml: 'ml-64', headerW: 'w-[calc(100%-16rem)]', drawerLeft: 'left-64' };
    }
    return { ml: 'ml-20 md:ml-64', headerW: 'w-[calc(100%-5rem)] md:w-[calc(100%-16rem)]', drawerLeft: 'left-20 md:left-64' };
  }, [navMode, liveSidebarHover]);

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
    setLiveListOpen(false);
    setLiveSidebarHover(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLiveMap = useCallback((e) => {
    e.preventDefault();
    setNavMode('live');
    setLiveListOpen(false);
    setLiveSidebarHover(false);
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

  const handleIncidentReports = useCallback((e) => {
    e.preventDefault();
    setNavMode('incident_reports');
    setLiveSidebarHover(false);
    document.getElementById('incident-reports')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleAnalytics = useCallback((e) => {
    e.preventDefault();
    setNavMode('analytics');
    setLiveSidebarHover(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSettings = useCallback((e) => {
    e.preventDefault();
    setNavMode('settings');
    setLiveSidebarHover(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Camera Live Map: về vị trí user hoặc fit toàn bộ marker
  useEffect(() => {
    if (navMode !== 'live') return;
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    const run = () => {
      if (typeof map.isStyleLoaded === 'function' && !map.isStyleLoaded()) return;
      if (liveMapUserPos) {
        map.flyTo({ center: [liveMapUserPos.lng, liveMapUserPos.lat], zoom: 14, essential: true });
        return;
      }
      if (mapReports.length === 0) {
        map.flyTo({ center: HCMC_CENTER, zoom: 12, essential: true });
        return;
      }
      if (mapReports.length === 1) {
        map.flyTo({
          center: [Number(mapReports[0].longitude), Number(mapReports[0].latitude)],
          zoom: 15,
          essential: true,
        });
        return;
      }
      const lngs = mapReports.map((r) => Number(r.longitude));
      const lats = mapReports.map((r) => Number(r.latitude));
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: { top: 100, bottom: 140, left: 72, right: 72 }, maxZoom: 16, duration: 650 }
      );
    };
    const t = window.setTimeout(run, 200);
    return () => window.clearTimeout(t);
  }, [navMode, liveMapUserPos, mapReports]);

  const roleLabel = { citizen: 'Người dân', admin: 'Quản lý', staff: 'Nhân viên' }[currentUser.role] ?? currentUser.role;

  const initials = (currentUser.full_name || '?')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const navLinkClass = (active) =>
    `flex items-center cursor-pointer rounded-l-lg transition-all duration-200 ${
      liveRailCollapsed ? 'justify-center px-0 py-3 min-h-[44px]' : 'gap-3 px-6 py-4'
    } ${
      active
        ? 'bg-blue-600/10 text-blue-400 font-semibold border-r-4 border-blue-500'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;

  const navLabelClass =
    navMode === 'live' ? (liveSidebarHover ? 'block font-label text-sm truncate' : 'hidden') : 'hidden md:block font-label text-sm';

  const brandBlockClass =
    navMode === 'live' ? (liveSidebarHover ? 'block min-w-0' : 'hidden') : 'hidden md:block min-w-0';

  const sidebarChrome = (
    <>
      <div
        className={`flex items-center shrink-0 ${
          liveRailCollapsed ? 'mb-8 justify-center px-0' : 'mb-10 gap-3 px-6'
        }`}
      >
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div className={brandBlockClass}>
          <h1 className="text-xl font-bold text-white tracking-tight truncate">Sự Cố 24/7</h1>
          <p className="text-[10px] text-slate-400 font-label uppercase tracking-widest">Incident Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-x-hidden">
        <a
          href="#"
          className={navLinkClass(navMode === 'overview')}
          onClick={handleOverview}
          title={liveRailCollapsed ? 'Overview' : undefined}
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          <span className={navLabelClass}>Overview</span>
        </a>
        <a
          href="#live-map"
          className={navLinkClass(navMode === 'live')}
          onClick={handleLiveMap}
          title={liveRailCollapsed ? 'Live Map' : undefined}
        >
          <Map className="w-5 h-5 shrink-0" />
          <span className={navLabelClass}>Live Map</span>
        </a>
        <a
          href="#"
          className={navLinkClass(navMode === 'incident_reports')}
          onClick={handleIncidentReports}
          title={liveRailCollapsed ? 'Incident Reports' : undefined}
        >
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className={navLabelClass}>Incident Reports</span>
        </a>
        <a
          href="#"
          className={navLinkClass(navMode === 'analytics')}
          onClick={handleAnalytics}
          title={liveRailCollapsed ? 'Analytics' : undefined}
        >
          <BarChart3 className="w-5 h-5 shrink-0" />
          <span className={navLabelClass}>Analytics</span>
        </a>
        <a
          href="#"
          className={navLinkClass(navMode === 'settings')}
          onClick={handleSettings}
          title={liveRailCollapsed ? 'Settings' : undefined}
        >
          <Settings className="w-5 h-5 shrink-0" />
          <span className={navLabelClass}>Settings</span>
        </a>
      </nav>

      <div className={`mt-auto py-4 ${liveRailCollapsed ? 'px-1' : 'px-6'}`}>
        <div
          className={`flex items-center rounded-xl bg-slate-800/50 border border-transparent ${
            liveRailCollapsed ? 'justify-center p-2' : 'gap-3 p-3'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shrink-0">
            {initials}
          </div>
          <div
            className={`min-w-0 ${
              liveRailCollapsed ? 'hidden' : navMode === 'live' ? 'block' : 'hidden md:block'
            }`}
          >
            <p className="text-xs font-bold text-white truncate">{currentUser.full_name}</p>
            <p className="text-[10px] text-slate-500 font-label">{roleLabel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          title={liveRailCollapsed ? 'Đăng xuất' : undefined}
          className={`mt-3 w-full flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-medium ${
            liveRailCollapsed ? 'px-0 py-2.5' : 'gap-2 px-4 py-2'
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className={liveRailCollapsed ? 'hidden' : navMode === 'live' ? 'inline' : 'hidden md:inline'}>Đăng xuất</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f9f9ff] dark:bg-background-dark text-[#111c2d] dark:text-slate-100 font-display antialiased">
      {navMode === 'live' ? (
        <div
          className={`fixed left-0 top-0 z-40 flex h-screen flex-col bg-slate-900 py-8 shadow-[4px_0_24px_rgba(0,0,0,0.12)] transition-[width] duration-300 ease-out dark:shadow-[4px_0_24px_rgba(0,0,0,0.4)] ${
            liveRailCollapsed ? 'w-14' : 'w-64'
          }`}
          onMouseEnter={() => setLiveSidebarHover(true)}
          onMouseLeave={() => setLiveSidebarHover(false)}
        >
          {sidebarChrome}
        </div>
      ) : (
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-20 flex-col bg-slate-900 py-8 md:w-64">{sidebarChrome}</aside>
      )}

      <header
        className={`bg-slate-50/70 dark:bg-slate-900/95 dark:border-b dark:border-slate-700/50 backdrop-blur-xl fixed top-0 z-30 flex justify-between items-center px-8 py-4 ${layoutGutter.ml} ${layoutGutter.headerW}`}
      >
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            className="w-full bg-slate-200/50 dark:bg-slate-700/80 dark:text-slate-100 dark:placeholder-slate-400 border-none rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 font-label outline-none"
            placeholder="Tìm kiếm sự cố..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button type="button" className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full p-2 transition-colors relative shrink-0">
          <Bell className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full border-2 border-white" />
        </button>
      </header>

      <main
        className={`${layoutGutter.ml} flex flex-col ${
          navMode === 'live' ? 'h-screen pt-24 overflow-hidden' : 'p-8 pt-24 min-h-screen space-y-8'
        }`}
      >
        {navMode === 'settings' ? (
          <div className="dashboard-settings-embed">
            <style>{`
              .dashboard-settings-embed aside { display: none !important; }
              .dashboard-settings-embed main { margin-left: 0 !important; padding: 0 !important; min-height: auto !important; }
            `}</style>
            <SettingsPage />
          </div>
        ) : navMode === 'incident_reports' ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-6 scroll-mt-24">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-headline font-bold tracking-tight text-slate-900 dark:text-slate-100">Sự cố mới nhất</h2>
                <span className="text-primary font-label text-sm font-semibold">Xem tất cả</span>
              </div>
              <div id="incident-reports" className="space-y-4 max-h-[700px] overflow-y-auto pr-1 [scrollbar-width:thin]">
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
            </div>

            <div className="space-y-6">
              <div
                id="analytics-card"
                className="bg-slate-900 p-6 rounded-lg relative overflow-hidden group"
              >
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
        ) : navMode === 'analytics' ? (
          <AnalyticsPanel reports={reports} />
        ) : navMode === 'live' ? (
          <div className="flex flex-1 flex-col min-h-0 w-full relative bg-slate-200 dark:bg-slate-950">
            <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-start justify-between gap-3 pointer-events-none">
              <div className="pointer-events-auto max-w-md rounded-2xl border border-slate-200/80 bg-white/95 px-5 py-3 shadow-lg backdrop-blur-md dark:border-slate-600 dark:bg-slate-900/95">
                <h2 className="font-headline text-lg font-bold text-slate-900 dark:text-slate-100">Live Map</h2>
                <p className="font-label text-xs text-slate-500 dark:text-slate-400">Toàn màn hình · Chạm pin để xem chi tiết</p>
                {showLiveHint ? (
                  <p className="mt-2 font-label text-xs font-semibold text-primary">
                    Lọc sự cố trong {LIVE_MAP_RADIUS_KM} km quanh vị trí của bạn.
                  </p>
                ) : null}
              </div>
              <Link
                to="/create-report"
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-label text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:opacity-95"
              >
                <Plus className="h-4 w-4" />
                Báo cáo mới
              </Link>
            </div>

            <div className="flex-1 min-h-0 w-full [&_.vietmap-container]:h-full [&_.vietmap-container]:min-h-0 [&_.vietmap-container]:rounded-none [&_.vietmap-container]:border-0">
              <VietMap
                ref={mapRef}
                reports={mapReports}
                center={mapCenter}
                zoom={mapReports.length === 1 ? 15 : 13}
                userLocation={liveMapUserPos}
                onMarkerClick={(r) => openDrawer(r.report_id)}
                containerClassName="!h-full !min-h-[200px] !rounded-none !shadow-none"
                navigationControl={false}
                geolocateControl={false}
              />
            </div>

            <div className="absolute top-24 right-4 z-20 flex flex-col gap-2">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg hover:text-primary dark:bg-slate-800 dark:text-slate-200"
                onClick={() => mapRef.current?.getMap()?.zoomIn({ duration: 300 })}
                aria-label="Phóng to"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg hover:text-primary dark:bg-slate-800 dark:text-slate-200"
                onClick={() => mapRef.current?.getMap()?.zoomOut({ duration: 300 })}
                aria-label="Thu nhỏ"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="mt-1 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg hover:text-primary dark:bg-slate-800 dark:text-slate-200"
                title="Vị trí của tôi"
                onClick={() => {
                  navigator.geolocation?.getCurrentPosition(
                    (pos) => {
                      mapRef.current?.getMap()?.flyTo({
                        center: [pos.coords.longitude, pos.coords.latitude],
                        zoom: 15,
                        essential: true,
                      });
                    },
                    () => {}
                  );
                }}
              >
                <LocateFixed className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg hover:text-primary dark:bg-slate-800 dark:text-slate-200"
                title="Về TP.HCM"
                onClick={() => mapRef.current?.getMap()?.flyTo({ center: HCMC_CENTER, zoom: 12, essential: true })}
              >
                <Home className="h-5 w-5" />
              </button>
            </div>

            <div className="pointer-events-none absolute bottom-6 left-4 right-4 z-20 flex flex-wrap items-end justify-between gap-4">
              <div className="pointer-events-auto flex flex-wrap items-center gap-4 rounded-2xl border border-white/50 bg-white/90 px-5 py-3 shadow-xl backdrop-blur-md dark:border-slate-600 dark:bg-slate-800/90">
                {LEGEND_ROWS.map((row) => (
                  <div key={row.key} className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${row.dotClass}`} />
                    <span className="font-label text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      {row.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLiveListOpen((v) => !v)}
              className="absolute bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 font-label text-sm font-semibold text-slate-800 shadow-lg hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <List className="h-4 w-4" />
              Danh sách ({baseList.length})
              <ChevronUp className={`h-4 w-4 transition-transform ${liveListOpen ? 'rotate-180' : ''}`} />
            </button>

            <div
              className={`absolute bottom-0 left-0 right-0 z-30 max-h-[42vh] rounded-t-2xl border border-slate-200 bg-white shadow-2xl transition-transform duration-300 dark:border-slate-600 dark:bg-slate-900 ${
                liveListOpen ? 'translate-y-0' : 'translate-y-full'
              }`}
            >
              <div className="max-h-[42vh] overflow-y-auto p-4 pt-2 [scrollbar-width:thin]">
                <p className="mb-3 font-label text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Sự cố theo bộ lọc
                </p>
                <div className="space-y-3">
                  {baseList.length === 0 ? (
                    <p className="py-6 text-center font-label text-sm text-slate-400">Không có sự cố phù hợp.</p>
                  ) : (
                    baseList.map((report) =>
                      renderIncidentCardRow({
                        report,
                        active: selectedId === report.report_id,
                        onSelect: (id) => {
                          openDrawer(id);
                          setLiveListOpen(false);
                          const r = reports.find((x) => x.report_id === id);
                          if (r?.longitude != null && r?.latitude != null) {
                            mapRef.current?.getMap()?.flyTo({
                              center: [Number(r.longitude), Number(r.latitude)],
                              zoom: 16,
                              essential: true,
                            });
                          }
                        },
                      })
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
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
                    <h2 className="text-2xl font-headline font-bold tracking-tight text-slate-900 dark:text-slate-100">Giám sát trực tiếp</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-label text-sm">Bản đồ thời gian thực khu vực quản lý</p>
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
                  <div className="absolute bottom-6 left-6 bg-white/85 dark:bg-slate-800/90 backdrop-blur-md px-6 py-4 rounded-xl border border-white/40 dark:border-slate-600 shadow-xl flex flex-wrap items-center gap-4 md:gap-6 z-10 pointer-events-none">
                    {LEGEND_ROWS.map((row) => (
                      <div key={row.key} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${row.dotClass}`} />
                        <span className="text-xs font-label font-bold uppercase text-slate-600 dark:text-slate-300">{row.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-headline font-bold tracking-tight text-slate-900 dark:text-slate-100">Sự cố mới nhất</h2>
                  <span className="text-primary font-label text-sm font-semibold">Xem tất cả</span>
                </div>
                <div id="incident-reports" className="space-y-4 max-h-[700px] overflow-y-auto pr-1 [scrollbar-width:thin]">
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
                <div id="analytics-card" className="bg-slate-900 p-6 rounded-lg relative overflow-hidden group">
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
          </>
        )}
      </main>

      {/* Drawer đơn giản — dữ liệu từ report đã chọn */}
      <div
        className={`fixed inset-0 z-50 bg-black/30 transition-opacity duration-300 ${layoutGutter.drawerLeft} ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeDrawer}
        aria-hidden={!drawerOpen}
      />
      <aside
        className={`fixed top-0 right-0 w-[min(450px,95vw)] h-screen bg-[#f9f9ff] dark:bg-slate-900 shadow-2xl z-50 border-l border-slate-200 dark:border-slate-700 flex flex-col transition-transform duration-300 ease-out ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-8">
          {selectedReport ? (
            <>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-600 shadow-sm">
                <div className="flex justify-between items-start gap-3 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-label font-bold px-3 py-1.5 rounded-full uppercase tracking-wide ${getStatusConfig(selectedReport.status).badgeBg} ${getStatusConfig(selectedReport.status).badgeText}`}
                    >
                      {getStatusConfig(selectedReport.status).label}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 font-label text-xs">#{String(selectedReport.report_id).slice(0, 8)}</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button type="button" className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300"
                      onClick={() => window.print()}
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300"
                      onClick={closeDrawer}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-headline font-bold text-xl text-slate-900 dark:text-slate-100 mb-3">{selectedReport.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 font-label text-sm leading-relaxed">
                  {selectedReport.description || 'Không có mô tả.'}
                </p>
                <p className="mt-4 text-xs font-label text-slate-400 dark:text-slate-500">
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
