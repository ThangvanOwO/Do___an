# 🔔 7. NOTIFICATIONS - Thông báo (5 endpoints)

---

## #37 - GET `/api/notifications`
> Lấy danh sách thông báo của user đang đăng nhập

**Auth:** 🔒 Bắt buộc

**Query Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| page | number | Trang (mặc định: 1) |
| limit | number | Số lượng/trang (mặc định: 20) |
| is_read | 0/1 | Lọc theo đã đọc/chưa đọc |

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy danh sách thông báo thành công.",
  "data": {
    "notifications": [
      {
        "notification_id": "uuid-xxxx",
        "user_id": "uuid-yyyy",
        "title": "Báo cáo đã được xác nhận",
        "message": "Báo cáo \"Ổ gà lớn trên đường Nguyễn Huệ\" đã được xác nhận.",
        "type": "report_status",
        "reference_id": "uuid-zzzz",
        "is_read": 0,
        "created_at": "2026-03-02T..."
      }
    ],
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
| Code | Trường hợp | Response |
|------|-----------|----------|
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #38 - GET `/api/notifications/unread-count`
> Đếm số thông báo chưa đọc

**Auth:** 🔒 Bắt buộc

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy số thông báo chưa đọc thành công.",
  "data": {
    "unread_count": 5
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #39 - PATCH `/api/notifications/:id/read`
> Đánh dấu 1 thông báo đã đọc

**Auth:** 🔒 Bắt buộc (chính chủ)

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Đã đánh dấu đã đọc.",
  "data": {
    "notification_id": "uuid-xxxx",
    "is_read": 1
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 403 | Không phải chính chủ | `{"success": false, "message": "Bạn không có quyền thao tác thông báo này."}` |
| 404 | ID không tồn tại | `{"success": false, "message": "Không tìm thấy thông báo."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #40 - PATCH `/api/notifications/read-all`
> Đánh dấu tất cả thông báo đã đọc

**Auth:** 🔒 Bắt buộc

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Đã đánh dấu tất cả đã đọc.",
  "data": {
    "updated_count": 5
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #41 - DELETE `/api/notifications/:id`
> Xóa 1 thông báo

**Auth:** 🔒 Bắt buộc (chính chủ)

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Đã xóa thông báo.",
  "data": {
    "notification_id": "uuid-xxxx"
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 403 | Không phải chính chủ | `{"success": false, "message": "Bạn không có quyền thao tác thông báo này."}` |
| 404 | ID không tồn tại | `{"success": false, "message": "Không tìm thấy thông báo."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |
