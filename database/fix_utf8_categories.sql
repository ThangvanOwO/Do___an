-- Chạy trong MySQL Workbench / CLI nếu tên danh mục đã lưu sai encoding (hiện H??? t??? thay vì Hạ tầng).
-- Sao lưu DB trước khi chạy.

ALTER DATABASE do_anv2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE categories CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE reports CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE report_images CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE report_logs CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Sau đó cập nhật lại tên danh mục (ví dụ) nếu dữ liệu đã hỏng không tự sửa được:
-- UPDATE categories SET name = 'Hạ tầng' WHERE name LIKE '%H%t%ng%' LIMIT 1;
