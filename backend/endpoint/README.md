# 📚 TỔNG HỢP TẤT CẢ API ENDPOINTS

> **Base URL:** `http://localhost:5000/api`  
> **Tổng cộng:** ~40 endpoint đã gắn route (xem từng file; một số dòng trong tài liệu có thể là “đặt tả tương lai”).  
> **Xác thực (Auth):** Gửi header `Authorization: Bearer <token>`

---

## 📁 Mục lục

| # | Nhóm | Số endpoint |
|---|------|-------------|
| 1 | [Auth (Xác thực)](#1-auth-xác-thực) | 4 |
| 2 | [Users (Người dùng)](#2-users-người-dùng) | 5 (+ #9 chưa triển khai) |
| 3 | [Categories (Danh mục)](#3-categories-danh-mục) | 5 |
| 4 | [Reports (Báo cáo sự cố)](#4-reports-báo-cáo-sự-cố) | 11 |
| 5 | [Logs (Nhật ký xử lý)](#5-logs-nhật-ký-xử-lý) | 4 |
| 6 | [Statistics (Thống kê)](#6-statistics-thống-kê) | 6 |
| 7 | [Notifications (Thông báo)](#7-notifications-thông-báo) | 5 |

---

## Quy ước Response chung

### ✅ Thành công
```json
{
  "success": true,
  "message": "Mô tả thành công",
  "data": { ... }
}
```

### ❌ Thất bại
```json
{
  "success": false,
  "message": "Mô tả lỗi cụ thể"
}
```

### Mã HTTP phổ biến
| Code | Ý nghĩa |
|------|---------|
| 200 | Thành công |
| 201 | Tạo mới thành công |
| 400 | Dữ liệu đầu vào không hợp lệ |
| 401 | Chưa đăng nhập / Token hết hạn |
| 403 | Không có quyền truy cập |
| 404 | Không tìm thấy tài nguyên |
| 409 | Xung đột dữ liệu (trùng lặp) |
| 500 | Lỗi server |

---

Xem chi tiết từng nhóm API trong các file riêng biệt.
