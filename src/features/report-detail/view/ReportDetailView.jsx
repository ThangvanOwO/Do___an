/**
 * View: chỉ hiển thị + tương tác UI (không gọi API trực tiếp).
 */
import VietMap from '../../../components/VietMap';
import { mediaUrl, timelineStatusLabel, ROLE_LABELS_VI } from '../model/reportDetailModel';

function Icon({ name, className = '', filled = false }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}

export function ReportDetailView({
  loading,
  error,
  report,
  display,
  goBack,
  userLocation,
  setUserLocation,
  routeData,
  routeLoading,
  routeError,
  routeInfo,
  showInstructions,
  setShowInstructions,
  vehicle,
  onVehicleChange,
  handleGetRoute,
  handleClearRoute,
}) {
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-display text-on-surface/70">
        <Icon name="hourglass_empty" className="mr-2 animate-pulse" />
        Đang tải chi tiết sự cố…
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto py-16 px-6 text-center font-display">
        <Icon name="error" className="text-4xl text-error mb-3" />
        <h2 className="text-lg font-bold text-on-surface mb-4">{error}</h2>
        <button
          type="button"
          onClick={() => goBack()}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white hover:opacity-95"
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (!report || !display) return null;

  const logs = [...(report.logs || [])].reverse();

  return (
    <main className="font-display bg-surface text-on-surface antialiased pb-16">
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-6 md:py-10">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-2 text-primary font-label text-sm font-semibold mb-6 hover:underline"
        >
          <Icon name="arrow_back" className="text-lg" />
          Quay lại
        </button>

        <nav className="flex items-center gap-2 text-slate-400 text-sm mb-6 font-label" aria-label="Breadcrumb">
          <span>Danh sách sự cố</span>
          <Icon name="chevron_right" className="text-xs" />
          <span className="text-primary font-semibold">{display.shortId}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cột trái */}
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-outline-variant/40">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span
                      className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase font-label ${display.statusBadgeClass}`}
                    >
                      {display.statusLabel}
                    </span>
                    <span className="text-slate-400 text-sm font-medium font-label">{display.shortId}</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline text-on-background">
                    {report.title}
                  </h1>
                  <p className="text-slate-500 mt-2 flex items-center gap-2 text-sm font-label">
                    <Icon name="location_on" className="text-primary text-base" filled />
                    {display.locationLine}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    title="Chia sẻ"
                    className="p-3 bg-surface-container-low hover:bg-surface-container-high rounded-full transition-colors text-primary border border-outline-variant/30"
                    onClick={() => {
                      const url = window.location.href;
                      if (navigator.share) navigator.share({ title: report.title, url }).catch(() => {});
                      else navigator.clipboard.writeText(url).then(() => alert('Đã sao chép liên kết.'));
                    }}
                  >
                    <Icon name="share" />
                  </button>
                  <button
                    type="button"
                    title="In"
                    className="p-3 bg-surface-container-low hover:bg-surface-container-high rounded-full transition-colors text-primary border border-outline-variant/30"
                    onClick={() => window.print()}
                  >
                    <Icon name="print" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-6 border-t border-slate-100">
                <div>
                  <p className="text-slate-400 text-xs font-label uppercase tracking-widest mb-1">Thời gian báo</p>
                  <p className="font-semibold text-sm text-on-surface">{display.formattedTime}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-label uppercase tracking-widest mb-1">Mức độ</p>
                  <p
                    className={`font-semibold text-sm flex items-center gap-1.5 ${display.prioritySevere ? 'text-error' : 'text-on-surface'}`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${display.priorityDotClass}`} />
                    {display.priorityLabel}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-label uppercase tracking-widest mb-1">Đội xử lý</p>
                  <p className="font-semibold text-sm text-on-surface leading-snug">{display.team}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-label uppercase tracking-widest mb-1">Phụ trách</p>
                  <p className="font-semibold text-sm text-primary">{display.assignee}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
                <div>
                  <p className="text-slate-400 text-xs font-label uppercase tracking-widest mb-1">Danh mục</p>
                  <p className="font-semibold text-sm text-on-surface">{display.categoryName}</p>
                  {display.categoryDescription ? (
                    <p className="text-xs text-slate-500 font-label mt-1.5 leading-relaxed">{display.categoryDescription}</p>
                  ) : null}
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-label uppercase tracking-widest mb-1">Người báo</p>
                  <p className="font-semibold text-sm text-primary">{display.reporterLine}</p>
                  <p className="text-xs text-slate-500 font-label mt-1">{display.reporterPhone}</p>
                </div>
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-outline-variant/40">
              <h2 className="text-xl font-bold font-headline text-on-background mb-4">Mô tả chi tiết</h2>
              <p className="text-slate-600 font-label text-sm leading-relaxed whitespace-pre-wrap">{report.description}</p>
            </section>

            {display.images.length > 0 ? (
              <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-outline-variant/40">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold font-headline text-on-background">
                    Hình ảnh hiện trường <span className="text-slate-400 font-normal font-label text-sm">(Evidence)</span>
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {display.images.map((img) => (
                    <div
                      key={img.key}
                      className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 border border-outline-variant/30"
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-outline-variant/40 overflow-hidden">
              <h2 className="text-xl font-bold font-headline text-on-background mb-4">Vị trí chính xác</h2>
              <div className="report-detail-map-host rounded-xl overflow-hidden border border-slate-100 relative bg-slate-100">
                <VietMap
                  reports={[report]}
                  center={[report.longitude, report.latitude]}
                  zoom={16}
                  routeData={routeData}
                  userLocation={userLocation}
                  onUserLocationFound={(loc) => setUserLocation(loc)}
                />
              </div>
            </section>
          </div>

          {/* Cột phải */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-surface-container rounded-xl p-6 md:p-8 shadow-sm border border-primary/10">
              <h2 className="text-xl font-bold font-headline text-on-background mb-6">Tiến độ xử lý</h2>
              {logs.length === 0 ? (
                <p className="text-sm text-slate-500 font-label">Chưa có nhật ký xử lý.</p>
              ) : (
                <div className="relative space-y-8 pl-1">
                  <div className="absolute left-[11px] top-2 bottom-6 w-0.5 bg-slate-300/60" aria-hidden />
                  {logs.map((log) => (
                    <div key={log.log_id} className="relative pl-10">
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center z-10 shadow-sm">
                        <Icon name="sync" className="text-slate-500 text-sm" />
                      </div>
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h3 className="font-bold text-sm text-on-background">
                          {timelineStatusLabel(log.old_status)} → {timelineStatusLabel(log.new_status)}
                        </h3>
                        <span className="text-[10px] font-label text-slate-400 whitespace-nowrap bg-white px-2 py-0.5 rounded shadow-sm">
                          {new Date(log.updated_at).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {log.changed_by_name ? (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center font-label">
                            {(log.changed_by_name || '?')
                              .split(/\s+/)
                              .map((w) => w[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-on-surface">
                            {log.changed_by_name}
                            {log.changed_by_role ? (
                              <span className="text-slate-500 font-medium">
                                {' '}
                                ({ROLE_LABELS_VI[log.changed_by_role] || log.changed_by_role})
                              </span>
                            ) : null}
                          </span>
                        </div>
                      ) : null}
                      {log.note ? <p className="text-xs text-slate-500 mt-2 font-label">{log.note}</p> : null}
                      {log.proof_image_url ? (
                        <img
                          src={mediaUrl(log.proof_image_url)}
                          alt=""
                          className="mt-3 w-full max-h-32 object-cover rounded-xl border border-slate-200"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl p-6 md:p-8 text-white shadow-xl shadow-primary/25 bg-primary">
              <h2 className="text-xl font-bold font-headline mb-2">Chỉ đường</h2>
              <p className="text-blue-100 font-label text-sm mb-5 leading-relaxed">
                Chọn phương tiện và lấy lộ trình từ vị trí hiện tại đến điểm sự cố.
              </p>

              <div className="mb-4">
                <label className="block text-xs font-label font-semibold text-blue-100/90 mb-2">Phương tiện</label>
                <select
                  value={vehicle}
                  onChange={(e) => onVehicleChange(e.target.value)}
                  className="w-full rounded-full border-0 bg-white/15 text-white text-sm px-4 py-2.5 font-label focus:ring-2 focus:ring-white/40"
                  title="VietMap Route v3: car, motorcycle, truck"
                >
                  <option value="motorcycle" className="text-on-surface">
                    Xe máy (motorcycle)
                  </option>
                  <option value="car" className="text-on-surface">
                    Ô tô (car)
                  </option>
                  <option value="truck" className="text-on-surface">
                    Xe tải (truck)
                  </option>
                  <option value="bike" className="text-on-surface">
                    Xe đạp → tính như xe máy
                  </option>
                  <option value="foot" className="text-on-surface">
                    Đi bộ → gần đúng (motorcycle)
                  </option>
                </select>
              </div>

              {!routeData ? (
                <button
                  type="button"
                  onClick={handleGetRoute}
                  disabled={routeLoading}
                  className="w-full bg-white text-primary py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  <Icon name="route" />
                  {routeLoading ? 'Đang tìm đường…' : 'Chỉ đường đến đây'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClearRoute}
                  className="w-full bg-white/15 border border-white/30 text-white py-3 rounded-full text-sm font-bold hover:bg-white/20"
                >
                  Xóa chỉ đường
                </button>
              )}

              {routeError ? <p className="mt-3 text-sm text-amber-200 font-label">{routeError}</p> : null}

              {userLocation ? (
                <p className="mt-3 text-xs text-blue-100/90 font-label">
                  Vị trí của bạn: {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                </p>
              ) : null}

              {routeInfo ? (
                <div className="mt-5 pt-5 border-t border-white/20">
                  <div className="flex gap-4 mb-4">
                    <div>
                      <p className="text-2xl font-bold">{(routeInfo.distance / 1000).toFixed(1)} km</p>
                      <p className="text-xs text-blue-100 font-label">Khoảng cách</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{Math.ceil(routeInfo.time / 60000)} phút</p>
                      <p className="text-xs text-blue-100 font-label">Ước tính</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-sm font-label font-semibold text-white/90 underline-offset-2 hover:underline"
                    onClick={() => setShowInstructions(!showInstructions)}
                  >
                    {showInstructions ? 'Ẩn hướng dẫn' : 'Xem hướng dẫn chi tiết'}
                  </button>
                  {showInstructions && routeInfo.instructions?.length ? (
                    <ul className="mt-3 space-y-2 max-h-48 overflow-y-auto text-sm font-label text-blue-50">
                      {routeInfo.instructions.map((inst, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="font-bold shrink-0">{i + 1}.</span>
                          <span>{inst.text}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
