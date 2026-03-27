import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, usersAPI } from '../services/api';

const API_ORIGIN = 'http://localhost:5000';
const LS_NOTIFY = 'suco247_settings_notifications';
const LS_THEME = 'suco247_theme';
const LS_QUIET = 'suco247_quiet_hours';
const LS_EMAIL = 'suco247_profile_email_local';

const ROLE_LABELS = {
  admin: 'System Administrator',
  staff: 'Staff',
  citizen: 'Citizen',
};

const ROLE_LABELS_VI = {
  admin: 'Quản trị hệ thống',
  staff: 'Nhân viên xử lý',
  citizen: 'Công dân',
};

const TABS = [
  { id: 'general', label: 'General', icon: 'tune' },
  { id: 'security', label: 'Security', icon: 'shield' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications' },
  { id: 'users', label: 'User Management', icon: 'group', adminOnly: true },
];

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/** Material Symbols — khớp mockup HTML */
function MsIcon({ name, className = '', filled = false, size = '24px' }) {
  return (
    <span
      className={`material-symbols-outlined select-none ${filled ? 'ms-fill' : ''} ${className}`}
      style={{ fontSize: size }}
      aria-hidden
    >
      {name}
    </span>
  );
}

function ToggleRow({ icon, title, desc, checked, onChange, iconWrap }) {
  return (
    <div className="flex items-center justify-between p-1 gap-3">
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${iconWrap}`}
        >
          <MsIcon name={icon} size="22px" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-on-surface dark:text-slate-100">{title}</p>
          <p className="text-xs text-on-surface-variant">{desc}</p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className="w-11 h-6 bg-surface-container rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary dark:peer-checked:bg-secondary" />
      </label>
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('general');
  const [form, setForm] = useState({ full_name: '', email: '' });
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const [theme, setTheme] = useState(() => localStorage.getItem(LS_THEME) || 'light');
  const [notif, setNotif] = useState(() =>
    loadJson(LS_NOTIFY, { critical: true, emailDigest: false, sound: true })
  );
  const [quiet, setQuiet] = useState(() => loadJson(LS_QUIET, { from: '22:00', to: '06:00' }));

  const [userList, setUserList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [latencyMs, setLatencyMs] = useState(null);
  const [lastSyncLabel, setLastSyncLabel] = useState('—');

  const userId = user?.user_id;
  const phone = user?.phone_number ?? user?.phone ?? '';

  useEffect(() => {
    document.title = 'Cài đặt - Sự Cố 24/7';
    return () => {
      document.title = 'Sự Cố 24/7 - Báo cáo & Điều phối';
    };
  }, []);

  useEffect(() => {
    const t0 = performance.now();
    fetch(`${API_ORIGIN}/api`)
      .then(() => {
        setLatencyMs(Math.round(performance.now() - t0));
        setLastSyncLabel('Vừa xong');
      })
      .catch(() => {
        setLatencyMs(null);
        setLastSyncLabel('Không kết nối được');
      });
  }, []);

  useEffect(() => {
    if (user) {
      const savedEmail = localStorage.getItem(LS_EMAIL) || '';
      setForm({
        full_name: user.full_name || '',
        email: user.email || savedEmail,
      });
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme === 'dark' ? 'dark' : 'light');
    localStorage.setItem(LS_THEME, theme);
  }, [theme]);

  const persistNotif = useCallback((next) => {
    setNotif(next);
    localStorage.setItem(LS_NOTIFY, JSON.stringify(next));
  }, []);

  const persistQuiet = useCallback((next) => {
    setQuiet(next);
    localStorage.setItem(LS_QUIET, JSON.stringify(next));
  }, []);

  const avatarSrc = useMemo(() => {
    if (!user?.avatar_url) return null;
    return user.avatar_url.startsWith('http') ? user.avatar_url : `${API_ORIGIN}${user.avatar_url}`;
  }, [user?.avatar_url]);

  const visibleTabs = useMemo(
    () => TABS.filter((t) => !t.adminOnly || user?.role === 'admin'),
    [user?.role]
  );

  const loadUsers = useCallback(async () => {
    if (user?.role !== 'admin') return;
    setUsersLoading(true);
    try {
      const res = await usersAPI.getAll('?limit=50');
      if (res.success && res.data?.users) setUserList(res.data.users);
      else setUserList([]);
    } catch {
      setUserList([]);
    } finally {
      setUsersLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (tab === 'users' && user?.role === 'admin') loadUsers();
  }, [tab, user?.role, loadUsers]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await usersAPI.update(userId, { full_name: form.full_name });
      localStorage.setItem(LS_EMAIL, form.email || '');
      await refreshUser();
      setMsg({ type: 'success', text: 'Đã lưu thông tin hồ sơ.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Cập nhật thất bại' });
    }
    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      setMsg({ type: 'error', text: 'Mật khẩu mới không khớp.' });
      return;
    }
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await authAPI.changePassword({
        old_password: pwForm.old_password,
        new_password: pwForm.new_password,
      });
      setMsg({ type: 'success', text: 'Đổi mật khẩu thành công.' });
      setPwForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Đổi mật khẩu thất bại' });
    }
    setLoading(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    const fd = new FormData();
    fd.append('avatar', file);
    setMsg({ type: '', text: '' });
    try {
      await usersAPI.uploadAvatar(userId, fd);
      await refreshUser();
      setMsg({ type: 'success', text: 'Đã cập nhật ảnh đại diện.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Upload thất bại' });
    }
  };

  const resetLocalSettings = () => {
    localStorage.removeItem(LS_NOTIFY);
    localStorage.removeItem(LS_QUIET);
    localStorage.removeItem(LS_EMAIL);
    setNotif({ critical: true, emailDigest: false, sound: true });
    setQuiet({ from: '22:00', to: '06:00' });
    setTheme('light');
    setForm((f) => ({ ...f, email: '' }));
    setMsg({ type: 'success', text: 'Đã đặt lại toàn bộ tùy chọn cục bộ.' });
  };

  const recheckApi = () => {
    const t0 = performance.now();
    fetch(`${API_ORIGIN}/api`)
      .then(() => {
        setLatencyMs(Math.round(performance.now() - t0));
        setLastSyncLabel('Vừa xong');
      })
      .catch(() => {
        setLatencyMs(null);
        setLastSyncLabel('Lỗi');
      });
  };

  const roleLabelEn = ROLE_LABELS[user?.role] || user?.role || '—';
  const roleLabelVi = ROLE_LABELS_VI[user?.role] || roleLabelEn;

  const notificationsBlock = (
    <>
      <div className="space-y-6">
        <ToggleRow
          icon="warning"
          title="Critical Incidents"
          desc="Immediate alerts for P1 issues"
          checked={notif.critical}
          onChange={(v) => persistNotif({ ...notif, critical: v })}
          iconWrap="bg-secondary-container/30 text-on-secondary-container"
        />
        <ToggleRow
          icon="mail"
          title="Email Summaries"
          desc="Daily digest of resolved issues"
          checked={notif.emailDigest}
          onChange={(v) => persistNotif({ ...notif, emailDigest: v })}
          iconWrap="bg-surface-container text-on-surface-variant"
        />
        <ToggleRow
          icon="volume_up"
          title="Sound Alerts"
          desc="Play audio for new reports"
          checked={notif.sound}
          onChange={(v) => persistNotif({ ...notif, sound: v })}
          iconWrap="bg-primary-container/10 text-primary"
        />
      </div>
      <div className="mt-8 pt-8 border-t border-outline-variant/20">
        <h4 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-4 font-label">
          Quiet Hours
        </h4>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="time"
            value={quiet.from}
            onChange={(e) => persistQuiet({ ...quiet, from: e.target.value })}
            className="flex-1 min-w-[100px] bg-surface-container-low dark:bg-slate-800 px-4 py-2 rounded-lg text-sm text-center font-medium dark:text-slate-100 border-0"
          />
          <span className="text-on-surface-variant text-sm">to</span>
          <input
            type="time"
            value={quiet.to}
            onChange={(e) => persistQuiet({ ...quiet, to: e.target.value })}
            className="flex-1 min-w-[100px] bg-surface-container-low dark:bg-slate-800 px-4 py-2 rounded-lg text-sm text-center font-medium dark:text-slate-100 border-0"
          />
        </div>
      </div>
    </>
  );

  const diagnosticsBlock = (
    <section className="bg-inverse-surface rounded-xl p-8 text-inverse-on-surface shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <MsIcon name="info" className="text-secondary-fixed-dim" size="24px" />
        <h3 className="text-lg font-bold font-headline">System Diagnostics</h3>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm gap-2">
          <span className="opacity-70">Client Version</span>
          <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-xs shrink-0">v0.1.0-web</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="opacity-70">Last Sync</span>
          <span>{lastSyncLabel}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="opacity-70">Server Latency</span>
          <span className="text-secondary-fixed-dim font-bold">
            {latencyMs != null ? `${latencyMs}ms` : '—'}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={recheckApi}
        className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 rounded-full font-bold text-sm transition-colors"
      >
        Check for Updates
      </button>
    </section>
  );

  return (
    <div className="min-h-screen font-display bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container dark:bg-background-dark dark:text-slate-100">
      {/* SideNavBar — mockup: fixed top-0 h-screen */}
      <aside className="hidden md:flex md:flex-col fixed left-0 top-0 z-50 h-screen w-64 bg-slate-900 dark:bg-black py-6 shadow-2xl">
        <div className="px-6 mb-8">
          <h1 className="text-xl font-bold text-white">Sự Cố 24/7</h1>
          <p className="text-xs text-slate-400 font-label">The Calm Orchestrator</p>
        </div>
        <nav className="flex-1 space-y-1">
          <Link
            to="/"
            className="text-slate-400 hover:text-white rounded-full mx-2 my-1 px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-all active:translate-x-1 duration-150"
          >
            <MsIcon name="map" size="22px" />
            <span className="text-sm font-medium">Live Map</span>
          </Link>
          <div className="bg-blue-600 text-white rounded-full mx-2 my-1 px-4 py-3 flex items-center gap-3 transition-all active:translate-x-1 duration-150">
            <MsIcon name="settings" filled size="22px" />
            <span className="text-sm font-medium">Settings</span>
          </div>
        </nav>
        <div className="px-4 mb-6">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40">
            {avatarSrc ? (
              <img className="w-10 h-10 rounded-full object-cover" alt="" src={avatarSrc} />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-bold">
                {user?.full_name?.charAt(0) || '?'}
              </div>
            )}
            <div className="overflow-hidden min-w-0">
              <p className="text-white text-sm font-bold truncate">{user?.full_name}</p>
              <p className="text-slate-500 text-xs truncate" title={roleLabelVi}>
                {roleLabelEn}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-auto border-t border-slate-800 pt-4">
          <a
            href="mailto:support@suco247.local"
            className="text-slate-400 hover:text-white rounded-full mx-2 my-1 px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-all"
          >
            <MsIcon name="help" size="22px" />
            <span className="text-sm font-medium">Support</span>
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left text-slate-400 hover:text-white rounded-full mx-2 my-1 px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-all"
          >
            <MsIcon name="logout" size="22px" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile */}
      <div className="md:hidden sticky top-0 z-40 flex gap-2 bg-slate-900 px-3 py-2.5 text-white text-sm shadow-md">
        <Link to="/" className="px-3 py-1.5 rounded-full bg-slate-800 flex items-center gap-1">
          <MsIcon name="map" size="18px" />
          Live Map
        </Link>
        <span className="px-3 py-1.5 rounded-full bg-blue-600 flex items-center gap-1">
          <MsIcon name="settings" filled size="18px" />
          Settings
        </span>
      </div>

      <main className="md:ml-64 min-h-screen p-8 lg:p-12">
        <header className="mb-12">
          <nav className="flex items-center gap-2 text-on-surface-variant text-sm font-label mb-4">
            <span>App</span>
            <MsIcon name="chevron_right" size="16px" className="opacity-70" />
            <span className="text-primary font-semibold">Settings</span>
          </nav>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-on-surface font-headline mb-2 dark:text-slate-100">
            Cài đặt
          </h2>
          <p className="text-on-surface-variant text-lg max-w-2xl">
            Quản lý cấu hình hệ thống, bảo mật tài khoản và các tùy chọn thông báo của bạn.
          </p>
        </header>

        {msg.text && (
          <div
            className={`mb-8 rounded-xl px-4 py-3 text-sm font-medium ${
              msg.type === 'success'
                ? 'bg-secondary-container/30 text-secondary'
                : 'bg-red-50 text-error dark:bg-red-950/40 dark:text-red-200'
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* Tabbed Navigation Bar */}
        <div className="flex items-center gap-8 mb-10 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {visibleTabs.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-1 py-3 border-b-2 transition-all whitespace-nowrap ${
                tab === id
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface font-medium'
              }`}
            >
              <MsIcon name={icon} filled={tab === id} size="20px" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {tab === 'general' && (
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-7 space-y-8">
              <section className="bg-surface-container-lowest dark:bg-slate-900/50 rounded-xl p-8 shadow-sm border border-outline-variant/10">
                <h3 className="text-xl font-bold font-headline mb-8 text-on-surface dark:text-slate-100">
                  Profile Management
                </h3>
                <form onSubmit={handleSaveProfile} className="flex flex-col md:flex-row gap-10 items-start">
                  <div className="relative group shrink-0">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-surface-container shadow-inner dark:bg-slate-800">
                      {avatarSrc ? (
                        <img className="w-full h-full object-cover" alt="" src={avatarSrc} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-on-surface-variant">
                          {user?.full_name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-primary text-white p-2.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer">
                      <MsIcon name="photo_camera" className="text-white" size="18px" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                  </div>
                  <div className="flex-1 w-full space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label ml-1">
                          Full Name
                        </label>
                        <input
                          className="w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium dark:text-slate-100"
                          value={form.full_name}
                          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label ml-1">
                          Role
                        </label>
                        <input
                          className="w-full bg-surface-container border-none rounded-lg px-4 py-3 text-on-surface-variant/70 font-medium cursor-not-allowed dark:bg-slate-800/80"
                          disabled
                          value={roleLabelEn}
                          title={roleLabelVi}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label ml-1">
                        Số điện thoại
                      </label>
                      <input
                        className="w-full bg-surface-container border-none rounded-lg px-4 py-3 text-on-surface-variant/70 font-medium cursor-not-allowed dark:bg-slate-800/80"
                        disabled
                        value={phone}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label ml-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium dark:text-slate-100"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="operator01@suco247.com"
                      />
                      <p className="text-xs text-on-surface-variant">Lưu cục bộ trên trình duyệt nếu API chưa có email.</p>
                    </div>
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-60"
                      >
                        {loading ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              </section>

              <section className="bg-surface-container-lowest dark:bg-slate-900/50 rounded-xl p-8 shadow-sm border border-outline-variant/10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold font-headline text-on-surface dark:text-slate-100">Appearance</h3>
                    <p className="text-on-surface-variant text-sm">Customize how the orchestrator looks for you.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`relative flex flex-col items-center gap-4 p-6 rounded-xl border-2 transition-all ${
                      theme === 'light'
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:bg-surface-container-low dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="w-full aspect-video bg-white rounded-lg shadow-sm overflow-hidden flex flex-col p-2 gap-1 border border-outline-variant/30">
                      <div className="h-2 w-1/2 bg-slate-200 rounded" />
                      <div className="flex gap-1 mt-1">
                        <div className="h-8 flex-1 bg-slate-100 rounded" />
                        <div className="h-8 flex-1 bg-slate-50 rounded" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MsIcon name="light_mode" className="text-primary" filled={theme === 'light'} size="22px" />
                      <span className="font-bold text-on-surface dark:text-slate-100">Light Mode</span>
                    </div>
                    {theme === 'light' && (
                      <MsIcon name="check_circle" className="absolute top-2 right-2 text-primary" filled size="22px" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`relative flex flex-col items-center gap-4 p-6 rounded-xl border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:bg-surface-container-low dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="w-full aspect-video bg-slate-900 rounded-lg shadow-sm overflow-hidden flex flex-col p-2 gap-1">
                      <div className="h-2 w-1/2 bg-slate-700 rounded" />
                      <div className="flex gap-1 mt-1">
                        <div className="h-8 flex-1 bg-slate-800 rounded" />
                        <div className="h-8 flex-1 bg-slate-800 rounded" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <MsIcon name="dark_mode" size="22px" />
                      <span className="font-bold">Dark Mode</span>
                    </div>
                    {theme === 'dark' && (
                      <MsIcon name="check_circle" className="absolute top-2 right-2 text-primary" filled size="22px" />
                    )}
                  </button>
                </div>
              </section>
            </div>

            <div className="col-span-12 lg:col-span-5 space-y-8">
              <section className="bg-surface-container-lowest dark:bg-slate-900/50 rounded-xl p-8 shadow-sm border border-outline-variant/10">
                <h3 className="text-xl font-bold font-headline mb-6 text-on-surface dark:text-slate-100">Notifications</h3>
                {notificationsBlock}
              </section>
              {diagnosticsBlock}
            </div>
          </div>
        )}

        {tab === 'security' && (
          <section className="max-w-2xl bg-surface-container-lowest dark:bg-slate-900/50 rounded-xl p-8 shadow-sm border border-outline-variant/10">
            <h3 className="text-xl font-bold font-headline mb-2 text-on-surface dark:text-slate-100">Security</h3>
            <p className="text-on-surface-variant text-sm mb-6">Đổi mật khẩu đăng nhập tài khoản.</p>
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label ml-1">
                  Current password
                </label>
                <input
                  type="password"
                  required
                  className="w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 dark:text-slate-100"
                  value={pwForm.old_password}
                  onChange={(e) => setPwForm((f) => ({ ...f, old_password: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label ml-1">
                  New password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 dark:text-slate-100"
                  value={pwForm.new_password}
                  onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label ml-1">
                  Confirm new password
                </label>
                <input
                  type="password"
                  required
                  className="w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 dark:text-slate-100"
                  value={pwForm.confirm_password}
                  onChange={(e) => setPwForm((f) => ({ ...f, confirm_password: e.target.value }))}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-60"
              >
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </section>
        )}

        {tab === 'notifications' && (
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-7">
              <section className="bg-surface-container-lowest dark:bg-slate-900/50 rounded-xl p-8 shadow-sm border border-outline-variant/10">
                <h3 className="text-xl font-bold font-headline mb-6 text-on-surface dark:text-slate-100">Notifications</h3>
                <p className="text-sm text-on-surface-variant mb-6">
                  Tùy chọn lưu trên trình duyệt. Có thể nối push/email thật sau.
                </p>
                {notificationsBlock}
              </section>
            </div>
            <div className="col-span-12 lg:col-span-5">{diagnosticsBlock}</div>
          </div>
        )}

        {tab === 'users' && user?.role === 'admin' && (
          <section className="bg-surface-container-lowest dark:bg-slate-900/50 rounded-xl p-8 shadow-sm border border-outline-variant/10 overflow-x-auto">
            <h3 className="text-xl font-bold font-headline mb-4 text-on-surface dark:text-slate-100">
              User Management
            </h3>
            {usersLoading ? (
              <p className="text-on-surface-variant">Đang tải…</p>
            ) : (
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-outline-variant/40 text-on-surface-variant font-label uppercase text-xs">
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Phone</th>
                    <th className="py-3">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {userList.map((u) => (
                    <tr key={u.user_id} className="border-b border-outline-variant/20 dark:border-slate-700">
                      <td className="py-3 pr-4 font-medium text-on-surface dark:text-slate-100">{u.full_name}</td>
                      <td className="py-3 pr-4 text-on-surface-variant">{u.phone_number}</td>
                      <td className="py-3">{ROLE_LABELS[u.role] || u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        <footer className="mt-16 pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-on-surface-variant text-sm font-label">
            © {new Date().getFullYear()} Sự Cố 24/7 Incident Orchestrator. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-6 justify-center">
            <a href="#" className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">
              Privacy Policy
            </a>
            <a href="#" className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">
              Terms of Service
            </a>
            <button
              type="button"
              onClick={resetLocalSettings}
              className="text-error font-bold text-sm hover:underline"
            >
              Reset All Settings
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
