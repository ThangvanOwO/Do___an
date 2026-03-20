-- ============================================================
-- CSDL HỆ THỐNG QUẢN LÝ SỰ CỐ ĐÔ THỊ
-- Phiên bản: 1.0 (Đã dọn dẹp theo đặc tả 3.2.2)
-- Ngày tạo: 2026-03-19
-- ============================================================

-- Xóa database cũ nếu tồn tại và tạo mới
DROP DATABASE IF EXISTS do_anv2;
CREATE DATABASE do_anv2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE do_anv2;

-- ============================================================
-- 1. BẢNG USERS (Người dùng)
-- Mục đích: Quản lý thông tin định danh và phân quyền truy cập hệ thống
-- ============================================================
CREATE TABLE users (
    user_id VARCHAR(36) PRIMARY KEY COMMENT 'Mã định danh duy nhất của người dùng (UUID)',
    full_name VARCHAR(255) NOT NULL COMMENT 'Họ và tên hiển thị đầy đủ',
    phone_number VARCHAR(20) NOT NULL UNIQUE COMMENT 'Số điện thoại đăng ký (dùng để xác thực)',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Mật khẩu đăng nhập (đã được mã hóa)',
    role ENUM('citizen', 'admin', 'staff') NOT NULL DEFAULT 'citizen' COMMENT 'Phan quyen: citizen=Nguoi dan, admin=Quan ly, staff=Nhan vien sua chua',
    avatar_url VARCHAR(500) NULL COMMENT 'Đường dẫn đến hình ảnh đại diện',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo tài khoản',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật gần nhất',
    
    INDEX idx_users_phone (phone_number),
    INDEX idx_users_role (role)
) ENGINE=InnoDB COMMENT='Bảng người dùng hệ thống';

-- ============================================================
-- 2. BẢNG CATEGORIES (Danh mục sự cố)
-- Mục đích: Lưu trữ các loại sự cố để phân loại báo cáo
-- ============================================================
CREATE TABLE categories (
    category_id VARCHAR(36) PRIMARY KEY COMMENT 'Mã định danh duy nhất của nhóm sự cố (UUID)',
    name VARCHAR(255) NOT NULL COMMENT 'Tên loại sự cố (Ví dụ: Hạ tầng, Vệ sinh, Y tế, Lũ lụt)',
    description TEXT NULL COMMENT 'Văn bản hướng dẫn chi tiết giúp người dân hiểu và lựa chọn đúng danh mục',
    priority_level TINYINT NOT NULL DEFAULT 2 COMMENT 'Mức độ ưu tiên mặc định (1: Cao, 2: Trung bình, 3: Thấp)',
    is_active TINYINT(1) DEFAULT 1 COMMENT 'Trạng thái hoạt động của danh mục',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo danh mục',
    
    INDEX idx_categories_priority (priority_level),
    INDEX idx_categories_active (is_active)
) ENGINE=InnoDB COMMENT='Bảng danh mục sự cố';

