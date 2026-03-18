import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'do_an',
  password: '123456',
  database: 'do_an',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
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
    console.log('✅ Kết nối MySQL thành công! (do_an@localhost:3306/do_an)');
    connection.release();
  } catch (error) {
    console.error('❌ Lỗi kết nối MySQL:', error.message);
    process.exit(1);
  }
}

export default pool;
