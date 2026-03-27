import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ReportDetailPage from './pages/ReportDetailPage';
import CreateReportPage from './pages/CreateReportPage';
import MyReportsPage from './pages/MyReportsPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminReports from './pages/AdminReports';
import ProfilePage from './pages/ProfilePage';
import FloodReportPage from './pages/FloodReportPage';
import DashboardReactPage from './pages/DashboardReactPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Đang tải...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Đang tải...</div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

/** Trang chủ: Dashboard (cần đăng nhập). Khách → /login */
function MainDashboardRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Đang tải...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <DashboardReactPage />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<MainDashboardRoute />} />
            {/* Bản đồ cộng đồng cũ — chỉ giữ đường dẫn phụ */}
            <Route path="community-map" element={<HomePage />} />
            <Route path="flood" element={<FloodReportPage />} />
            <Route path="report/:id" element={<ReportDetailPage />} />
            <Route path="login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
            <Route path="create-report" element={<ProtectedRoute><CreateReportPage /></ProtectedRoute>} />
            <Route path="my-reports" element={<ProtectedRoute><MyReportsPage /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="admin/reports" element={<ProtectedRoute roles={['admin', 'staff']}><AdminReports /></ProtectedRoute>} />
            <Route path="dashboard-react" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