-- ============================================================
-- 3. BẢNG REPORTS (Báo cáo sự cố)
-- Mục đích: Lưu trữ toàn bộ dữ liệu nghiệp vụ về các sự cố phát sinh thực tế
-- Lưu ý: Đã bỏ cột image_url, sử dụng bảng report_images để lưu nhiều ảnh
-- ============================================================
CREATE TABLE reports (
    report_id VARCHAR(36) PRIMARY KEY COMMENT 'Mã định danh duy nhất của hồ sơ sự cố (UUID)',
    title VARCHAR(500) NOT NULL COMMENT 'Tiêu đề ngắn gọn tóm tắt sự cố',
    description TEXT NOT NULL COMMENT 'Nội dung chi tiết mô tả hiện trạng, nguyên nhân và các thông tin bổ sung',
    latitude DOUBLE NOT NULL COMMENT 'Tọa độ Vĩ độ (Latitude) lấy từ GPS',
    longitude DOUBLE NOT NULL COMMENT 'Tọa độ Kinh độ (Longitude) lấy từ GPS',
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT 'Trang thai: pending=Cho tiep nhan, in_progress=Dang xu ly, completed=Da hoan thanh, cancelled=Da huy',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian chính xác khi báo cáo được gửi lên hệ thống',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật gần nhất',
    
    -- Khóa ngoại
    user_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại tham chiếu đến user_id của bảng Users',
    category_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại tham chiếu đến category_id của bảng Categories',
    
    -- Ràng buộc khóa ngoại
    CONSTRAINT fk_reports_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_reports_category 
        FOREIGN KEY (category_id) REFERENCES categories(category_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Index
    INDEX idx_reports_status (status),
    INDEX idx_reports_user (user_id),
    INDEX idx_reports_category (category_id),
    INDEX idx_reports_created (created_at),
    INDEX idx_reports_location (latitude, longitude)
) ENGINE=InnoDB COMMENT='Bảng báo cáo sự cố';

-- ============================================================
-- 4. BẢNG REPORT_IMAGES (Hình ảnh báo cáo)
-- Mục đích: Lưu trữ NHIỀU ẢNH cho một báo cáo sự cố
-- ============================================================
CREATE TABLE report_images (
    image_id VARCHAR(36) PRIMARY KEY COMMENT 'Mã định danh duy nhất của hình ảnh (UUID)',
    report_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại tham chiếu đến report_id của bảng Reports',
    image_url VARCHAR(500) NOT NULL COMMENT 'Đường dẫn ảnh chụp thực tế tại hiện trường',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm upload hình ảnh',
    
    -- Ràng buộc khóa ngoại
    CONSTRAINT fk_report_images_report 
        FOREIGN KEY (report_id) REFERENCES reports(report_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Index
    INDEX idx_report_images_report (report_id)
) ENGINE=InnoDB COMMENT='Bảng hình ảnh của báo cáo sự cố';

-- ============================================================
-- 5. BẢNG REPORT_LOGS (Tiến độ xử lý)
-- Mục đích: Ghi lại lịch sử thay đổi trạng thái, đảm bảo tính minh bạch và truy vết trách nhiệm
-- ============================================================
CREATE TABLE report_logs (
    log_id VARCHAR(36) PRIMARY KEY COMMENT 'Mã định danh duy nhất cho mỗi dòng nhật ký hoạt động (UUID)',
    report_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại tham chiếu đến report_id của bảng Reports',
    changed_by VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại tham chiếu đến user_id của bảng Users (Người sửa)',
    old_status VARCHAR(50) NULL COMMENT 'Ghi nhận trạng thái của sự cố trước thời điểm cập nhật',
    new_status VARCHAR(50) NOT NULL COMMENT 'Ghi nhận trạng thái mới của sự cố sau khi cập nhật',
    proof_image_url VARCHAR(500) NULL COMMENT 'Đường dẫn ảnh minh chứng kết quả xử lý',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thực hiện cập nhật',
    
    -- Ràng buộc khóa ngoại
    CONSTRAINT fk_report_logs_report 
        FOREIGN KEY (report_id) REFERENCES reports(report_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_report_logs_user 
        FOREIGN KEY (changed_by) REFERENCES users(user_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Index
    INDEX idx_report_logs_report (report_id),
    INDEX idx_report_logs_changed_by (changed_by),
    INDEX idx_report_logs_updated (updated_at)
) ENGINE=InnoDB COMMENT='Bảng nhật ký tiến độ xử lý sự cố';

-- ============================================================
-- DỮ LIỆU MẪU CHO CATEGORIES
-- ============================================================
INSERT INTO categories (category_id, name, description, priority_level) VALUES
    (UUID(), 'Hạ tầng', 'Các sự cố liên quan đến cơ sở hạ tầng như đường xá, cầu cống, hệ thống thoát nước, điện chiếu sáng', 1),
    (UUID(), 'Vệ sinh', 'Các sự cố về vệ sinh môi trường như rác thải, ô nhiễm, mùi hôi', 2),
    (UUID(), 'Y tế', 'Các sự cố liên quan đến y tế cộng đồng, dịch bệnh', 1),
    (UUID(), 'Lũ lụt', 'Các sự cố về ngập úng, lũ lụt, thiên tai', 1),
    (UUID(), 'An ninh', 'Các sự cố về an ninh trật tự, an toàn công cộng', 2),
    (UUID(), 'Khác', 'Các sự cố khác không thuộc danh mục trên', 3);

-- ============================================================
-- TỔNG KẾT CẤU TRÚC DATABASE
-- ============================================================
-- 1. users          - Bảng người dùng (không có FK)
-- 2. categories     - Bảng danh mục sự cố (không có FK)
-- 3. reports        - Bảng báo cáo (FK: user_id -> users, category_id -> categories)
-- 4. report_images  - Bảng hình ảnh (FK: report_id -> reports)
-- 5. report_logs    - Bảng nhật ký (FK: report_id -> reports, changed_by -> users)
-- ============================================================
