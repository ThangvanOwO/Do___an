/**
 * Script tạo database và tables trong MySQL
 * Chạy: node src/config/init_mysql.js
 */
import mysql from 'mysql2/promise';

const ROOT_HOST = 'localhost';
const ROOT_PORT = 3306;
const ROOT_USER = 'root';
const ROOT_PASS = '123456';

const DB_NAME = 'do_an';
const DB_USER = 'do_an';
const DB_PASS = '123456';

async function initMySQL() {
  let conn;
  try {
    // 1. Kết nối root để tạo database + user
    conn = await mysql.createConnection({
      host: ROOT_HOST,
      port: ROOT_PORT,
      user: ROOT_USER,
      password: ROOT_PASS,
    });

    console.log('✅ Kết nối MySQL root thành công!');

    // Tạo database
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${DB_NAME}' đã tạo/tồn tại.`);

    // Tạo user
    try {
      await conn.query(`CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}'`);
    } catch (e) {
      // User đã tồn tại
    }
    await conn.query(`GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost'`);
    await conn.query('FLUSH PRIVILEGES');
    console.log(`✅ User '${DB_USER}' đã tạo/cấp quyền.`);

    await conn.end();

    // 2. Kết nối vào database để tạo tables
    conn = await mysql.createConnection({
      host: ROOT_HOST,
      port: ROOT_PORT,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
    });

    console.log(`✅ Kết nối database '${DB_NAME}' thành công!`);

    // DROP old tables (order matters due to foreign keys)
    const dropOrder = ['report_logs', 'report_images', 'reports', 'categories', 'upvotes', 'notifications', 'users'];
    for (const t of dropOrder) {
      await conn.query(`DROP TABLE IF EXISTS \`${t}\``);
    }
    console.log('  🗑️ Đã xóa các bảng cũ (nếu có)');

    // ============ BẢNG USERS ============
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(36) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(15) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('citizen', 'admin', 'staff') NOT NULL DEFAULT 'citizen',
        avatar_url VARCHAR(500) DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ Bảng users');

    // ============ BẢNG CATEGORIES ============
    await conn.query(`
      CREATE TABLE IF NOT EXISTS categories (
        category_id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        priority_level TINYINT(1) DEFAULT 2 CHECK(priority_level IN (1, 2, 3))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ Bảng categories');

    // ============ BẢNG REPORTS ============
    await conn.query(`
      CREATE TABLE IF NOT EXISTS reports (
        report_id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        image_url VARCHAR(500),
        latitude DOUBLE NOT NULL,
        longitude DOUBLE NOT NULL,
        status ENUM('pending', 'confirmed', 'in_progress', 'resolved', 'rejected') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id VARCHAR(36) NOT NULL,
        category_id VARCHAR(36) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT,
        INDEX idx_reports_user (user_id),
        INDEX idx_reports_category (category_id),
        INDEX idx_reports_status (status),
        INDEX idx_reports_location (latitude, longitude)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ Bảng reports');

    // ============ BẢNG REPORT_IMAGES ============
    await conn.query(`
      CREATE TABLE IF NOT EXISTS report_images (
        image_id VARCHAR(36) PRIMARY KEY,
        report_id VARCHAR(36) NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ Bảng report_images');

    // ============ BẢNG REPORT_LOGS ============
    await conn.query(`
      CREATE TABLE IF NOT EXISTS report_logs (
        log_id VARCHAR(36) PRIMARY KEY,
        report_id VARCHAR(36) NOT NULL,
        changed_by VARCHAR(36) NOT NULL,
        old_status VARCHAR(20),
        new_status VARCHAR(20) NOT NULL,
        proof_image_url VARCHAR(500),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_report_logs_report (report_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ Bảng report_logs');

    console.log('\n🎉 Hoàn thành tạo tất cả tables trong MySQL!');
    await conn.end();

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

initMySQL();
