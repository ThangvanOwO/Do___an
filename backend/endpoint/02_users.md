# 👥 2. USERS - Người dùng (6 endpoints)

---

## #5 - GET `/api/users`
> Lấy danh sách tất cả người dùng

**Auth:** 🔒 Admin only

**Query Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| page | number | Trang (mặc định: 1) |
| limit | number | Số lượng/trang (mặc định: 20) |
| role | string | Lọc theo role: `admin`, `staff`, `citizen` |
| search | string | Tìm theo tên hoặc SĐT |
| is_active | 0/1 | Lọc theo trạng thái hoạt động |

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy danh sách người dùng thành công.",
  "data": {
    "users": [
      {
        "user_id": "uuid-xxxx",
        "full_name": "Admin Nguyễn",
        "phone_number": "0901000001",
        "role": "admin",
        "avatar_url": null,
        "is_active": 1,
        "created_at": "2026-03-02T...",
        "updated_at": "2026-03-02T..."
      }
    ],
    "pagination": {
      "total": 7,
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
| 403 | Không phải admin | `{"success": false, "message": "Bạn không có quyền thực hiện hành động này."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #6 - GET `/api/users/:id`
> Lấy thông tin chi tiết 1 người dùng

**Auth:** 🔒 Bắt buộc

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy thông tin người dùng thành công.",
  "data": {
    "user_id": "uuid-xxxx",
    "full_name": "Admin Nguyễn",
    "phone_number": "0901000001",
    "role": "admin",
    "avatar_url": null,
    "is_active": 1,
    "created_at": "2026-03-02T...",
    "updated_at": "2026-03-02T...",
    "total_reports": 3
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 404 | ID không tồn tại | `{"success": false, "message": "Không tìm thấy người dùng."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #7 - PUT `/api/users/:id`
> Cập nhật thông tin người dùng

**Auth:** 🔒 Chính chủ hoặc Admin

**Body (JSON):**
```json
{
  "full_name": "Tên mới",
  "phone_number": "0909999999",
  "role": "staff"
}
```
> *Chỉ admin mới đổi được `role`*

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Cập nhật thông tin thành công.",
  "data": {
    "user_id": "uuid-xxxx",
    "full_name": "Tên mới",
    "phone_number": "0909999999",
    "role": "staff",
    "avatar_url": null,
    "is_active": 1,
    "created_at": "2026-03-02T...",
    "updated_at": "2026-03-03T..."
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 403 | Không phải chính chủ/admin | `{"success": false, "message": "Bạn không có quyền chỉnh sửa thông tin người dùng này."}` |
| 404 | ID không tồn tại | `{"success": false, "message": "Không tìm thấy người dùng."}` |
| 409 | SĐT bị trùng | `{"success": false, "message": "Số điện thoại đã được sử dụng bởi tài khoản khác."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #8 - PUT `/api/users/:id/avatar`
> Upload avatar cho người dùng

**Auth:** 🔒 Chính chủ hoặc Admin

**Body:** `multipart/form-data`
| Field | Type | Mô tả |
|-------|------|-------|
| avatar | File | Ảnh avatar (jpg/png/gif, max 2MB) |

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Cập nhật avatar thành công.",
  "data": {
    "avatar_url": "/uploads/avatars/avatar-1709456789.jpg"
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 400 | Không chọn file | `{"success": false, "message": "Vui lòng chọn file ảnh để upload."}` |
| 400 | File quá lớn/sai định dạng | `{"success": false, "message": "Chỉ cho phép upload ảnh (jpg, png, gif). Dung lượng tối đa 2MB."}` |
| 403 | Không phải chính chủ/admin | `{"success": false, "message": "Bạn không có quyền thay đổi avatar."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #9 - PATCH `/api/users/:id/toggle-active`
> Kích hoạt / Vô hiệu hóa tài khoản

**Auth:** 🔒 Admin only

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Đã vô hiệu hóa tài khoản.",
  "data": {
    "user_id": "uuid-xxxx",
    "is_active": 0
  }
}
```
> *Hoặc `"message": "Đã kích hoạt tài khoản."` khi `is_active: 1`*

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 400 | Tự khóa chính mình | `{"success": false, "message": "Bạn không thể vô hiệu hóa chính mình."}` |
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 403 | Không phải admin | `{"success": false, "message": "Bạn không có quyền thực hiện hành động này."}` |
| 404 | ID không tồn tại | `{"success": false, "message": "Không tìm thấy người dùng."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #10 - DELETE `/api/users/:id`
> Xóa người dùng

**Auth:** 🔒 Admin only

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Đã xóa người dùng thành công.",
  "data": {
    "user_id": "uuid-xxxx"
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 400 | Tự xóa chính mình | `{"success": false, "message": "Bạn không thể xóa chính mình."}` |
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 403 | Không phải admin | `{"success": false, "message": "Bạn không có quyền thực hiện hành động này."}` |
| 404 | ID không tồn tại | `{"success": false, "message": "Không tìm thấy người dùng."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |
