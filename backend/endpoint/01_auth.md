# 🔑 1. AUTH - Xác thực (4 endpoints)

---

## #1 - POST `/api/auth/register`
> Đăng ký tài khoản mới

**Auth:** Không cần

**Body (JSON):**
```json
{
  "full_name": "Nguyễn Văn A",
  "phone_number": "0901234567",
  "password": "123456"
}
```

### ✅ Thành công (201)
```json
{
  "success": true,
  "message": "Đăng ký thành công!",
  "data": {
    "user": {
      "user_id": "uuid-xxxx",
      "full_name": "Nguyễn Văn A",
      "phone_number": "0901234567",
      "role": "citizen",
      "avatar_url": null
    },
    "token": "eyJhbGciOi..."
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 400 | Thiếu trường bắt buộc | `{"success": false, "message": "Vui lòng điền đầy đủ: full_name, phone_number, password"}` |
| 400 | Mật khẩu < 6 ký tự | `{"success": false, "message": "Mật khẩu phải có ít nhất 6 ký tự."}` |
| 400 | SĐT không hợp lệ | `{"success": false, "message": "Số điện thoại không hợp lệ. Phải bắt đầu bằng 0 và có 10 chữ số."}` |
| 409 | SĐT đã tồn tại | `{"success": false, "message": "Số điện thoại đã được đăng ký."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server khi đăng ký."}` |

---

## #2 - POST `/api/auth/login`
> Đăng nhập

**Auth:** Không cần

**Body (JSON):**
```json
{
  "phone_number": "0901000001",
  "password": "admin123"
}
```

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Đăng nhập thành công!",
  "data": {
    "user": {
      "user_id": "uuid-xxxx",
      "full_name": "Admin Nguyễn",
      "phone_number": "0901000001",
      "role": "admin",
      "avatar_url": null
    },
    "token": "eyJhbGciOi..."
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 400 | Thiếu SĐT hoặc mật khẩu | `{"success": false, "message": "Vui lòng nhập số điện thoại và mật khẩu."}` |
| 401 | Sai SĐT hoặc mật khẩu | `{"success": false, "message": "Số điện thoại hoặc mật khẩu không đúng."}` |
| 403 | Tài khoản bị khóa | `{"success": false, "message": "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server khi đăng nhập."}` |

---

## #3 - GET `/api/auth/me`
> Lấy thông tin người dùng hiện tại (từ token)

**Auth:** 🔒 Bắt buộc (Bearer Token)

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy thông tin thành công.",
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
| 401 | Không có token / Token hết hạn | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #4 - PUT `/api/auth/change-password`
> Đổi mật khẩu

**Auth:** 🔒 Bắt buộc

**Body (JSON):**
```json
{
  "old_password": "admin123",
  "new_password": "newpass456"
}
```

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Đổi mật khẩu thành công!"
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 400 | Thiếu trường | `{"success": false, "message": "Vui lòng nhập mật khẩu cũ và mật khẩu mới."}` |
| 400 | Mật khẩu mới < 6 ký tự | `{"success": false, "message": "Mật khẩu mới phải có ít nhất 6 ký tự."}` |
| 400 | Mật khẩu cũ sai | `{"success": false, "message": "Mật khẩu cũ không đúng."}` |
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server khi đổi mật khẩu."}` |
