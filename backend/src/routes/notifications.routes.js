import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * #37 - GET /api/notifications
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const { page = 1, limit = 20, is_read } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE user_id = ?';
    const params = [req.user.user_id];
    if (is_read !== undefined) { where += ' AND is_read = ?'; params.push(parseInt(is_read)); }

    const [countRows] = await db.query(`SELECT COUNT(*) as count FROM notifications ${where}`, params);
    const total = countRows[0].count;
    const [unreadRows] = await db.query('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.user_id]);
    const unread = unreadRows[0].count;

    const [notifications] = await db.query(`SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);

    res.json({ success: true, message: 'Lấy danh sách thông báo thành công.', data: { notifications, unread_count: unread, pagination: { total, page: parseInt(page), limit: parseInt(limit), total_pages: Math.ceil(total / parseInt(limit)) } } });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #38 - GET /api/notifications/unread-count
 */
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.user_id]);
    res.json({ success: true, message: 'Lấy số thông báo chưa đọc.', data: { unread_count: rows[0].count } });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #39 - PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM notifications WHERE notification_id = ? AND user_id = ?', [req.params.id, req.user.user_id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo.' });

    await db.query('UPDATE notifications SET is_read = 1 WHERE notification_id = ?', [req.params.id]);
    res.json({ success: true, message: 'Đã đánh dấu đã đọc.', data: { notification_id: req.params.id, is_read: 1 } });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #40 - PATCH /api/notifications/read-all
 */
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const [result] = await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [req.user.user_id]);
    res.json({ success: true, message: `Đã đánh dấu ${result.affectedRows} thông báo đã đọc.`, data: { updated_count: result.affectedRows } });
  } catch (error) {
    console.error('Read all error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #41 - DELETE /api/notifications/:id
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM notifications WHERE notification_id = ? AND user_id = ?', [req.params.id, req.user.user_id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo.' });

    await db.query('DELETE FROM notifications WHERE notification_id = ?', [req.params.id]);
    res.json({ success: true, message: 'Đã xóa thông báo.', data: { notification_id: req.params.id } });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

export default router;
