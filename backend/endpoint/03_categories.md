# 📂 3. CATEGORIES - Danh mục sự cố

> Base: `/api/categories`
> Các endpoint trả `{ success, message, data }` (hoặc `{ success:false, message }` khi lỗi)

---

## #11 - GET `/api/categories`
> Lấy danh sách tất cả danh mục (kèm `total_reports`)

**Auth:** Không yêu cầu

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy danh sách danh mục thành công.",
  "data": [
    {
      "category_id": "uuid-xxxx",
      "name": "Hạ tầng",
      "description": "...",
      "priority_level": 1,
      "is_active": 1,
      "created_at": "2026-03-02T...",
      "total_reports": 2
    }
  ]
}
```

### ❌ Thất bại
- `500`: `Lỗi server.`

---

## #12 - GET `/api/categories/:id`
> Lấy chi tiết danh mục kèm `total_reports`

**Auth:** Không yêu cầu

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy thông tin danh mục thành công.",
  "data": {
    "category_id": "uuid-xxxx",
    "name": "Hạ tầng",
    "description": "...",
    "priority_level": 1,
    "is_active": 1,
    "created_at": "2026-03-02T...",
    "total_reports": 2
  }
}
```

### ❌ Thất bại
- `404`: `Không tìm thấy danh mục.`
- `500`: `Lỗi server.`

---

## #13 - POST `/api/categories`
> Tạo danh mục mới

**Auth:** 🔒 Admin only (`authenticate + authorize('admin')`)

**Body (JSON):**
```json
{
  "name": "Tiếng ồn",
  "description": "Ô nhiễm tiếng ồn...",
  "priority_level": 2
}
```

### ✅ Thành công (201)
```json
{
  "success": true,
  "message": "Tạo danh mục thành công.",
  "data": {
    "category_id": "uuid-xxxx",
    "name": "Tiếng ồn",
    "description": "Ô nhiễm tiếng ồn...",
    "priority_level": 2,
    "is_active": 1,
    "created_at": "2026-03-02T..."
  }
}
```

### ❌ Thất bại
- `400`: `Tên danh mục là bắt buộc.`
- `409`: `Tên danh mục đã tồn tại.`
- `401/403`: theo middleware authenticate/authorize
- `500`: `Lỗi server.`

---

## #14 - PUT `/api/categories/:id`
> Cập nhật danh mục

**Auth:** 🔒 Admin only

**Body (JSON):** (các field optional)
```json
{
  "name": "Tên mới",
  "description": "Mô tả mới",
  "priority_level": 1
}
```

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Cập nhật danh mục thành công.",
  "data": {
    "category_id": "uuid-xxxx",
    "name": "Tên mới",
    "description": "Mô tả mới",
    "priority_level": 1,
    "is_active": 1,
    "created_at": "2026-03-02T..."
  }
}
```

### ❌ Thất bại
- `404`: `Không tìm thấy danh mục.`
- `409`: `Tên danh mục đã tồn tại.`
- `401/403`: theo middleware
- `500`: `Lỗi server.`

---

## #15 - DELETE `/api/categories/:id`
> Xóa danh mục (admin only)

**Auth:** 🔒 Admin only

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Đã xóa danh mục thành công.",
  "data": { "category_id": "uuid-xxxx" }
}
```

### ❌ Thất bại
- `404`: `Không tìm thấy danh mục.`
- `400` nếu đang có báo cáo:
  - `Không thể xóa. Danh mục đang được sử dụng bởi X báo cáo.`
- `401/403`: theo middleware
- `500`: `Lỗi server.`

