import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/database.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { uploadFloodImages } from '../middleware/upload.js';

const router = Router();

const severityLabels = {
  low: 'Nhẹ - Nước ngập nhẹ, xe vẫn đi được',
  medium: 'Trung bình - Nước ngập vừa, xe máy khó đi',
  high: 'Nghiêm trọng - Nước ngập sâu, không đi được',
  critical: 'Rất nghiêm trọng - Nguy hiểm, cần cứu hộ'
};

/**
 * GET /api/floods
 * Lấy danh sách tất cả điểm ngập lụt (có lọc, phân trang)
 */
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const { page = 1, limit = 50, status, severity_level, lat, lng, radius } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];

    if (status) { where += ' AND f.status = ?'; params.push(status); }
    if (severity_level) { where += ' AND f.severity_level = ?'; params.push(severity_level); }

    if (lat && lng && radius) {
      where += ` AND (6371 * acos(cos(radians(?)) * cos(radians(f.latitude)) * cos(radians(f.longitude) - radians(?)) + sin(radians(?)) * sin(radians(f.latitude)))) <= ?`;
      params.push(parseFloat(lat), parseFloat(lng), parseFloat(lat), parseFloat(radius));
    }

    const [countRows] = await db.query(`SELECT COUNT(*) as count FROM flood_reports f ${where}`, params);
    const total = countRows[0].count;

    const [floods] = await db.query(`
      SELECT f.*, u.full_name as reporter_name, u.avatar_url as reporter_avatar
      FROM flood_reports f
      LEFT JOIN users u ON f.user_id = u.user_id
      ${where}
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const result = [];
    for (const flood of floods) {
      const [images] = await db.query('SELECT * FROM flood_images WHERE flood_id = ?', [flood.flood_id]);
      result.push({ ...flood, images, severity_label: severityLabels[flood.severity_level] });
    }

    res.json({
      success: true, message: 'Lấy danh sách điểm ngập lụt thành công.',
      data: { floods: result, pagination: { total, page: parseInt(page), limit: parseInt(limit), total_pages: Math.ceil(total / parseInt(limit)) } }
    });
  } catch (error) {
    console.error('Get floods error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * GET /api/floods/map-data
 * Lấy tất cả điểm ngập đang hoạt động cho bản đồ
 */
router.get('/map-data', async (req, res) => {
  try {
    const db = getDb();
    const { severity_level } = req.query;

    let where = "WHERE f.status = 'active'";
    const params = [];
    if (severity_level) { where += ' AND f.severity_level = ?'; params.push(severity_level); }

    const [floods] = await db.query(`
      SELECT f.flood_id, f.latitude, f.longitude, f.severity_level, f.description,
             f.water_level_cm, f.road_passable, f.address, f.image_url,
             f.created_at,
             u.full_name as reporter_name
      FROM flood_reports f
      LEFT JOIN users u ON f.user_id = u.user_id
      ${where}
      ORDER BY f.created_at DESC
    `, params);

    const result = floods.map(f => ({ ...f, severity_label: severityLabels[f.severity_level] }));

    res.json({
      success: true, message: `Lấy ${result.length} điểm ngập lụt trên bản đồ.`,
      data: result
    });
  } catch (error) {
    console.error('Get flood map data error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * GET /api/floods/nearby
 * Tìm điểm ngập gần vị trí
 */
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tọa độ (lat, lng).' });

    const db = getDb();
    const [floods] = await db.query(`
      SELECT f.*, u.full_name as reporter_name,
             (6371 * acos(cos(radians(?)) * cos(radians(f.latitude)) * cos(radians(f.longitude) - radians(?)) + sin(radians(?)) * sin(radians(f.latitude)))) AS distance_km
      FROM flood_reports f
      LEFT JOIN users u ON f.user_id = u.user_id
      WHERE f.status = 'active'
      HAVING distance_km <= ?
      ORDER BY distance_km ASC LIMIT 50
    `, [parseFloat(lat), parseFloat(lng), parseFloat(lat), parseFloat(radius)]);

    const result = floods.map(f => ({ ...f, severity_label: severityLabels[f.severity_level] }));

    res.json({ success: true, message: `Tìm thấy ${result.length} điểm ngập trong bán kính ${radius}km.`, data: result });
  } catch (error) {
    console.error('Get nearby floods error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * GET /api/floods/:id
 * Chi tiết 1 điểm ngập
 */
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query(`
      SELECT f.*, u.full_name as reporter_name, u.phone_number as reporter_phone, u.avatar_url as reporter_avatar
      FROM flood_reports f LEFT JOIN users u ON f.user_id = u.user_id
      WHERE f.flood_id = ?
    `, [req.params.id]);
    const flood = rows[0];
    if (!flood) return res.status(404).json({ success: false, message: 'Không tìm thấy điểm ngập lụt.' });

    const [images] = await db.query('SELECT * FROM flood_images WHERE flood_id = ?', [req.params.id]);

    res.json({
      success: true, message: 'Lấy chi tiết điểm ngập thành công.',
      data: { ...flood, images, severity_label: severityLabels[flood.severity_level] }
    });
  } catch (error) {
    console.error('Get flood detail error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * POST /api/floods
 * Báo cáo điểm ngập lụt mới (người dân chụp ảnh + ghim vị trí)
 */
router.post('/', authenticate, (req, res) => {
  uploadFloodImages(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });

    try {
      const { latitude, longitude, address, severity_level, description, water_level_cm, road_passable } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn vị trí tuyến đường bị ngập (latitude, longitude).' });
      }
      if (!severity_level) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn mức độ nghiêm trọng.' });
      }

      const validSeverity = ['low', 'medium', 'high', 'critical'];
      if (!validSeverity.includes(severity_level)) {
        return res.status(400).json({ success: false, message: `Mức độ không hợp lệ. Cho phép: ${validSeverity.join(', ')}` });
      }

      const db = getDb();
      const flood_id = uuidv4();
      const mainImage = req.files && req.files.length > 0 ? `/uploads/floods/${req.files[0].filename}` : null;

      await db.query(
        `INSERT INTO flood_reports (flood_id, user_id, latitude, longitude, address, severity_level, description, image_url, water_level_cm, road_passable)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [flood_id, req.user.user_id, parseFloat(latitude), parseFloat(longitude), address || '',
         severity_level, description || '', mainImage,
         water_level_cm ? parseInt(water_level_cm) : 0,
         road_passable !== undefined ? parseInt(road_passable) : 1]
      );

      // Lưu nhiều ảnh
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          await db.query('INSERT INTO flood_images (image_id, flood_id, image_url) VALUES (?, ?, ?)',
            [uuidv4(), flood_id, `/uploads/floods/${file.filename}`]);
        }
      }

      const [created] = await db.query('SELECT * FROM flood_reports WHERE flood_id = ?', [flood_id]);
      const [images] = await db.query('SELECT * FROM flood_images WHERE flood_id = ?', [flood_id]);

      res.status(201).json({
        success: true, message: 'Báo cáo ngập lụt thành công! Cảm ơn bạn đã đóng góp thông tin.',
        data: { ...created[0], images, severity_label: severityLabels[severity_level] }
      });
    } catch (error) {
      console.error('Create flood report error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server khi tạo báo cáo ngập lụt.' });
    }
  });
});

