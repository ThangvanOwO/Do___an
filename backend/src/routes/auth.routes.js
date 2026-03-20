import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/database.js';
import { authenticate, JWT_SECRET, JWT_EXPIRES_IN } from '../middleware/auth.js';

const router = Router();

/**
 * #1 - POST /api/auth/register
 * Đăng ký tài khoản mới
 */
router.post('/register', async (req, res) => {
  try {
    const { full_name, phone_number, password, role } = req.body;

    if (!full_name || !phone_number || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ: full_name, phone_number, password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự.'
      });
    }

    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(phone_number)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không hợp lệ. Phải bắt đầu bằng 0 và có 10 chữ số.'
      });
    }

    const db = getDb();

    const [existing] = await db.query('SELECT user_id FROM users WHERE phone_number = ?', [phone_number]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Số điện thoại đã được đăng ký.'
      });
    }

    const user_id = uuidv4();
    const password_hash = bcrypt.hashSync(password, 10);
    
    // Role: 'citizen', 'admin', 'staff'
    let userRole = 'citizen';
    if (role === 'admin') {
      userRole = 'admin';
    } else if (role === 'staff') {
      userRole = 'staff';
    }

    await db.query(
      'INSERT INTO users (user_id, full_name, phone_number, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [user_id, full_name, phone_number, password_hash, userRole]
    );

    const token = jwt.sign({ user_id, role: userRole }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công!',
      data: {
        user: { user_id, full_name, phone_number, role: userRole, avatar_url: null },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký.' });
  }
});

/**
 * #2 - POST /api/auth/login
 * Đăng nhập
 */
router.post('/login', async (req, res) => {
  try {
    const { phone_number, password } = req.body;

    if (!phone_number || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập số điện thoại và mật khẩu.'
      });
    }

    const db = getDb();
    const [rows] = await db.query('SELECT * FROM users WHERE phone_number = ?', [phone_number]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Số điện thoại hoặc mật khẩu không đúng.'
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Số điện thoại hoặc mật khẩu không đúng.'
      });
    }

    const token = jwt.sign({ user_id: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          phone_number: user.phone_number,
          role: user.role,
          avatar_url: user.avatar_url
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập.' });
  }
});

/**
 * #3 - GET /api/auth/me
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query(
      'SELECT user_id, full_name, phone_number, role, avatar_url FROM users WHERE user_id = ?',
      [req.user.user_id]
    );
    const user = rows[0];

    const [countRows] = await db.query('SELECT COUNT(*) as count FROM reports WHERE user_id = ?', [req.user.user_id]);

    res.json({
      success: true,
      message: 'Lấy thông tin thành công.',
      data: { ...user, total_reports: countRows[0].count }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #4 - PUT /api/auth/change-password
 */
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới.'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự.'
      });
    }

    const db = getDb();
    const [rows] = await db.query('SELECT password_hash FROM users WHERE user_id = ?', [req.user.user_id]);
    const user = rows[0];

    if (!bcrypt.compareSync(old_password, user.password_hash)) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu cũ không đúng.'
      });
    }

    const newHash = bcrypt.hashSync(new_password, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [newHash, req.user.user_id]);

    res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đổi mật khẩu.' });
  }
});

export default router;
