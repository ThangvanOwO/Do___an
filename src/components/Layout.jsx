import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-content">
          <Link to="/" className="logo-link">
            <span className="logo-icon">🗺️</span>
            <span className="logo-text">Bản đồ Cộng đồng</span>
          </Link>

          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? '✕' : '☰'}
          </button>

          <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <Link to="/" onClick={() => setMenuOpen(false)}>🏠 Trang chủ</Link>
            <Link to="/flood" onClick={() => setMenuOpen(false)}>🌊 Ngập lụt</Link>
            {user ? (
              <>
                <Link to="/create-report" onClick={() => setMenuOpen(false)}>📝 Báo cáo sự cố</Link>
                <Link to="/my-reports" onClick={() => setMenuOpen(false)}>📋 Báo cáo của tôi</Link>
                {(user.role === 'admin' || user.role === 'staff') && (
                  <>
                    <Link to="/admin/reports" onClick={() => setMenuOpen(false)}>⚙️ Quản lý sự cố</Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setMenuOpen(false)}>📊 Dashboard</Link>
                    )}
                  </>
                )}
                <Link to="/profile" onClick={() => setMenuOpen(false)}>👤 {user.full_name}</Link>
                <button onClick={handleLogout} className="btn-logout">Đăng xuất</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}>🔑 Đăng nhập</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}>📝 Đăng ký</Link>
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
