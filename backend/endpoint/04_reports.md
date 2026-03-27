# 📋 4. REPORTS - Báo cáo sự cố

> Base: `/api/reports`
> CSDL tham chiếu: `reports`, `report_images`, `report_logs`
>
> `reports.status` hợp lệ: `pending`, `in_progress`, `completed`, `cancelled`

---

## #16 - GET `/api/reports`
> Lấy danh sách báo cáo (có filter)

**Auth:** Không yêu cầu

**Query Parameters (tuỳ chọn):**
- `page`, `limit`
- `status`
- `category_id`
- `user_id`
- `search` (tìm `title` hoặc `description`)
- `sort_by` (`created_at|status`), `sort_order` (`ASC|DESC`)
- `lat`, `lng`, `radius` (km) để lọc bán kính

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy danh sách báo cáo thành công.",
  "data": [
    {
      "report_id": "uuid-xxxx",
      "title": "...",
      "description": "...",
      "latitude": 10.77,
      "longitude": 106.70,
      "status": "pending",
      "created_at": "2026-03-02T...",
      "updated_at": "2026-03-02T...",
      "user_id": "uuid-user",
      "category_id": "uuid-cat",

      "reporter_name": "...",
      "reporter_phone": "...",
      "reporter_avatar": null,
      "category_name": "...",
      "priority_level": 1,

      "images": [
        {
          "image_id": "uuid-img",
          "report_id": "uuid-xxxx",
          "image_url": "/uploads/reports/....",
          "created_at": "2026-03-02T..."
        }
      ]
    }
  ]
}
```

### ❌ Thất bại
- `500`: `Lỗi server.`

---

## #17 - GET `/api/reports/my-reports`
> Lấy danh sách báo cáo của chính user đang đăng nhập

**Auth:** 🔒 Bắt buộc (`authenticate`)

**Query Parameters (tuỳ chọn):**
- `page`, `limit`
- `status`

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy danh sách báo cáo của bạn thành công.",
  "data": {
    "reports": [
      {
        "report_id": "uuid-xxxx",
        "title": "...",
        "description": "...",
        "latitude": 10.77,
        "longitude": 106.70,
        "status": "pending",
        "created_at": "2026-03-02T...",
        "updated_at": "2026-03-02T...",
        "category_name": "...",
        "images": [ { "image_id": "...", "image_url": "...", "created_at": "..." } ]
      }
    ],
    "pagination": { "total": 5, "page": 1, "limit": 20, "total_pages": 1 }
  }
}
```

### ❌ Thất bại
- `500`: `Lỗi server.`
- `401`: theo middleware `authenticate`

---

## #18 - GET `/api/reports/nearby`
> Lấy danh sách báo cáo gần vị trí hiện tại (lọc bán kính)

**Auth:** Không bắt buộc

**Query Parameters:**
- `lat`, `lng` (Bắt buộc)
- `radius` (km, mặc định `5`)

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Tìm thấy X báo cáo trong bán kính Ykm.",
  "data": [
    {
      "report_id": "uuid-xxxx",
      "title": "...",
      "latitude": 10.77,
      "longitude": 106.70,
      "status": "pending",
      "reporter_name": "...",
      "category_name": "...",
      "distance_km": 0.5
    }
  ]
}
```

### ❌ Thất bại
- `400`: `Vui lòng cung cấp tọa độ (lat, lng).`
- `500`: `Lỗi server.`

---

## #19 - GET `/api/reports/map-data`
> Dữ liệu “tối giản” cho marker map

**Auth:** Không bắt buộc

**Query Parameters (tuỳ chọn):**
- `status`
- `category_id`

> Mặc định loại `cancelled`.

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy N điểm trên bản đồ.",
  "data": [
    {
      "report_id": "uuid-xxxx",
      "title": "...",
      "description": "...",
      "latitude": 10.77,
      "longitude": 106.70,
      "status": "pending",
      "created_at": "2026-03-02T...",
      "category_name": "...",
      "priority_level": 1,
      "image_url": "/uploads/reports/...."
    }
  ]
}
```

### ❌ Thất bại
- `500`: `Lỗi server.`

---

## #20 - GET `/api/reports/:id`
> Lấy chi tiết 1 báo cáo (kèm ảnh + lịch sử status)

