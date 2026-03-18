import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

/**
 * #11 - GET /api/categories
 */
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const { } = req.query;

    let query = 'SELECT * FROM categories';
    const params = [];

    query += ' ORDER BY priority_level ASC, name ASC';
    const [categories] = await db.query(query, params);

    // Đếm số report cho mỗi category
    const result = [];
    for (const cat of categories) {
      const [countRows] = await db.query('SELECT COUNT(*) as count FROM reports WHERE category_id = ?', [cat.category_id]);
      result.push({ ...cat, total_reports: countRows[0].count });
    }

    res.json({ success: true, message: 'Lấy danh sách danh mục thành công.', data: result });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #12 - GET /api/categories/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM categories WHERE category_id = ?', [req.params.id]);
    const category = rows[0];

    if (!category) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục.' });

    const [countRows] = await db.query('SELECT COUNT(*) as count FROM reports WHERE category_id = ?', [req.params.id]);

    res.json({ success: true, message: 'Lấy thông tin danh mục thành công.', data: { ...category, total_reports: countRows[0].count } });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #13 - POST /api/categories
 */
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, description, priority_level } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc.' });

    const db = getDb();
    const [existing] = await db.query('SELECT category_id FROM categories WHERE name = ?', [name]);
    if (existing.length > 0) return res.status(409).json({ success: false, message: 'Tên danh mục đã tồn tại.' });

    const category_id = uuidv4();
    await db.query(
      'INSERT INTO categories (category_id, name, description, priority_level) VALUES (?, ?, ?, ?)',
      [category_id, name, description || '', priority_level || 2]
    );

    const [created] = await db.query('SELECT * FROM categories WHERE category_id = ?', [category_id]);
    res.status(201).json({ success: true, message: 'Tạo danh mục thành công.', data: created[0] });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #14 - PUT /api/categories/:id
 */
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = getDb();
    const [existRows] = await db.query('SELECT * FROM categories WHERE category_id = ?', [req.params.id]);
    const existing = existRows[0];
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục.' });

    const { name, description, priority_level } = req.body;

    if (name && name !== existing.name) {
      const [dup] = await db.query('SELECT category_id FROM categories WHERE name = ? AND category_id != ?', [name, req.params.id]);
      if (dup.length > 0) return res.status(409).json({ success: false, message: 'Tên danh mục đã tồn tại.' });
    }

    await db.query(
      'UPDATE categories SET name = ?, description = ?, priority_level = ? WHERE category_id = ?',
      [
        name || existing.name,
        description !== undefined ? description : existing.description,
        priority_level || existing.priority_level,
        req.params.id
      ]
    );

    const [updated] = await db.query('SELECT * FROM categories WHERE category_id = ?', [req.params.id]);
    res.json({ success: true, message: 'Cập nhật danh mục thành công.', data: updated[0] });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

/**
 * #15 - DELETE /api/categories/:id
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = getDb();
    const [existRows] = await db.query('SELECT * FROM categories WHERE category_id = ?', [req.params.id]);
    if (existRows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục.' });

    const [countRows] = await db.query('SELECT COUNT(*) as count FROM reports WHERE category_id = ?', [req.params.id]);
    if (countRows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa. Danh mục đang được sử dụng bởi ${countRows[0].count} báo cáo.`
      });
    }

    await db.query('DELETE FROM categories WHERE category_id = ?', [req.params.id]);
    res.json({ success: true, message: 'Đã xóa danh mục thành công.', data: { category_id: req.params.id } });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

export default router;
