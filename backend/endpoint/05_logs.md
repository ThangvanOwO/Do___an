# 📝 5. LOGS - Nhật ký xử lý (4 endpoints)

---

## #27 - GET `/api/logs`
> Lấy danh sách tất cả nhật ký xử lý

**Auth:** 🔒 Admin / Staff

**Query Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| page | number | Trang (mặc định: 1) |
| limit | number | Số lượng/trang (mặc định: 20) |
| handler_id | string | Lọc theo người xử lý |

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy danh sách nhật ký thành công.",
  "data": {
    "logs": [
      {
        "log_id": "uuid-xxxx",
        "report_id": "uuid-xxxx",
        "handler_id": "uuid-xxxx",
        "action": "Xác nhận sự cố",
        "note": "Đã xác minh tại hiện trường",
        "old_status": "pending",
        "new_status": "confirmed",
        "proof_image_url": null,
        "created_at": "2026-03-02T...",
        "handler_name": "Phạm Văn Cường",
        "report_title": "Ổ gà lớn trên đường Nguyễn Huệ"
      }
    ],
    "pagination": {
      "total": 5,
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
| 403 | Không phải admin/staff | `{"success": false, "message": "Bạn không có quyền thực hiện hành động này."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #28 - GET `/api/logs/report/:reportId`
> Lấy nhật ký xử lý của 1 báo cáo cụ thể

**Auth:** 🔒 Bắt buộc

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy nhật ký xử lý thành công.",
  "data": [
    {
      "log_id": "uuid-xxxx",
      "report_id": "uuid-xxxx",
      "handler_id": "uuid-xxxx",
      "action": "Xác nhận sự cố",
      "note": "Đã xác minh tại hiện trường",
      "old_status": "pending",
      "new_status": "confirmed",
      "proof_image_url": null,
      "created_at": "2026-03-02T...",
      "handler_name": "Phạm Văn Cường"
    },
    {
      "log_id": "uuid-yyyy",
      "report_id": "uuid-xxxx",
      "handler_id": "uuid-zzzz",
      "action": "Bắt đầu xử lý",
      "note": "Đã liên hệ đơn vị sửa chữa",
      "old_status": "confirmed",
      "new_status": "in_progress",
      "proof_image_url": "/uploads/proofs/proof-xxxxx.jpg",
      "created_at": "2026-03-02T...",
      "handler_name": "Lê Văn Dũng"
    }
  ]
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #29 - POST `/api/logs`
> Tạo nhật ký xử lý mới

**Auth:** 🔒 Admin / Staff

**Body:** `multipart/form-data`
| Field | Type | Bắt buộc | Mô tả |
|-------|------|----------|-------|
| report_id | string | ✅ | ID báo cáo |
| action | string | ✅ | Hành động (VD: "Xác nhận sự cố") |
| note | string | ❌ | Ghi chú |
| old_status | string | ❌ | Trạng thái trước |
| new_status | string | ❌ | Trạng thái sau |
| proof_image | File | ❌ | Ảnh minh chứng (jpg/png/gif, max 5MB) |

### ✅ Thành công (201)
```json
{
  "success": true,
  "message": "Tạo nhật ký xử lý thành công.",
  "data": {
    "log_id": "uuid-xxxx",
    "report_id": "uuid-yyyy",
    "handler_id": "uuid-zzzz",
    "action": "Xác nhận sự cố",
    "note": "Đã xác minh tại hiện trường",
    "old_status": "pending",
    "new_status": "confirmed",
    "proof_image_url": "/uploads/proofs/proof-xxxxx.jpg",
    "created_at": "2026-03-03T..."
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 400 | Thiếu report_id | `{"success": false, "message": "report_id là bắt buộc."}` |
| 400 | Thiếu action | `{"success": false, "message": "Hành động (action) là bắt buộc."}` |
| 400 | report_id không tồn tại | `{"success": false, "message": "Không tìm thấy báo cáo."}` |
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 403 | Không phải admin/staff | `{"success": false, "message": "Bạn không có quyền thực hiện hành động này."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #30 - GET `/api/logs/:id`
> Xem chi tiết 1 nhật ký xử lý

**Auth:** 🔒 Bắt buộc

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy thông tin nhật ký thành công.",
  "data": {
    "log_id": "uuid-xxxx",
    "report_id": "uuid-yyyy",
    "handler_id": "uuid-zzzz",
    "action": "Xác nhận sự cố",
    "note": "Đã xác minh tại hiện trường",
    "old_status": "pending",
    "new_status": "confirmed",
    "proof_image_url": "/uploads/proofs/proof-xxxxx.jpg",
    "created_at": "2026-03-02T...",
    "handler_name": "Phạm Văn Cường",
    "report_title": "Ổ gà lớn trên đường Nguyễn Huệ"
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 404 | ID không tồn tại | `{"success": false, "message": "Không tìm thấy nhật ký."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |
