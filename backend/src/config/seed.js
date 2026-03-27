import { getDb, initDatabase } from './database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tạo thư mục uploads nếu chưa có
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
['', 'avatars', 'reports', 'proofs'].forEach(sub => {
  const dir = path.join(uploadsDir, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function seed() {
  await initDatabase();
  const db = getDb();

  console.log('🌱 Bắt đầu seed dữ liệu mẫu...\n');

  // ============ SEED USERS ============
  const users = [
    { user_id: uuidv4(), full_name: 'Nguyễn Văn Admin', phone_number: '0901000001', password_hash: bcrypt.hashSync('admin123', 10), role: 'admin' },
    { user_id: uuidv4(), full_name: 'Trần Thị Quản Lý', phone_number: '0901000002', password_hash: bcrypt.hashSync('admin123', 10), role: 'admin' },
    { user_id: uuidv4(), full_name: 'ThangVan', phone_number: '0901000008', password_hash: bcrypt.hashSync('thangvan123', 10), role: 'admin' },
    { user_id: uuidv4(), full_name: 'Lê Văn Kỹ Thuật', phone_number: '0901000003', password_hash: bcrypt.hashSync('staff123', 10), role: 'staff' },
    { user_id: uuidv4(), full_name: 'Phạm Thị Sửa Chữa', phone_number: '0901000004', password_hash: bcrypt.hashSync('staff123', 10), role: 'staff' },
    { user_id: uuidv4(), full_name: 'Hoàng Văn Dân', phone_number: '0901000005', password_hash: bcrypt.hashSync('user123', 10), role: 'citizen' },
    { user_id: uuidv4(), full_name: 'Ngô Thị Dân', phone_number: '0901000006', password_hash: bcrypt.hashSync('user123', 10), role: 'citizen' },
    { user_id: uuidv4(), full_name: 'Vũ Văn Cư Dân', phone_number: '0901000007', password_hash: bcrypt.hashSync('user123', 10), role: 'citizen' },
  ];

  for (const u of users) {
    await db.query(
      `INSERT IGNORE INTO users (user_id, full_name, phone_number, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
      [u.user_id, u.full_name, u.phone_number, u.password_hash, u.role]
    );
  }
  console.log(`✅ Đã tạo ${users.length} users`);

  // ============ SEED CATEGORIES ============
  const categories = [
    { category_id: uuidv4(), name: 'Hạ tầng', description: 'Sự cố liên quan đến cơ sở hạ tầng: đường xá, cầu cống, hố ga, đèn đường, vỉa hè...', priority_level: 1 },
    { category_id: uuidv4(), name: 'Vệ sinh môi trường', description: 'Rác thải tự phát, ô nhiễm nguồn nước, bụi bẩn, mùi hôi...', priority_level: 1 },
    { category_id: uuidv4(), name: 'An ninh trật tự', description: 'Tệ nạn xã hội, trộm cắp, quấy rối, tụ tập gây rối, đua xe...', priority_level: 1 },
    { category_id: uuidv4(), name: 'Y tế', description: 'Dịch bệnh, ổ muỗi, thực phẩm bẩn, cơ sở y tế không đảm bảo...', priority_level: 1 },
    { category_id: uuidv4(), name: 'Cây xanh', description: 'Cây gãy đổ, cây chết, cành cây nguy hiểm, cần trồng thêm cây...', priority_level: 2 },
    { category_id: uuidv4(), name: 'Ngập nước / Lũ lụt', description: 'Các điểm ngập nước, thoát nước kém, lũ lụt...', priority_level: 1 },
    { category_id: uuidv4(), name: 'Giao thông', description: 'Biển báo hỏng, đèn tín hiệu hỏng, kẹt xe, đường hỏng...', priority_level: 2 },
    { category_id: uuidv4(), name: 'Khác', description: 'Các sự cố không thuộc nhóm nào ở trên', priority_level: 3 },
  ];

  for (const c of categories) {
    await db.query(
      `INSERT IGNORE INTO categories (category_id, name, description, priority_level) VALUES (?, ?, ?, ?)`,
      [c.category_id, c.name, c.description, c.priority_level]
    );
  }
  console.log(`✅ Đã tạo ${categories.length} categories`);

  // ============ SEED REPORTS ============
  const reports = [
    // Lưu ý: backend đang dùng enum status: pending, in_progress, completed, cancelled
    { report_id: uuidv4(), title: 'Hố ga mất nắp trên đường Nguyễn Huệ', description: 'Nắp cống bị mất trên vỉa hè đường Nguyễn Huệ, gần ngã tư Lê Lợi. Rất nguy hiểm cho người đi bộ, đặc biệt vào ban đêm.', latitude: 10.7731, longitude: 106.7030, status: 'pending', user_id: users[4].user_id, category_id: categories[0].category_id },
    { report_id: uuidv4(), title: 'Bãi rác tự phát trong hẻm', description: 'Đống rác rất lớn ở cuối hẻm 234 Lê Văn Sỹ. Bốc mùi hôi thối, ruồi muỗi rất nhiều. Đã tồn tại hơn 2 tuần.', latitude: 10.7875, longitude: 106.6791, status: 'in_progress', user_id: users[5].user_id, category_id: categories[1].category_id },
    { report_id: uuidv4(), title: 'Đèn đường hỏng đoạn Trần Hưng Đạo', description: 'Cả đoạn đường dài khoảng 200m trên đường Trần Hưng Đạo bị mất điện đèn đường. Tối đen vào ban đêm, dễ xảy ra tai nạn.', latitude: 10.7580, longitude: 106.6880, status: 'in_progress', user_id: users[6].user_id, category_id: categories[0].category_id },
    { report_id: uuidv4(), title: 'Cây xanh gãy đổ chắn đường', description: 'Cây lớn bị gãy đổ sau trận mưa tối qua, chắn hết lối đi vào hẻm. Cần dọn dẹp gấp.', latitude: 10.7820, longitude: 106.6950, status: 'completed', user_id: users[4].user_id, category_id: categories[4].category_id },
    { report_id: uuidv4(), title: 'Ngập nước nghiêm trọng đường Nguyễn Hữu Cảnh', description: 'Mỗi khi mưa lớn, nước ngập hơn 50cm. Xe máy bị chết máy, ô tô không thể di chuyển.', latitude: 10.7890, longitude: 106.7120, status: 'cancelled', user_id: users[5].user_id, category_id: categories[5].category_id },
  ];

  for (const r of reports) {
    await db.query(
      `INSERT IGNORE INTO reports (report_id, title, description, latitude, longitude, status, user_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.report_id, r.title, r.description, r.latitude, r.longitude, r.status, r.user_id, r.category_id]
    );
  }
  console.log(`✅ Đã tạo ${reports.length} reports`);

  // ============ SEED REPORT_IMAGES ============
  // Chỉ cần URL mẫu để frontend hiển thị; file thật (nếu có) nằm ở folder uploads.
  const reportImages = [
    { image_id: uuidv4(), report_id: reports[1].report_id, image_url: '/uploads/reports/seed-report-2-1.png' },
    { image_id: uuidv4(), report_id: reports[1].report_id, image_url: '/uploads/reports/seed-report-2-2.png' },
    { image_id: uuidv4(), report_id: reports[2].report_id, image_url: '/uploads/reports/seed-report-3-1.png' },
    { image_id: uuidv4(), report_id: reports[3].report_id, image_url: '/uploads/reports/seed-report-4-1.png' },
    { image_id: uuidv4(), report_id: reports[4].report_id, image_url: '/uploads/reports/seed-report-5-1.png' },
  ];

  for (const img of reportImages) {
    await db.query(
      `INSERT IGNORE INTO report_images (image_id, report_id, image_url) VALUES (?, ?, ?)`,
      [img.image_id, img.report_id, img.image_url]
    );
  }
  console.log(`✅ Đã tạo ${reportImages.length} report_images`);

  // ============ SEED REPORT_LOGS ============
  const logs = [
    // Report 2: in_progress (pending -> in_progress)
    { log_id: uuidv4(), report_id: reports[1].report_id, changed_by: users[0].user_id, old_status: 'pending', new_status: 'in_progress', proof_image_url: null },

    // Report 3: in_progress (pending -> in_progress)
    { log_id: uuidv4(), report_id: reports[2].report_id, changed_by: users[2].user_id, old_status: 'pending', new_status: 'in_progress', proof_image_url: null },

    // Report 4: completed (pending -> in_progress -> completed)
    { log_id: uuidv4(), report_id: reports[3].report_id, changed_by: users[3].user_id, old_status: 'pending', new_status: 'in_progress', proof_image_url: null },
    { log_id: uuidv4(), report_id: reports[3].report_id, changed_by: users[0].user_id, old_status: 'in_progress', new_status: 'completed', proof_image_url: null },

    // Report 5: cancelled (pending -> cancelled)
    { log_id: uuidv4(), report_id: reports[4].report_id, changed_by: users[0].user_id, old_status: 'pending', new_status: 'cancelled', proof_image_url: null },
  ];

  for (const l of logs) {
    await db.query(
      `INSERT IGNORE INTO report_logs (log_id, report_id, changed_by, old_status, new_status, proof_image_url) VALUES (?, ?, ?, ?, ?, ?)`,
      [l.log_id, l.report_id, l.changed_by, l.old_status, l.new_status, l.proof_image_url]
    );
  }
  console.log(`✅ Đã tạo ${logs.length} report_logs`);

  console.log('\n🎉 Seed dữ liệu mẫu hoàn thành!');
  console.log('\n📋 Tài khoản đăng nhập mẫu:');
  console.log('  Admin:    0901000001 / admin123');
  console.log('  Admin 2:  0901000002 / admin123');
  console.log('  Admin 3:  0901000008 / thangvan123 (ThangVan)');
  console.log('  Staff:    0901000003 / staff123');
  console.log('  Staff 2:  0901000004 / staff123');
  console.log('  Citizen:  0901000005 / user123');
  console.log('  Citizen:  0901000006 / user123');
  console.log('  Citizen:  0901000007 / user123');

  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed lỗi:', err);
  process.exit(1);
});
