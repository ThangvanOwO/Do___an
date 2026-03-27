import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, authAPI } from '../services/api';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('info');
  const [form, setForm] = useState({ full_name: user?.full_name || '', email: user?.email || '' });
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await usersAPI.update(user.user_id, { full_name: form.full_name });
      await refreshUser();
      setMsg({ type: 'success', text: 'Cập nhật thông tin thành công!' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Cập nhật thất bại' });
    }
    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      setMsg({ type: 'error', text: 'Mật khẩu mới không khớp!' });
      return;
    }
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await authAPI.changePassword({ old_password: pwForm.old_password, new_password: pwForm.new_password });
      setMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setPwForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Đổi mật khẩu thất bại' });
    }
    setLoading(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      await usersAPI.uploadAvatar(user.user_id, fd);
      await refreshUser();
      setMsg({ type: 'success', text: 'Cập nhật ảnh đại diện thành công!' });
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
  };

  const roleLabels = { admin: '🛡️ Quản trị viên', staff: '👷 Nhân viên', citizen: '👤 Công dân' };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="avatar-section">
          <div className="avatar-wrapper">
            {user?.avatar_url ? (
              <img src={`http://localhost:5000${user.avatar_url}`} alt="avatar" className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">{user?.full_name?.charAt(0) || '?'}</div>
            )}
            <label className="avatar-upload-btn">
              📷
              <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
            </label>
          </div>
          <div className="profile-name">
            <h2>{user?.full_name}</h2>
            <p>{roleLabels[user?.role] || user?.role}</p>
            <p>📞 {user?.phone_number || user?.phone}</p>
          </div>
        </div>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="profile-tabs">
        <button className={`tab-btn ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>Thông tin cá nhân</button>
        <button className={`tab-btn ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>Đổi mật khẩu</button>
      </div>

      {tab === 'info' && (
        <form className="profile-form" onSubmit={handleUpdateInfo}>
          <div className="form-group">
            <label>Họ và tên</label>
            <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Số điện thoại</label>
            <input type="text" value={user?.phone_number || user?.phone || ''} disabled />
            <p className="hint">Số điện thoại không thể thay đổi</p>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Đang lưu...' : '💾 Lưu thay đổi'}
          </button>
        </form>
      )}

      {tab === 'password' && (
        <form className="profile-form" onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>Mật khẩu hiện tại</label>
            <input type="password" value={pwForm.old_password}
              onChange={e => setPwForm(f => ({ ...f, old_password: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Mật khẩu mới</label>
            <input type="password" value={pwForm.new_password}
              onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} required minLength={6} />
          </div>
          <div className="form-group">
            <label>Xác nhận mật khẩu mới</label>
            <input type="password" value={pwForm.confirm_password}
              onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : '🔒 Đổi mật khẩu'}
          </button>
        </form>
      )}
    </div>
  );
}
