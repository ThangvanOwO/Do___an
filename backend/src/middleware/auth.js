import jwt from 'jsonwebtoken';
import { getDb } from '../config/database.js';

const JWT_SECRET = 'community_map_secret_key_2026';
const JWT_EXPIRES_IN = '7d';

export { JWT_SECRET, JWT_EXPIRES_IN };

/**
 * Middleware xác thực JWT token
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Không có token xác thực. Vui lòng đăng nhập.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDb();
    db.query('SELECT user_id, full_name, phone_number, role, avatar_url FROM users WHERE user_id = ?', [decoded.user_id])
      .then(([rows]) => {
        const user = rows[0];
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ. Người dùng không tồn tại.'
          });
        }

        req.user = user;
        next();
      })
      .catch(err => {
        console.error('Auth DB error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi server.' });
      });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn. Vui lòng đăng nhập lại.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ.'
    });
  }
}

/**
 * Middleware phân quyền - chỉ cho phép role cụ thể
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền thực hiện hành động này. Yêu cầu quyền: ${roles.join(', ')}`
      });
    }

    next();
  };
}

/**
 * Middleware optional auth - không bắt buộc đăng nhập
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDb();
    db.query('SELECT user_id, full_name, phone_number, role, avatar_url FROM users WHERE user_id = ?', [decoded.user_id])
      .then(([rows]) => {
        req.user = rows[0] || null;
        next();
      })
      .catch(() => {
        req.user = null;
        next();
      });
  } catch {
    req.user = null;
    next();
  }
}
