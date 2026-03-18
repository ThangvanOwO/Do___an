import { Router } from 'express';
import { getDb } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadAvatar } from '../middleware/upload.js';

const router = Router();

/**
 * #5 - GET /api/users
 */
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = getDb();
    const { page = 1, limit = 20, role, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];

    if (role) { where += ' AND role = ?'; params.push(role); }
    if (search) { where += ' AND (full_name LIKE ? OR phone_number LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const [countRows] = await db.query(`SELECT COUNT(*) as count FROM users ${where}`, params);
    const total = countRows[0].count;

    const [users] = await db.query(
      `SELECT user_id, full_name, phone_number, role, avatar_url
       FROM users ${where} ORDER BY full_name ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      message: 'Lấy danh sách người dùng thành công.',
      data: { users, pagination: { total, page: parseInt(page), limit: parseInt(limit), total_pages: Math.ceil(total / parseInt(limit)) } }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #6 - GET /api/users/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query(
      'SELECT user_id, full_name, phone_number, role, avatar_url FROM users WHERE user_id = ?',
      [req.params.id]
    );
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    const [countRows] = await db.query('SELECT COUNT(*) as count FROM reports WHERE user_id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Lấy thông tin người dùng thành công.',
      data: { ...user, total_reports: countRows[0].count }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #7 - PUT /api/users/:id
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.user_id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa thông tin người dùng này.' });
    }

    const db = getDb();
    const [existRows] = await db.query('SELECT * FROM users WHERE user_id = ?', [req.params.id]);
    const existing = existRows[0];
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    const { full_name, phone_number, role } = req.body;

    if (phone_number && phone_number !== existing.phone_number) {
      const [dup] = await db.query('SELECT user_id FROM users WHERE phone_number = ? AND user_id != ?', [phone_number, req.params.id]);
      if (dup.length > 0) {
        return res.status(409).json({ success: false, message: 'Số điện thoại đã được sử dụng bởi tài khoản khác.' });
      }
    }

    const updatedName = full_name || existing.full_name;
    const updatedPhone = phone_number || existing.phone_number;
    const updatedRole = (req.user.role === 'admin' && role) ? role : existing.role;

    await db.query(
      'UPDATE users SET full_name = ?, phone_number = ?, role = ? WHERE user_id = ?',
      [updatedName, updatedPhone, updatedRole, req.params.id]
    );

    const [updated] = await db.query(
      'SELECT user_id, full_name, phone_number, role, avatar_url FROM users WHERE user_id = ?',
      [req.params.id]
    );

    res.json({ success: true, message: 'Cập nhật thông tin thành công.', data: updated[0] });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #8 - PUT /api/users/:id/avatar
 */
router.put('/:id/avatar', authenticate, (req, res) => {
  if (req.user.user_id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Bạn không có quyền thay đổi avatar.' });
  }

  uploadAvatar(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng chọn file ảnh để upload.' });

    try {
      const db = getDb();
      const avatar_url = `/uploads/avatars/${req.file.filename}`;
      await db.query('UPDATE users SET avatar_url = ? WHERE user_id = ?', [avatar_url, req.params.id]);
      res.json({ success: true, message: 'Cập nhật avatar thành công.', data: { avatar_url } });
    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
  });
});

/**
 * #10 - DELETE /api/users/:id
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM users WHERE user_id = ?', [req.params.id]);
    const user = rows[0];

    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    if (user.user_id === req.user.user_id) return res.status(400).json({ success: false, message: 'Bạn không thể xóa chính mình.' });

    await db.query('DELETE FROM users WHERE user_id = ?', [req.params.id]);
    res.json({ success: true, message: 'Đã xóa người dùng thành công.', data: { user_id: req.params.id } });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

export default router;
