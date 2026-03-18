import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadProofImage } from '../middleware/upload.js';

const router = Router();

/**
 * #27 - GET /api/logs
 */
router.get('/', authenticate, authorize('admin', 'staff'), async (req, res) => {
  try {
    const db = getDb();
    const { page = 1, limit = 20, report_id, changed_by } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];
    if (report_id) { where += ' AND rl.report_id = ?'; params.push(report_id); }
    if (changed_by) { where += ' AND rl.changed_by = ?'; params.push(changed_by); }

    const [countRows] = await db.query(`SELECT COUNT(*) as count FROM report_logs rl ${where}`, params);
    const total = countRows[0].count;

    const [logs] = await db.query(`
      SELECT rl.*, u.full_name as changed_by_name, u.role as changed_by_role, r.title as report_title
      FROM report_logs rl LEFT JOIN users u ON rl.changed_by = u.user_id
      LEFT JOIN reports r ON rl.report_id = r.report_id
      ${where} ORDER BY rl.updated_at DESC LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    res.json({ success: true, message: 'Lấy danh sách nhật ký thành công.', data: { logs, pagination: { total, page: parseInt(page), limit: parseInt(limit), total_pages: Math.ceil(total / parseInt(limit)) } } });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #28 - GET /api/logs/report/:reportId
 */
router.get('/report/:reportId', async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM reports WHERE report_id = ?', [req.params.reportId]);
    const report = rows[0];
    if (!report) return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo.' });

    const [logs] = await db.query(`
      SELECT rl.*, u.full_name as changed_by_name, u.role as changed_by_role
      FROM report_logs rl LEFT JOIN users u ON rl.changed_by = u.user_id
      WHERE rl.report_id = ? ORDER BY rl.updated_at ASC
    `, [req.params.reportId]);

    res.json({ success: true, message: 'Lấy lịch sử xử lý thành công.', data: { report_id: req.params.reportId, report_title: report.title, current_status: report.status, logs } });
  } catch (error) {
    console.error('Get report logs error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #29 - POST /api/logs
 */
router.post('/', authenticate, authorize('admin', 'staff'), (req, res) => {
  uploadProofImage(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });

    try {
      const { report_id, new_status } = req.body;
      if (!report_id || !new_status) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp report_id và new_status.' });

      const validStatuses = ['pending', 'confirmed', 'in_progress', 'resolved', 'rejected'];
      if (!validStatuses.includes(new_status)) return res.status(400).json({ success: false, message: `Trạng thái không hợp lệ. Các giá trị cho phép: ${validStatuses.join(', ')}` });

      const db = getDb();
      const [rows] = await db.query('SELECT * FROM reports WHERE report_id = ?', [report_id]);
      const report = rows[0];
      if (!report) return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo.' });

      const old_status = report.status;
      const proof_image_url = req.file ? `/uploads/proofs/${req.file.filename}` : null;
      const log_id = uuidv4();

      await db.query('INSERT INTO report_logs (log_id, report_id, changed_by, old_status, new_status, proof_image_url) VALUES (?, ?, ?, ?, ?, ?)',
        [log_id, report_id, req.user.user_id, old_status, new_status, proof_image_url]);

      await db.query('UPDATE reports SET status = ? WHERE report_id = ?', [new_status, report_id]);

      res.status(201).json({ success: true, message: 'Tạo nhật ký xử lý thành công.', data: { log_id, report_id, old_status, new_status, proof_image_url, changed_by: req.user.full_name, updated_at: new Date().toISOString() } });
    } catch (error) {
      console.error('Create log error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
  });
});

/**
 * #30 - GET /api/logs/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query(`
      SELECT rl.*, u.full_name as changed_by_name, u.role as changed_by_role, r.title as report_title
      FROM report_logs rl LEFT JOIN users u ON rl.changed_by = u.user_id
      LEFT JOIN reports r ON rl.report_id = r.report_id
      WHERE rl.log_id = ?
    `, [req.params.id]);
    const log = rows[0];
    if (!log) return res.status(404).json({ success: false, message: 'Không tìm thấy nhật ký.' });

    res.json({ success: true, message: 'Lấy chi tiết nhật ký thành công.', data: log });
  } catch (error) {
    console.error('Get log detail error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

export default router;
