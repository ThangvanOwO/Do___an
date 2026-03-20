import { Router } from 'express';
import { getDb } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

/**
 * #31 - GET /api/statistics/overview
 */
router.get('/overview', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = getDb();

    const [[{ count: totalUsers }]] = await db.query('SELECT COUNT(*) as count FROM users');
    const [[{ count: totalReports }]] = await db.query('SELECT COUNT(*) as count FROM reports');
    const [[{ count: totalCategories }]] = await db.query('SELECT COUNT(*) as count FROM categories');

    const [reportsByStatus] = await db.query('SELECT status, COUNT(*) as count FROM reports GROUP BY status');
    const completedCount = reportsByStatus.find(r => r.status === 'completed')?.count || 0;
    const completionRate = totalReports > 0 ? ((completedCount / totalReports) * 100).toFixed(1) : 0;

    const [monthlyReports] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as total,
             SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM reports WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month ASC
    `);

    const [usersByRole] = await db.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');

    res.json({ success: true, message: 'Lấy thống kê tổng quan thành công.', data: { total_users: totalUsers, total_reports: totalReports, total_categories: totalCategories, completion_rate: `${completionRate}%`, reports_by_status: reportsByStatus, monthly_reports: monthlyReports, users_by_role: usersByRole } });
  } catch (error) {
    console.error('Overview stats error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #32 - GET /api/statistics/by-category
 */
router.get('/by-category', authenticate, authorize('admin', 'staff'), async (req, res) => {
  try {
    const db = getDb();
    // Status theo CSDL: pending, in_progress, completed, cancelled
    const [stats] = await db.query(`
      SELECT c.category_id, c.name, c.priority_level,
             COUNT(r.report_id) as total_reports,
             SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) as pending,
             SUM(CASE WHEN r.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
             SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completed,
             SUM(CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM categories c LEFT JOIN reports r ON c.category_id = r.category_id
      GROUP BY c.category_id ORDER BY total_reports DESC
    `);
    res.json({ success: true, message: 'Thống kê theo danh mục thành công.', data: stats });
  } catch (error) {
    console.error('By category stats error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #33 - GET /api/statistics/by-status
 */
router.get('/by-status', authenticate, authorize('admin', 'staff'), async (req, res) => {
  try {
    const db = getDb();
    // Status labels theo CSDL
    const statusLabels = { pending: 'Chờ tiếp nhận', in_progress: 'Đang xử lý', completed: 'Đã hoàn thành', cancelled: 'Đã hủy' };
    const [stats] = await db.query('SELECT status, COUNT(*) as count FROM reports GROUP BY status ORDER BY count DESC');
    const result = stats.map(s => ({ ...s, label: statusLabels[s.status] || s.status }));
    res.json({ success: true, message: 'Thống kê theo trạng thái thành công.', data: result });
  } catch (error) {
    console.error('By status stats error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #34 - GET /api/statistics/heatmap
 */
router.get('/heatmap', async (req, res) => {
  try {
    const db = getDb();
    const { category_id, status } = req.query;
    let where = "WHERE r.status != 'cancelled'";
    const params = [];
    if (category_id) { where += ' AND r.category_id = ?'; params.push(category_id); }
    if (status) { where = 'WHERE r.status = ?'; params.push(status); }

    const [points] = await db.query(`
      SELECT r.latitude, r.longitude, c.priority_level
      FROM reports r LEFT JOIN categories c ON r.category_id = c.category_id ${where}
    `, params);

    const heatmapData = points.map(p => ({ lat: p.latitude, lng: p.longitude, weight: (4 - (p.priority_level || 2)) }));
    res.json({ success: true, message: `Lấy ${heatmapData.length} điểm heatmap.`, data: heatmapData });
  } catch (error) {
    console.error('Heatmap error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #35 - GET /api/statistics/top-reporters
 */
router.get('/top-reporters', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = getDb();
    const { limit = 10 } = req.query;
    const [topReporters] = await db.query(`
      SELECT u.user_id, u.full_name, u.avatar_url, u.role,
             COUNT(r.report_id) as total_reports,
             SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completed_reports
      FROM users u LEFT JOIN reports r ON u.user_id = r.user_id
      GROUP BY u.user_id HAVING total_reports > 0
      ORDER BY total_reports DESC LIMIT ?
    `, [parseInt(limit)]);
    res.json({ success: true, message: 'Lấy danh sách người báo cáo nhiều nhất.', data: topReporters });
  } catch (error) {
    console.error('Top reporters error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #36 - GET /api/statistics/recent-activity
 */
router.get('/recent-activity', authenticate, authorize('admin', 'staff'), async (req, res) => {
  try {
    const db = getDb();
    const { limit = 20 } = req.query;

    const [recentReports] = await db.query(`
      SELECT r.report_id, r.title, r.status, r.created_at, u.full_name as reporter_name,
             c.name as category_name
      FROM reports r LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN categories c ON r.category_id = c.category_id
      ORDER BY r.created_at DESC LIMIT ?
    `, [parseInt(limit)]);

    const [recentLogs] = await db.query(`
      SELECT rl.log_id, rl.old_status, rl.new_status, rl.updated_at,
             u.full_name as staff_name, r.title as report_title
      FROM report_logs rl LEFT JOIN users u ON rl.changed_by = u.user_id
      LEFT JOIN reports r ON rl.report_id = r.report_id
      ORDER BY rl.updated_at DESC LIMIT ?
    `, [parseInt(limit)]);

    res.json({ success: true, message: 'Lấy hoạt động gần đây thành công.', data: { recent_reports: recentReports, recent_logs: recentLogs } });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

export default router;
