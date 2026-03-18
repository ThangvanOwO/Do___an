import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', phone_number: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: form.full_name,
        phone_number: form.phone_number,
        password: form.password,
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>📝 Đăng ký tài khoản</h2>
        <p className="auth-subtitle">Tạo tài khoản để tham gia cộng đồng báo cáo sự cố</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Họ và tên</label>
            <input type="text" name="full_name" value={form.full_name}
              onChange={handleChange} placeholder="Nguyễn Văn A" required />
          </div>
          <div className="form-group">
            <label>Số điện thoại</label>
            <input type="tel" name="phone_number" value={form.phone_number}
              onChange={handleChange} placeholder="0901234567" required />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="Ít nhất 6 ký tự" required minLength={6} />
          </div>
          <div className="form-group">
            <label>Xác nhận mật khẩu</label>
            <input type="password" name="confirmPassword" value={form.confirmPassword}
              onChange={handleChange} placeholder="Nhập lại mật khẩu" required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <p className="auth-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
