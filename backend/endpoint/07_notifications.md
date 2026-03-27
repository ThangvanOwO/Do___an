# 🔔 7. NOTIFICATIONS - Thông báo

> Base: `/api/notifications`
> Các endpoint trả `{success,message,data}` khi thành công, và `{success:false,message}` khi lỗi.

> Lưu ý: DB `do_anv2` hiện tại chỉ chứa `users/categories/reports/report_images/report_logs` (chưa có bảng `notifications`). Vì vậy gọi các endpoint notifications thực tế có thể trả `500: "Lỗi server."` ở môi trường hiện tại.

---

## #37 - GET `/api/notifications`
> Lấy danh sách thông báo của user đang đăng nhập

**Auth:** 🔒 Bắt buộc (`authenticate`)

**Query Parameters:**
- `page` (mặc định `1`)
- `limit` (mặc định `20`)
- `is_read` (tuỳ chọn, 0/1)

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy danh sách thông báo thành công.",
  "data": {
    "notifications": [
      {
        "notification_id": "uuid-xxxx",
        "title": "...",
        "message": "...",
        "is_read": 0,
        "created_at": "2026-03-02T...",
        "type": "..."
      }
    ],
    "unread_count": 5,
    "pagination": {
      "total": 3,
      "page": 1,
      "limit": 20,
      "total_pages": 1
    }
  }
}
```

### ❌ Thất bại
- `401`: theo middleware authenticate
- `500`: `Lỗi server.`

---

## #38 - GET `/api/notifications/unread-count`
> Đếm số thông báo chưa đọc

**Auth:** 🔒 Bắt buộc

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy số thông báo chưa đọc.",
  "data": { "unread_count": 5 }
}
```

### ❌ Thất bại
- `401`: theo middleware
- `500`: `Lỗi server.`

---

## #39 - PATCH `/api/notifications/:id/read`
> Đánh dấu 1 thông báo đã đọc

**Auth:** 🔒 Bắt buộc

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Đã đánh dấu đã đọc.",
  "data": { "notification_id": "uuid-xxxx", "is_read": 1 }
}
```

### ❌ Thất bại
- `404`: `Không tìm thấy thông báo.`
- `401`: theo middleware
- `500`: `Lỗi server.`

---

## #40 - PATCH `/api/notifications/read-all`
> Đánh dấu tất cả thông báo của user đã đọc

**Auth:** 🔒 Bắt buộc

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Đã đánh dấu X thông báo đã đọc.",
  "data": { "updated_count": 5 }
}
```

### ❌ Thất bại
- `401`: theo middleware
- `500`: `Lỗi server.`

---

## #41 - DELETE `/api/notifications/:id`
> Xóa 1 thông báo (của user đang đăng nhập)

**Auth:** 🔒 Bắt buộc

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Đã xóa thông báo.",
  "data": { "notification_id": "uuid-xxxx" }
}
```

### ❌ Thất bại
- `404`: `Không tìm thấy thông báo.`
- `401`: theo middleware
- `500`: `Lỗi server.`

