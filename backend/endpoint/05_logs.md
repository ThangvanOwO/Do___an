# 📝 5. LOGS - Nhật ký xử lý

> Base: `/api/logs`
> Các endpoint trả `{success,message,data}` khi thành công, và `{success:false,message}` khi lỗi.

---

## #27 - GET `/api/logs`
> Lấy danh sách nhật ký (lọc + phân trang)

**Auth:** 🔒 Admin/Staff (`authorize('admin','staff')`)

**Query Parameters:**
- `page`, `limit`
- `report_id` (tuỳ chọn)
- `changed_by` (tuỳ chọn)

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
        "changed_by": "uuid-user",
        "old_status": "pending",
        "new_status": "in_progress",
        "proof_image_url": null,
        "updated_at": "2026-03-02T...",

        "changed_by_name": "....",
        "changed_by_role": "staff",
        "report_title": "..."
      }
    ],
    "pagination": { "total": 5, "page": 1, "limit": 20, "total_pages": 1 }
  }
}
```

### ❌ Thất bại
- `401`: theo `authenticate` (không có/invalid token)
- `403`: theo `authorize` (không đủ role admin/staff)
- `500`: `Lỗi server.`

---

## #28 - GET `/api/logs/report/:reportId`
> Lấy lịch sử xử lý của 1 report

**Auth:** Không yêu cầu

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy lịch sử xử lý thành công.",
  "data": {
    "report_id": "uuid-xxxx",
    "report_title": "....",
    "current_status": "pending",
    "logs": [
      {
        "log_id": "uuid-log",
        "report_id": "uuid-xxxx",
        "changed_by": "uuid-user",
        "old_status": "pending",
        "new_status": "in_progress",
        "proof_image_url": null,
        "updated_at": "2026-03-02T...",
        "changed_by_name": "...",
        "changed_by_role": "staff"
      }
    ]
  }
}
```

### ❌ Thất bại
- `404`: `Không tìm thấy báo cáo.`
- `500`: `Lỗi server.`

---

## #29 - POST `/api/logs`
> Tạo nhật ký xử lý mới (và cập nhật `reports.status`)

**Auth:** 🔒 Admin/Staff (`authorize('admin','staff')`)

**Content-Type:** `multipart/form-data`
- `report_id` (string, bắt buộc)
- `new_status` (string, bắt buộc)
- `proof_image` (File, tuỳ chọn)

`new_status` hợp lệ theo backend:
`pending`, `in_progress`, `completed`, `cancelled`

### ✅ Thành công (201)
```json
{
  "success": true,
  "message": "Tạo nhật ký xử lý thành công.",
  "data": {
    "log_id": "uuid-log",
    "report_id": "uuid-report",
    "old_status": "pending",
    "new_status": "in_progress",
    "proof_image_url": null,
    "changed_by": "Full name của người tạo",
    "updated_at": "2026-03-03T..."
  }
}
```

### ❌ Thất bại
- `400` upload lỗi: `err.message`
- `400` thiếu `report_id` hoặc `new_status`:
  - `Vui lòng cung cấp report_id và new_status.`
- `400` sai `new_status`:
  - `Trạng thái không hợp lệ. Các giá trị cho phép: pending, in_progress, completed, cancelled`
- `404` report không tồn tại: `Không tìm thấy báo cáo.`
- `401/403`: theo middleware auth
- `500`: `Lỗi server.`

---

## #30 - GET `/api/logs/:id`
> Lấy chi tiết 1 nhật ký

**Auth:** 🔒 Bắt buộc (`authenticate`)

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy chi tiết nhật ký thành công.",
  "data": {
    "log_id": "uuid-log",
    "report_id": "uuid-report",
    "changed_by": "uuid-user",
    "old_status": "...",
    "new_status": "...",
    "proof_image_url": null,
    "updated_at": "2026-03-02T...",

    "changed_by_name": "...",
    "changed_by_role": "admin|staff|citizen",
    "report_title": "..."
  }
}
```

### ❌ Thất bại
- `401`: theo `authenticate`
- `404`: `Không tìm thấy nhật ký.`
- `500`: `Lỗi server.`

