# 📋 4. REPORTS - Báo cáo sự cố (11 endpoints)

> **CSDL Tham chiếu:** Bảng `reports`, `report_images`, `report_logs`
> 
> **Status hợp lệ:** `pending`, `in_progress`, `completed`, `cancelled`

---

## #16 - GET `/api/reports`
> Lấy danh sách báo cáo (có filter + phân trang)

**Auth:** 🔓 Không bắt buộc

**Query Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| page | number | Trang (mặc định: 1) |
| limit | number | Số lượng/trang (mặc định: 20) |
| status | string | `pending`, `in_progress`, `completed`, `cancelled` |
| category_id | string | Lọc theo danh mục (UUID) |
| user_id | string | Lọc theo người báo cáo (UUID) |
| search | string | Tìm theo tiêu đề hoặc mô tả |
| sort_by | string | `created_at`, `status` (mặc định: `created_at`) |
| sort_order | string | `ASC`, `DESC` (mặc định: `DESC`) |
| lat | number | Vĩ độ trung tâm (dùng kèm lng, radius) |
| lng | number | Kinh độ trung tâm |
| radius | number | Bán kính tìm kiếm (km) |

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy danh sách báo cáo thành công.",
  "data": [
    {
      "report_id": "uuid-xxxx",
      "title": "Ổ gà lớn trên đường Nguyễn Huệ",
      "description": "Ổ gà sâu khoảng 30cm...",
      "latitude": 10.7731,
      "longitude": 106.7030,
      "status": "pending",
      "created_at": "2026-03-02T...",
      "updated_at": "2026-03-02T...",
      "user_id": "uuid-user",
      "category_id": "uuid-category",
      "reporter_name": "Trần Thị Bình",
      "reporter_phone": "0901234567",
      "reporter_avatar": null,
      "category_name": "Hạ tầng",
      "priority_level": 1,
      "images": [
        {
          "image_id": "uuid-img",
          "report_id": "uuid-xxxx",
          "image_url": "/uploads/reports/xxx.jpg",
          "created_at": "2026-03-02T..."
        }
      ]
    }
  ]
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #17 - GET `/api/reports/my-reports`
> Lấy danh sách báo cáo của chính mình

**Auth:** 🔒 Bắt buộc

