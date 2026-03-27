import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Shield } from 'lucide-react';

export default function Layout() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  const hasToken = typeof localStorage !== 'undefined' && !!localStorage.getItem('token');
  const isDashboardHome =
    location.pathname === '/' && (!!user || (loading && hasToken));
  const isSettingsShell =
    location.pathname === '/settings' && (!!user || (loading && hasToken));

  useEffect(() => {
    const onDoc = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
    setAccountOpen(false);
  };

  const homeLink = user ? '/' : '/community-map';

  const closeMenus = () => {
    setMenuOpen(false);
    setAccountOpen(false);
  };

  if (isDashboardHome || isSettingsShell) {
    return (
      <div className="app-layout app-layout--dashboard-root">
        <main className="app-main app-main--dashboard">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <header className="app-header border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="header-content">
          <Link to={homeLink} className="logo-link items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shrink-0">
              <Shield className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="logo-text">Sự Cố 24/7</span>
          </Link>

          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-label="Mở menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>

          <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <Link to={homeLink} onClick={closeMenus} className="nav-link-item">
              Trang chủ
            </Link>
            {user && (
              <Link to="/community-map" onClick={closeMenus} className="nav-link-item">
                Bản đồ
              </Link>
            )}
            <Link to="/flood" onClick={closeMenus} className="nav-link-item">
              Ngập lụt
            </Link>
            {user ? (
              <>
                <Link to="/create-report" onClick={closeMenus} className="nav-link-item font-semibold text-primary">
                  Tạo báo cáo
                </Link>
                <Link to="/my-reports" onClick={closeMenus} className="nav-link-item">
                  Của tôi
                </Link>
                {(user.role === 'admin' || user.role === 'staff') && (
                  <Link to="/admin/reports" onClick={closeMenus} className="nav-link-item">
                    Quản lý
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={closeMenus} className="nav-link-item">
                    Thống kê
                  </Link>
                )}

                <div className="nav-account-wrap" ref={accountRef}>
                  <button
                    type="button"
                    className="nav-account-trigger"
                    aria-expanded={accountOpen}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAccountOpen((v) => !v);
                    }}
                  >
                    <span className="truncate max-w-[140px]">{user.full_name}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {accountOpen && (
                    <div className="nav-account-dropdown" role="menu">
                      <Link to="/profile" role="menuitem" onClick={closeMenus}>
                        Hồ sơ
                      </Link>
                      <Link to="/settings" role="menuitem" onClick={closeMenus}>
                        Cài đặt
                      </Link>
                      <button type="button" role="menuitem" className="nav-account-logout" onClick={handleLogout}>
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenus} className="nav-link-item">
                  Đăng nhập
                </Link>
                <Link to="/register" onClick={closeMenus} className="nav-link-item btn-nav-register">
                  Đăng ký
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
