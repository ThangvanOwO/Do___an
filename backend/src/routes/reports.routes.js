import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadReportImages } from '../middleware/upload.js';

const router = Router();

/**
 * #16 - GET /api/reports
 */
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const {
      page = 1, limit = 20, status, category_id, user_id, search,
      sort_by = 'created_at', sort_order = 'DESC', lat, lng, radius
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE 1=1';
    const params = [];

    if (status) { where += ' AND r.status = ?'; params.push(status); }
    if (category_id) { where += ' AND r.category_id = ?'; params.push(category_id); }
    if (user_id) { where += ' AND r.user_id = ?'; params.push(user_id); }
    if (search) {
      where += ' AND (r.title LIKE ? OR r.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (lat && lng && radius) {
      where += ` AND (
        6371 * acos(
          cos(radians(?)) * cos(radians(r.latitude)) *
          cos(radians(r.longitude) - radians(?)) +
          sin(radians(?)) * sin(radians(r.latitude))
        )
      ) <= ?`;
      params.push(parseFloat(lat), parseFloat(lng), parseFloat(lat), parseFloat(radius));
    }

    const allowedSort = ['created_at', 'status'];
    const actualSort = allowedSort.includes(sort_by) ? sort_by : 'created_at';
    const actualOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [countRows] = await db.query(`SELECT COUNT(*) as count FROM reports r ${where}`, params);
    const total = countRows[0].count;

    const [reports] = await db.query(`
      SELECT r.*, 
             u.full_name as reporter_name, u.phone_number as reporter_phone, u.avatar_url as reporter_avatar,
             c.name as category_name, c.priority_level
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN categories c ON r.category_id = c.category_id
      ${where}
      ORDER BY r.${actualSort} ${actualOrder}
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const result = [];
    for (const report of reports) {
      const [images] = await db.query('SELECT * FROM report_images WHERE report_id = ?', [report.report_id]);
      result.push({ ...report, images });
    }

    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    res.json({
      success: true, message: 'Lấy danh sách báo cáo thành công.',
      data: result,
      pagination: { total, page: pageNum, limit: limitNum, total_pages: Math.ceil(total / limitNum) || 1 }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #17 - GET /api/reports/my-reports
 */
router.get('/my-reports', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE r.user_id = ?';
    const params = [req.user.user_id];
    if (status) { where += ' AND r.status = ?'; params.push(status); }

    const [countRows] = await db.query(`SELECT COUNT(*) as count FROM reports r ${where}`, params);
    const total = countRows[0].count;

    const [reports] = await db.query(`
      SELECT r.*, c.name as category_name
      FROM reports r LEFT JOIN categories c ON r.category_id = c.category_id
      ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const result = [];
    for (const report of reports) {
      const [images] = await db.query('SELECT * FROM report_images WHERE report_id = ?', [report.report_id]);
      result.push({ ...report, images });
    }

    res.json({
      success: true, message: 'Lấy danh sách báo cáo của bạn thành công.',
      data: { reports: result, pagination: { total, page: parseInt(page), limit: parseInt(limit), total_pages: Math.ceil(total / parseInt(limit)) } }
    });
  } catch (error) {
    console.error('Get my reports error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #18 - GET /api/reports/nearby
 */
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tọa độ (lat, lng).' });

    const db = getDb();
    const [reports] = await db.query(`
      SELECT r.*, u.full_name as reporter_name,
             c.name as category_name,
             (6371 * acos(cos(radians(?)) * cos(radians(r.latitude)) * cos(radians(r.longitude) - radians(?)) + sin(radians(?)) * sin(radians(r.latitude)))) AS distance_km
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN categories c ON r.category_id = c.category_id
      WHERE r.status != 'cancelled'
      HAVING distance_km <= ?
      ORDER BY distance_km ASC LIMIT 50
    `, [parseFloat(lat), parseFloat(lng), parseFloat(lat), parseFloat(radius)]);

    res.json({ success: true, message: `Tìm thấy ${reports.length} báo cáo trong bán kính ${radius}km.`, data: reports });
  } catch (error) {
    console.error('Get nearby reports error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #19 - GET /api/reports/map-data
 */
router.get('/map-data', async (req, res) => {
  try {
    const db = getDb();
    const { status, category_id } = req.query;
    let where = "WHERE r.status != 'cancelled'";
    const params = [];

    if (status) { where = 'WHERE r.status = ?'; params.push(status); }
    if (category_id) { where += ' AND r.category_id = ?'; params.push(category_id); }

    const [reports] = await db.query(`
      SELECT r.report_id, r.title, r.description, r.latitude, r.longitude, r.status,
             r.created_at, c.name as category_name, c.priority_level
      FROM reports r LEFT JOIN categories c ON r.category_id = c.category_id
      ${where} ORDER BY r.created_at DESC
    `, params);

    // Lấy ảnh đầu tiên cho mỗi report
    const result = [];
    for (const report of reports) {
      const [images] = await db.query(
        'SELECT image_url FROM report_images WHERE report_id = ? LIMIT 1', 
        [report.report_id]
      );
      result.push({ 
        ...report, 
        image_url: images.length > 0 ? images[0].image_url : null 
      });
    }

    res.json({ success: true, message: `Lấy ${result.length} điểm trên bản đồ.`, data: result });
  } catch (error) {
    console.error('Get map data error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #20 - GET /api/reports/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query(`
      SELECT r.*, u.full_name as reporter_name, u.phone_number as reporter_phone, u.avatar_url as reporter_avatar,
             c.name as category_name, c.priority_level, c.description as category_description
      FROM reports r LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN categories c ON r.category_id = c.category_id
      WHERE r.report_id = ?
    `, [req.params.id]);
    const report = rows[0];
    if (!report) return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo.' });

    const [images] = await db.query('SELECT * FROM report_images WHERE report_id = ?', [req.params.id]);
    const [logs] = await db.query(`
      SELECT rl.*, u.full_name as changed_by_name, u.role as changed_by_role
      FROM report_logs rl LEFT JOIN users u ON rl.changed_by = u.user_id
      WHERE rl.report_id = ? ORDER BY rl.updated_at ASC
    `, [req.params.id]);

    res.json({ success: true, message: 'Lấy chi tiết báo cáo thành công.', data: { ...report, images, logs } });
  } catch (error) {
    console.error('Get report detail error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #21 - POST /api/reports
 */
router.post('/', authenticate, (req, res) => {
  uploadReportImages(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });

    try {
      const { title, description, latitude, longitude, category_id } = req.body;
      if (!title || !description || !latitude || !longitude || !category_id) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ: title, description, latitude, longitude, category_id' });
      }

      const db = getDb();
      const [catRows] = await db.query('SELECT * FROM categories WHERE category_id = ?', [category_id]);
      if (catRows.length === 0) return res.status(400).json({ success: false, message: 'Danh mục không hợp lệ.' });

      const report_id = uuidv4();

      await db.query(
        `INSERT INTO reports (report_id, title, description, latitude, longitude, status, user_id, category_id) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
        [report_id, title, description, parseFloat(latitude), parseFloat(longitude), req.user.user_id, category_id]
      );

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          await db.query('INSERT INTO report_images (image_id, report_id, image_url) VALUES (?, ?, ?)', [uuidv4(), report_id, `/uploads/reports/${file.filename}`]);
        }
      }

      const [created] = await db.query(`
        SELECT r.*, c.name as category_name
        FROM reports r LEFT JOIN categories c ON r.category_id = c.category_id WHERE r.report_id = ?
      `, [report_id]);
      const [images] = await db.query('SELECT * FROM report_images WHERE report_id = ?', [report_id]);

      res.status(201).json({ success: true, message: 'Tạo báo cáo sự cố thành công! Chúng tôi sẽ xử lý sớm nhất.', data: { ...created[0], images } });
    } catch (error) {
      console.error('Create report error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server khi tạo báo cáo.' });
    }
  });
});