**Query Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| page | number | Trang (mặc định: 1) |
| limit | number | Số lượng/trang (mặc định: 20) |
| status | string | Lọc theo trạng thái |

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy danh sách báo cáo của bạn thành công.",
  "data": {
    "reports": [
      {
        "report_id": "uuid-xxxx",
        "title": "Ổ gà lớn trên đường Nguyễn Huệ",
        "description": "...",
        "latitude": 10.7731,
        "longitude": 106.7030,
        "status": "pending",
        "created_at": "2026-03-02T...",
        "updated_at": "2026-03-02T...",
        "category_name": "Hạ tầng",
        "images": [...]
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

---

## #18 - GET `/api/reports/nearby`
> Lấy danh sách báo cáo gần vị trí hiện tại

**Auth:** 🔓 Không bắt buộc

**Query Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| lat | number | **Bắt buộc** - Vĩ độ |
| lng | number | **Bắt buộc** - Kinh độ |
| radius | number | Bán kính (km), mặc định: 5 |

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Tìm thấy 12 báo cáo trong bán kính 5km.",
  "data": [
    {
      "report_id": "uuid-xxxx",
      "title": "Ổ gà lớn",
      "latitude": 10.7731,
      "longitude": 106.7030,
      "status": "pending",
      "created_at": "...",
      "reporter_name": "Nguyễn Văn A",
      "category_name": "Hạ tầng",
      "distance_km": 0.5
    }
  ]
}
```

---

## #19 - GET `/api/reports/map-data`
> Lấy dữ liệu tối giản cho bản đồ (tọa độ + status)

**Auth:** 🔓 Không bắt buộc

**Query Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| status | string | Lọc theo trạng thái |
| category_id | string | Lọc theo danh mục |

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy 45 điểm trên bản đồ.",
  "data": [
    {
      "report_id": "uuid-xxxx",
      "title": "Ổ gà lớn",
      "description": "Mô tả ngắn...",
      "latitude": 10.7731,
      "longitude": 106.7030,
      "status": "pending",
      "created_at": "...",
      "category_name": "Hạ tầng",
      "priority_level": 1,
      "image_url": "/uploads/reports/xxx.jpg"
    }
  ]
}
```

---

## #20 - GET `/api/reports/:id`
> Lấy chi tiết một báo cáo

**Auth:** 🔓 Không bắt buộc

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy chi tiết báo cáo thành công.",
  "data": {
    "report_id": "uuid-xxxx",
    "title": "Ổ gà lớn trên đường Nguyễn Huệ",
    "description": "Ổ gà sâu khoảng 30cm, rất nguy hiểm cho xe máy.",
    "latitude": 10.7731,
    "longitude": 106.7030,
    "status": "in_progress",
    "created_at": "2026-03-02T08:30:00Z",
    "updated_at": "2026-03-02T10:15:00Z",
    "user_id": "uuid-user",
    "category_id": "uuid-cat",
    "reporter_name": "Trần Thị Bình",
    "reporter_phone": "0901234567",
    "reporter_avatar": null,
    "category_name": "Hạ tầng",
    "priority_level": 1,
    "category_description": "Các sự cố liên quan đến cơ sở hạ tầng...",
    "images": [
      {
        "image_id": "uuid-img-1",
        "report_id": "uuid-xxxx",
        "image_url": "/uploads/reports/report-xxx-1.jpg",
        "created_at": "..."
      }
    ],
    "logs": [
      {
        "log_id": "uuid-log",
        "report_id": "uuid-xxxx",
        "changed_by": "uuid-staff",
        "old_status": "pending",
        "new_status": "in_progress",
        "proof_image_url": null,
        "updated_at": "2026-03-02T10:15:00Z",
        "changed_by_name": "Lê Văn Công",
        "changed_by_role": "staff"
      }
    ]
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 404 | Không tìm thấy | `{"success": false, "message": "Không tìm thấy báo cáo."}` |

---

## #21 - POST `/api/reports`
> Tạo báo cáo sự cố mới

**Auth:** 🔒 Bắt buộc

**Content-Type:** `multipart/form-data`

**Body:**
| Field | Type | Mô tả |
|-------|------|-------|
| title | string | **Bắt buộc** - Tiêu đề sự cố |
| description | string | **Bắt buộc** - Mô tả chi tiết |
| latitude | number | **Bắt buộc** - Vĩ độ GPS |
| longitude | number | **Bắt buộc** - Kinh độ GPS |
| category_id | string | **Bắt buộc** - UUID danh mục |
| images | File[] | Tùy chọn - Tối đa 5 ảnh (jpg, png, webp) |

### ✅ Thành công (201)
```json
{
  "success": true,
  "message": "Tạo báo cáo sự cố thành công! Chúng tôi sẽ xử lý sớm nhất.",
  "data": {
    "report_id": "uuid-xxxx",
    "title": "Đèn giao thông hỏng",
    "description": "...",
    "latitude": 10.7731,
    "longitude": 106.7030,
    "status": "pending",
    "created_at": "...",
    "user_id": "uuid-user",
    "category_id": "uuid-cat",
    "category_name": "Hạ tầng",
    "images": [
      {
        "image_id": "uuid-img",
        "image_url": "/uploads/reports/xxx.jpg"
      }
    ]
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 400 | Thiếu trường | `{"success": false, "message": "Vui lòng điền đầy đủ: title, description, latitude, longitude, category_id"}` |
| 400 | Danh mục không tồn tại | `{"success": false, "message": "Danh mục không hợp lệ."}` |
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có token xác thực."}` |

---

## #22 - PUT `/api/reports/:id`
> Cập nhật báo cáo (chỉ chủ sở hữu hoặc admin)

**Auth:** 🔒 Bắt buộc

**Body:**
| Field | Type | Mô tả |
|-------|------|-------|
| title | string | Tiêu đề mới |
| description | string | Mô tả mới |
| latitude | number | Vĩ độ mới |
| longitude | number | Kinh độ mới |
| category_id | string | Danh mục mới |

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Cập nhật báo cáo thành công.",
  "data": {
    "report_id": "uuid-xxxx",
    "title": "Tiêu đề đã sửa",
    "..."
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 403 | Không có quyền | `{"success": false, "message": "Bạn không có quyền chỉnh sửa báo cáo này."}` |
| 400 | Đã hoàn thành | `{"success": false, "message": "Không thể chỉnh sửa báo cáo đã hoàn thành."}` |
| 404 | Không tìm thấy | `{"success": false, "message": "Không tìm thấy báo cáo."}` |

---

## #23 - PATCH `/api/reports/:id/status`
> Cập nhật trạng thái báo cáo (admin/staff only)

**Auth:** 🔒 Bắt buộc (role: `admin` hoặc `staff`)

**Body:**
| Field | Type | Mô tả |
|-------|------|-------|
| new_status | string | **Bắt buộc** - `pending`, `in_progress`, `completed`, `cancelled` |

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Cập nhật trạng thái thành công: Chờ tiếp nhận → Đang xử lý",
  "data": {
    "report_id": "uuid-xxxx",
    "old_status": "pending",
    "new_status": "in_progress",
    "log_id": "uuid-log"
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 400 | Thiếu status | `{"success": false, "message": "Vui lòng cung cấp trạng thái mới (new_status)."}` |
| 400 | Status không hợp lệ | `{"success": false, "message": "Trạng thái không hợp lệ..."}` |
| 403 | Không có quyền | `{"success": false, "message": "Bạn không có quyền thực hiện hành động này."}` |

---

## #24 - GET `/api/reports/:id/logs`
> Lấy lịch sử thay đổi trạng thái

**Auth:** 🔓 Không bắt buộc

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy lịch sử cập nhật thành công.",
  "data": [
    {
      "log_id": "uuid-log",
      "report_id": "uuid-xxxx",
      "changed_by": "uuid-staff",
      "old_status": "pending",
      "new_status": "in_progress",
      "proof_image_url": null,
      "updated_at": "2026-03-02T10:15:00Z",
      "changed_by_name": "Lê Văn Công",
      "changed_by_role": "staff"
    }
  ]
}
```

---

## #25 - POST `/api/reports/:id/images`
> Thêm ảnh cho báo cáo

**Auth:** 🔒 Bắt buộc (chủ sở hữu hoặc admin)

**Content-Type:** `multipart/form-data`

**Body:**
| Field | Type | Mô tả |
|-------|------|-------|
| images | File[] | **Bắt buộc** - Ảnh cần thêm |

### ✅ Thành công (201)
```json
{
  "success": true,
  "message": "Đã upload 2 ảnh thành công.",
  "data": [
    {
      "image_id": "uuid-img",
      "image_url": "/uploads/reports/xxx.jpg"
    }
  ]
}
```

---

## #26 - DELETE `/api/reports/:id`
> Xóa báo cáo (chủ sở hữu hoặc admin)

**Auth:** 🔒 Bắt buộc

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Đã xóa báo cáo thành công.",
  "data": {
    "report_id": "uuid-xxxx"
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 403 | Không có quyền | `{"success": false, "message": "Bạn không có quyền xóa báo cáo này."}` |
| 404 | Không tìm thấy | `{"success": false, "message": "Không tìm thấy báo cáo."}` |

---

## 📌 Mapping Status

| Giá trị CSDL | Hiển thị UI | Màu sắc |
|--------------|-------------|---------|
| `pending` | Chờ tiếp nhận | `#f59e0b` (Vàng) |
| `in_progress` | Đang xử lý | `#3b82f6` (Xanh dương) |
| `completed` | Đã hoàn thành | `#10b981` (Xanh lá) |
| `cancelled` | Đã hủy | `#ef4444` (Đỏ) |

---

## 📌 Cấu trúc bảng CSDL

### `reports`
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| report_id | VARCHAR(36) | NO | PK, UUID |
| title | VARCHAR(500) | NO | Tiêu đề |
| description | TEXT | NO | Mô tả |
| latitude | DOUBLE | NO | Vĩ độ GPS |
| longitude | DOUBLE | NO | Kinh độ GPS |
| status | ENUM | NO | pending/in_progress/completed/cancelled |
| created_at | TIMESTAMP | YES | Thời gian tạo |
| updated_at | TIMESTAMP | YES | Thời gian cập nhật |
| user_id | VARCHAR(36) | NO | FK → users |
| category_id | VARCHAR(36) | NO | FK → categories |

### `report_images`
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| image_id | VARCHAR(36) | NO | PK, UUID |
| report_id | VARCHAR(36) | NO | FK → reports |
| image_url | VARCHAR(500) | NO | Đường dẫn ảnh |
| created_at | TIMESTAMP | YES | Thời gian upload |

### `report_logs`
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| log_id | VARCHAR(36) | NO | PK, UUID |
| report_id | VARCHAR(36) | NO | FK → reports |
| changed_by | VARCHAR(36) | NO | FK → users |
| old_status | VARCHAR(50) | YES | Trạng thái cũ |
| new_status | VARCHAR(50) | NO | Trạng thái mới |
| proof_image_url | VARCHAR(500) | YES | Ảnh minh chứng |
| updated_at | TIMESTAMP | YES | Thời gian |
