import { useState, useEffect } from 'react';
import { notificationsAPI } from '../services/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, []);

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await notificationsAPI.getAll('?limit=50');
      setNotifications(res.data.notifications);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(n => n.map(x => x.notification_id === id ? { ...x, is_read: 1 } : x));
    } catch (err) { alert(err.message); }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(n => n.map(x => ({ ...x, is_read: 1 })));
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    try {
      await notificationsAPI.remove(id);
      setNotifications(n => n.filter(x => x.notification_id !== id));
    } catch (err) { alert(err.message); }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return <div className="loading-screen">Đang tải thông báo...</div>;

  return (
    <div className="notifications-page">
      <div className="page-header">
        <h2>🔔 Thông báo {unreadCount > 0 && <span className="badge">{unreadCount} mới</span>}</h2>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={handleMarkAllRead}>✓ Đánh dấu tất cả đã đọc</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state"><p>📭 Không có thông báo nào.</p></div>
      ) : (
        <div className="notification-list">
          {notifications.map(n => (
            <div key={n.notification_id} className={`notification-item ${n.is_read ? '' : 'unread'}`}>
              <div className="notif-content">
                <h4>{n.title}</h4>
                <p>{n.message}</p>
                <span className="notif-time">{new Date(n.created_at).toLocaleString('vi-VN')}</span>
              </div>
              <div className="notif-actions">
                {!n.is_read && <button className="btn btn-sm" onClick={() => handleMarkRead(n.notification_id)}>✓ Đã đọc</button>}
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(n.notification_id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
