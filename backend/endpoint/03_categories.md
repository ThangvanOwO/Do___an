# 📂 3. CATEGORIES - Danh mục (5 endpoints)

---

## #11 - GET `/api/categories`
> Lấy danh sách tất cả danh mục

**Auth:** 🔓 Không yêu cầu

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy danh sách danh mục thành công.",
  "data": [
    {
      "category_id": 1,
      "name": "Ổ gà / Hư hỏng mặt đường",
      "description": "Các vấn đề liên quan đến mặt đường bị hư hỏng",
      "icon": "🕳️",
      "color": "#e74c3c",
      "is_active": 1,
      "report_count": 2,
      "created_at": "2026-03-02T..."
    }
  ]
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #12 - GET `/api/categories/:id`
> Lấy chi tiết 1 danh mục kèm danh sách báo cáo

**Auth:** 🔓 Không yêu cầu

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy thông tin danh mục thành công.",
  "data": {
    "category": {
      "category_id": 1,
      "name": "Ổ gà / Hư hỏng mặt đường",
      "description": "Các vấn đề liên quan đến mặt đường bị hư hỏng",
      "icon": "🕳️",
      "color": "#e74c3c",
      "is_active": 1,
      "created_at": "2026-03-02T..."
    },
    "reports": [
      {
        "report_id": "uuid-xxxx",
        "title": "Ổ gà lớn trên đường Nguyễn Huệ",
        "status": "pending",
        "severity": "high",
        "created_at": "2026-03-02T..."
      }
    ]
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 404 | ID không tồn tại | `{"success": false, "message": "Không tìm thấy danh mục."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #13 - POST `/api/categories`
> Tạo danh mục mới

**Auth:** 🔒 Admin only

**Body (JSON):**
```json
{
  "name": "Tiếng ồn",
  "description": "Ô nhiễm tiếng ồn, xây dựng, karaoke...",
  "icon": "🔊",
  "color": "#9b59b6"
}
```

### ✅ Thành công (201)
```json
{
  "success": true,
  "message": "Tạo danh mục thành công.",
  "data": {
    "category_id": 9,
    "name": "Tiếng ồn",
    "description": "Ô nhiễm tiếng ồn, xây dựng, karaoke...",
    "icon": "🔊",
    "color": "#9b59b6",
    "is_active": 1,
    "created_at": "2026-03-03T..."
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 400 | Thiếu tên | `{"success": false, "message": "Tên danh mục là bắt buộc."}` |
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 403 | Không phải admin | `{"success": false, "message": "Bạn không có quyền thực hiện hành động này."}` |
| 409 | Tên trùng | `{"success": false, "message": "Tên danh mục đã tồn tại."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #14 - PUT `/api/categories/:id`
> Cập nhật danh mục

**Auth:** 🔒 Admin only

**Body (JSON):**
```json
{
  "name": "Tên mới",
  "description": "Mô tả mới",
  "icon": "📝",
  "color": "#3498db",
  "is_active": 1
}
```

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Cập nhật danh mục thành công.",
  "data": {
    "category_id": 1,
    "name": "Tên mới",
    "description": "Mô tả mới",
    "icon": "📝",
    "color": "#3498db",
    "is_active": 1,
    "created_at": "2026-03-02T..."
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 400 | Body rỗng | `{"success": false, "message": "Cần ít nhất 1 trường để cập nhật."}` |
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 403 | Không phải admin | `{"success": false, "message": "Bạn không có quyền thực hiện hành động này."}` |
| 404 | ID không tồn tại | `{"success": false, "message": "Không tìm thấy danh mục."}` |
| 409 | Tên trùng | `{"success": false, "message": "Tên danh mục đã tồn tại."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #15 - DELETE `/api/categories/:id`
> Xóa danh mục

**Auth:** 🔒 Admin only

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Đã xóa danh mục thành công.",
  "data": {
    "category_id": 1
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 400 | Danh mục đang có báo cáo | `{"success": false, "message": "Không thể xóa danh mục đang có X báo cáo. Vui lòng chuyển các báo cáo sang danh mục khác trước."}` |
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 403 | Không phải admin | `{"success": false, "message": "Bạn không có quyền thực hiện hành động này."}` |
| 404 | ID không tồn tại | `{"success": false, "message": "Không tìm thấy danh mục."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |
