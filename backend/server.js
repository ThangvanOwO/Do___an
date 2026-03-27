import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDatabase } from './src/config/database.js';
import { errorHandler } from './src/middleware/errorHandler.js';

import authRoutes from './src/routes/auth.routes.js';
import usersRoutes from './src/routes/users.routes.js';
import categoriesRoutes from './src/routes/categories.routes.js';
import reportsRoutes from './src/routes/reports.routes.js';
import logsRoutes from './src/routes/logs.routes.js';
import statisticsRoutes from './src/routes/statistics.routes.js';
import floodsRoutes from './src/routes/floods.routes.js';
import vietmapRoutes from './src/routes/vietmap.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ép charset UTF-8 cho JSON (trình duyệt/proxy parse đúng tiếng Việt)
app.use((req, res, next) => {
  const _json = res.json.bind(res);
  res.json = (body) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return _json(body);
  };
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============ KHỞI TẠO DATABASE ============
await initDatabase();

// ============ ROUTES ============
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Bản đồ Cộng đồng & Báo cáo Sự cố - API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      categories: '/api/categories',
      reports: '/api/reports',
      logs: '/api/logs',
      statistics: '/api/statistics',
      floods: '/api/floods',
      vietmap: '/api/vietmap (proxy Route)'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/floods', floodsRoutes);
app.use('/api/vietmap', vietmapRoutes);

// ============ ERROR HANDLER ============
app.use(errorHandler);

// ============ 404 ============
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy route: ${req.method} ${req.originalUrl}`
  });
});

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
});

export default app;