/**
 * #22 - PUT /api/reports/:id
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM reports WHERE report_id = ?', [req.params.id]);
    const report = rows[0];
    if (!report) return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo.' });

    if (report.user_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa báo cáo này.' });
    }
    if (report.status === 'completed' && req.user.role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Không thể chỉnh sửa báo cáo đã hoàn thành.' });
    }

    const { title, description, latitude, longitude, category_id } = req.body;
    await db.query(`
      UPDATE reports SET title = ?, description = ?, latitude = ?, longitude = ?, category_id = ? WHERE report_id = ?
    `, [
      title || report.title, description || report.description,
      latitude ? parseFloat(latitude) : report.latitude,
      longitude ? parseFloat(longitude) : report.longitude,
      category_id || report.category_id, req.params.id
    ]);

    const [updated] = await db.query(`
      SELECT r.*, c.name as category_name
      FROM reports r LEFT JOIN categories c ON r.category_id = c.category_id WHERE r.report_id = ?
    `, [req.params.id]);

    res.json({ success: true, message: 'Cập nhật báo cáo thành công.', data: updated[0] });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #23 - PATCH /api/reports/:id/status
 */
router.patch('/:id/status', authenticate, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { new_status } = req.body;
    if (!new_status) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp trạng thái mới (new_status).' });

    // Status hợp lệ theo CSDL: pending, in_progress, completed, cancelled
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(new_status)) {
      return res.status(400).json({ success: false, message: `Trạng thái không hợp lệ. Các giá trị cho phép: ${validStatuses.join(', ')}` });
    }

    const db = getDb();
    const [rows] = await db.query('SELECT * FROM reports WHERE report_id = ?', [req.params.id]);
    const report = rows[0];
    if (!report) return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo.' });

    const old_status = report.status;
    await db.query('UPDATE reports SET status = ? WHERE report_id = ?', [new_status, req.params.id]);

    const log_id = uuidv4();
    await db.query('INSERT INTO report_logs (log_id, report_id, changed_by, old_status, new_status) VALUES (?, ?, ?, ?, ?)',
      [log_id, req.params.id, req.user.user_id, old_status, new_status]);

    const statusLabels = { pending: 'Chờ tiếp nhận', in_progress: 'Đang xử lý', completed: 'Đã hoàn thành', cancelled: 'Đã hủy' };

    res.json({
      success: true, message: `Cập nhật trạng thái thành công: ${statusLabels[old_status]} → ${statusLabels[new_status]}`,
      data: { report_id: req.params.id, old_status, new_status, log_id }
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #25 - POST /api/reports/:id/images
 */
router.post('/:id/images', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM reports WHERE report_id = ?', [req.params.id]);
    const report = rows[0];
    if (!report) return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo.' });
    if (report.user_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thêm ảnh cho báo cáo này.' });
    }

    uploadReportImages(req, res, async (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message });
      if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất 1 ảnh.' });

      try {
        const newImages = [];
        for (const file of req.files) {
          const image_id = uuidv4();
          const image_url = `/uploads/reports/${file.filename}`;
          await db.query('INSERT INTO report_images (image_id, report_id, image_url) VALUES (?, ?, ?)', [image_id, req.params.id, image_url]);
          newImages.push({ image_id, image_url });
        }
        res.status(201).json({ success: true, message: `Đã upload ${newImages.length} ảnh thành công.`, data: newImages });
      } catch (error) {
        console.error('Upload images error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server.' });
      }
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #26 - DELETE /api/reports/:id
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM reports WHERE report_id = ?', [req.params.id]);
    const report = rows[0];
    if (!report) return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo.' });

    if (report.user_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa báo cáo này.' });
    }

    await db.query('DELETE FROM reports WHERE report_id = ?', [req.params.id]);
    res.json({ success: true, message: 'Đã xóa báo cáo thành công.', data: { report_id: req.params.id } });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

export default router;
