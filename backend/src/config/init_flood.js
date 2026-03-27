import mysql from 'mysql2/promise';

async function initFlood() {
  // Dùng cùng cấu hình với database.js (do_anv2)
  const conn = await mysql.createConnection({
    host: 'localhost', port: 3306, user: 'root', password: '123456', database: 'do_anv2'
  });

  await conn.query('DROP TABLE IF EXISTS flood_images');
  await conn.query('DROP TABLE IF EXISTS flood_reports');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS flood_reports (
      flood_id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      latitude DOUBLE NOT NULL,
      longitude DOUBLE NOT NULL,
      address TEXT,
      severity_level ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
      description TEXT,
      image_url VARCHAR(500),
      water_level_cm INT DEFAULT 0,
      road_passable TINYINT(1) DEFAULT 1,
      status ENUM('active','resolved') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      INDEX idx_flood_location (latitude, longitude),
      INDEX idx_flood_status (status),
      INDEX idx_flood_severity (severity_level),
      INDEX idx_flood_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS flood_images (
      image_id VARCHAR(36) PRIMARY KEY,
      flood_id VARCHAR(36) NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (flood_id) REFERENCES flood_reports(flood_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('✅ Tables flood_reports + flood_images created!');
  await conn.end();
  process.exit(0);
}

initFlood().catch(err => { console.error(err); process.exit(1); });
