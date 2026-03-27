# 👥 2. USERS - Người dùng

> Base: `/api/users`
> Các endpoint đều trả response chung dạng:
```json
{ "success": true, "message": "....", "data": { ... } }
```
Trong trường hợp lỗi:
```json
{ "success": false, "message": "...." }
```

---

## #5 - GET `/api/users`
> Lấy danh sách người dùng

**Auth:** 🔒 Admin only (`authorize('admin')`)

**Query Parameters:**
- `page` (number, mặc định `1`)
- `limit` (number, mặc định `20`)
- `role` (string: `admin|staff|citizen`)
- `search` (string: tìm `full_name` hoặc `phone_number`)

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy danh sách người dùng thành công.",
  "data": {
    "users": [
      {
        "user_id": "uuid-xxxx",
        "full_name": "....",
        "phone_number": "....",
        "role": "admin|staff|citizen",
        "avatar_url": null
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
- `401` (không có/expired token) trả `{success:false,message: "..."}`
  - từ middleware `authenticate`: có thể là `Không có token xác thực. Vui lòng đăng nhập.` hoặc `Token đã hết hạn...` hoặc `Token không hợp lệ...`
- `403` nếu không đúng role admin:
  - `Bạn không có quyền thực hiện hành động này. Yêu cầu quyền: admin`
- `500` lỗi server: `Lỗi server.`

---

## #6 - GET `/api/users/:id`
> Lấy thông tin 1 người dùng + tổng số báo cáo của user đó

**Auth:** 🔒 Bắt buộc (`authenticate`)

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy thông tin người dùng thành công.",
  "data": {
    "user_id": "uuid-xxxx",
    "full_name": "....",
    "phone_number": "....",
    "role": "admin|staff|citizen",
    "avatar_url": null,
    "total_reports": 3
  }
}
```

### ❌ Thất bại
- `401` token lỗi/mất: `{success:false,message:"..."}` (theo middleware)
- `404` không tìm thấy: `Không tìm thấy người dùng.`
- `500` lỗi server: `Lỗi server.`

---

## #7 - PUT `/api/users/:id`
> Cập nhật thông tin người dùng (chỉ chính chủ hoặc admin)

**Auth:** 🔒 Chính chủ hoặc Admin

**Body (JSON):** (tất cả field optional)
```json
{
  "full_name": "Tên mới",
  "phone_number": "0909999999",
  "role": "staff"
}
```

> Chỉ khi `req.user.role === 'admin'` thì mới được thay đổi `role`. Các trường còn lại dùng `existing` nếu không gửi.

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
    "avatar_url": null
  }
}
```

### ❌ Thất bại
- `401` token lỗi/mất: `{success:false,message:"..."}` (theo middleware)
- `403` không có quyền chỉnh sửa:
  - `Bạn không có quyền chỉnh sửa thông tin người dùng này.`
- `404` không tìm thấy user: `Không tìm thấy người dùng.`
- `409` SĐT bị trùng:
  - `Số điện thoại đã được sử dụng bởi tài khoản khác.`
- `500` lỗi server: `Lỗi server.`

---

## #8 - PUT `/api/users/:id/avatar`
> Upload ảnh đại diện

**Auth:** 🔒 Chính chủ hoặc Admin

**Body:** `multipart/form-data`
- field `avatar`: File ảnh

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Cập nhật avatar thành công.",
  "data": {
    "avatar_url": "/uploads/avatars/avatar-xxxx.jpg"
  }
}
```

### ❌ Thất bại
- `401` token lỗi/mất
- `403` không có quyền:
  - `Bạn không có quyền thay đổi avatar.`
- `400` lỗi upload:
  - `Vui lòng chọn file ảnh để upload.`
  - hoặc `{ success:false, message: err.message }` (do multer trả)
- `500` lỗi server: `Lỗi server.`

---

## #10 - DELETE `/api/users/:id`
> Xóa 1 người dùng (admin only)

**Auth:** 🔒 Admin only (`authorize('admin')`)

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
- `400` không được xóa chính mình: `Bạn không thể xóa chính mình.`
- `401` token lỗi/mất
- `403` không phải admin:
  - `Bạn không có quyền thực hiện hành động này. Yêu cầu quyền: admin`
- `404` không tìm thấy: `Không tìm thấy người dùng.`
- `500` lỗi server: `Lỗi server.`

# 👥 2. USERS - Người dùng (5 endpoint đang chạy + 1 mục #9 chưa code)

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

## #9 - PATCH `/api/users/:id/toggle-active` _(chưa triển khai trong code)_

> **Lưu ý:** Endpoint này được mô tả trong tài liệu cũ / đặt tả nhưng **chưa có route** trong `users.routes.js`. Schema `users` hiện tại **không có** cột `is_active`.  
> Nếu cần: thêm cột DB + route PATCH, hoặc xóa hẳn mục này khỏi client.

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
