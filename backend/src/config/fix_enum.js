import mysql from 'mysql2/promise';
const c = await mysql.createConnection({ host: 'localhost', port: 3306, user: 'do_an', password: '123456', database: 'do_an' });
await c.query(`ALTER TABLE notifications MODIFY COLUMN type ENUM('new_report','status_update','upvote','system','flood_report') DEFAULT 'system'`);
console.log('✅ notifications type ENUM updated!');
await c.end();
process.exit(0);
