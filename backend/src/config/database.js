import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'do_anv2',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

// Đảm bảo mọi connection dùng UTF-8 đầy đủ (tránh tiếng Việt thành H??? t???)
pool.on('connection', (connection) => {
  connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
});

/**
 * Lấy connection pool
 * Sử dụng: const [rows] = await pool.query(sql, params)
 */
export function getDb() {
  return pool;
}

/**
 * Khởi tạo database - kiểm tra kết nối
 */
export async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Kết nối MySQL thành công! (root@localhost:3306/do_anv2)');
    connection.release();
  } catch (error) {
    console.error('❌ Lỗi kết nối MySQL:', error.message);
    process.exit(1);
  }
}

export default pool;