**Auth:** Không bắt buộc

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy chi tiết báo cáo thành công.",
  "data": {
    "report_id": "uuid-xxxx",
    "title": "...",
    "description": "...",
    "latitude": 10.77,
    "longitude": 106.70,
    "status": "pending",
    "created_at": "...",
    "updated_at": "...",
    "category_name": "...",
    "priority_level": 1,
    "category_description": "...",
    "reporter_name": "...",
    "reporter_phone": "...",
    "reporter_avatar": null,

    "images": [
      { "image_id": "...", "image_url": "...", "created_at": "..." }
    ],
    "logs": [
      {
        "log_id": "...",
        "report_id": "...",
        "changed_by": "...",
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

## #21 - POST `/api/reports`
> Tạo báo cáo mới

**Auth:** 🔒 Bắt buộc (`authenticate`)

**Content-Type:** `multipart/form-data`

**Required fields (body):**
- `title`, `description`, `latitude`, `longitude`, `category_id`
**Optional:** `images` (upload nhiều ảnh trường `images`, tối đa 5)

### ✅ Thành công (201)
```json
{
  "success": true,
  "message": "Tạo báo cáo sự cố thành công! Chúng tôi sẽ xử lý sớm nhất.",
  "data": {
    "...": "...",
    "images": [
      { "image_id": "...", "image_url": "...", "created_at": "..." }
    ]
  }
}
```

### ❌ Thất bại
- `400` thiếu field: `Vui lòng điền đầy đủ: title, description, latitude, longitude, category_id`
- `400` danh mục không hợp lệ: `Danh mục không hợp lệ.`
- `400` lỗi upload ảnh: `err.message` (do multer)
- `401`: theo middleware authenticate
- `500`: `Lỗi server khi tạo báo cáo.`

---

## #22 - PUT `/api/reports/:id`
> Cập nhật báo cáo (chỉ chủ sở hữu hoặc admin)

**Auth:** 🔒 Bắt buộc

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Cập nhật báo cáo thành công.",
  "data": {
    "...": "...",
    "category_name": "..."
  }
}
```

### ❌ Thất bại
- `404`: `Không tìm thấy báo cáo.`
- `403`: `Bạn không có quyền chỉnh sửa báo cáo này.`
- `400`: nếu `status === completed` và không phải admin: `Không thể chỉnh sửa báo cáo đã hoàn thành.`
- `500`: `Lỗi server.`

---

## #23 - PATCH `/api/reports/:id/status`
> Cập nhật trạng thái (admin/staff)

**Auth:** 🔒 Bắt buộc (`authorize('admin','staff')`)

**Body (JSON):**
```json
{ "new_status": "pending|in_progress|completed|cancelled" }
```

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Cập nhật trạng thái thành công: ... → ...",
  "data": {
    "report_id": "uuid-xxxx",
    "old_status": "pending",
    "new_status": "in_progress",
    "log_id": "uuid-log"
  }
}
```

### ❌ Thất bại
- `400` thiếu `new_status`: `Vui lòng cung cấp trạng thái mới (new_status).`
- `400` sai enum: `Trạng thái không hợp lệ. Các giá trị cho phép: pending, in_progress, completed, cancelled`
- `404`: `Không tìm thấy báo cáo.`
- `500`: `Lỗi server.`

---

## #25 - POST `/api/reports/:id/images`
> Upload thêm ảnh cho báo cáo

**Auth:** 🔒 Bắt buộc (chủ sở hữu hoặc admin)

**Body:** `multipart/form-data` (field `images`)

### ✅ Thành công (201)
```json
{
  "success": true,
  "message": "Đã upload X ảnh thành công.",
  "data": [
    { "image_id": "uuid-xxxx", "image_url": "/uploads/reports/..." }
  ]
}
```

### ❌ Thất bại
- `404`: `Không tìm thấy báo cáo.`
- `403`: `Bạn không có quyền thêm ảnh cho báo cáo này.`
- `400`: `Vui lòng chọn ít nhất 1 ảnh.` hoặc `err.message` (lỗi upload)
- `500`: `Lỗi server.`

---

## #26 - DELETE `/api/reports/:id`
> Xóa báo cáo (chủ sở hữu hoặc admin)

**Auth:** 🔒 Bắt buộc

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Đã xóa báo cáo thành công.",
  "data": { "report_id": "uuid-xxxx" }
}
```

### ❌ Thất bại
- `404`: `Không tìm thấy báo cáo.`
- `403`: `Bạn không có quyền xóa báo cáo này.`
- `500`: `Lỗi server.`

---

## Ghi chú về lịch sử trạng thái
- Trong endpoint `GET /api/reports/:id` ( #20 ) backend đã trả sẵn `logs`.
- Ngoài ra còn có endpoint riêng trong nhóm Logs:
  - `GET /api/logs/report/:reportId`