/**
 * PATCH /api/floods/:id/resolve
 * Đánh dấu đã hết ngập
 */
router.patch('/:id/resolve', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM flood_reports WHERE flood_id = ?', [req.params.id]);
    const flood = rows[0];
    if (!flood) return res.status(404).json({ success: false, message: 'Không tìm thấy điểm ngập lụt.' });

    if (flood.user_id !== req.user.user_id && req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật trạng thái này.' });
    }

    await db.query('UPDATE flood_reports SET status = ? WHERE flood_id = ?', ['resolved', req.params.id]);

    res.json({ success: true, message: 'Đã đánh dấu hết ngập.', data: { flood_id: req.params.id, status: 'resolved' } });
  } catch (error) {
    console.error('Resolve flood error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * DELETE /api/floods/:id
 * Xóa báo cáo ngập
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM flood_reports WHERE flood_id = ?', [req.params.id]);
    const flood = rows[0];
    if (!flood) return res.status(404).json({ success: false, message: 'Không tìm thấy điểm ngập lụt.' });

    if (flood.user_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa báo cáo ngập lụt này.' });
    }

    await db.query('DELETE FROM flood_reports WHERE flood_id = ?', [req.params.id]);
    res.json({ success: true, message: 'Đã xóa báo cáo ngập lụt.', data: { flood_id: req.params.id } });
  } catch (error) {
    console.error('Delete flood error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

export default router;
