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
  "password": "123456",
  "role": "admin|staff|citizen" 
}
```

### ✅ Thành công (201)
Backend trả:
```json
{
  "success": true,
  "message": "Đăng ký thành công!",
  "data": {
    "user": {
      "user_id": "uuid-xxxx",
      "full_name": "Nguyễn Văn A",
      "phone_number": "0901234567",
      "role": "citizen|admin|staff",
      "avatar_url": null
    },
    "token": "..."
  }
}
```

### ❌ Thất bại
```json
{ "success": false, "message": "..." }
```
Các case phổ biến:
- `400` thiếu field: `Vui lòng điền đầy đủ: full_name, phone_number, password`
- `400` mật khẩu < 6: `Mật khẩu phải có ít nhất 6 ký tự.`
- `400` SĐT sai format: `Số điện thoại không hợp lệ. Phải bắt đầu bằng 0 và có 10 chữ số.`
- `409` SĐT trùng: `Số điện thoại đã được đăng ký.`
- `500` server: `Lỗi server khi đăng ký.`

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
Backend trả:
```json
{
  "success": true,
  "message": "Đăng nhập thành công!",
  "data": {
    "user": {
      "user_id": "uuid-xxxx",
      "full_name": "Admin Nguyễn",
      "phone_number": "0901000001",
      "role": "admin|staff|citizen",
      "avatar_url": null
    },
    "token": "..."
  }
}
```

### ❌ Thất bại
```json
{ "success": false, "message": "..." }
```
- `400` thiếu SĐT/mật khẩu: `Vui lòng nhập số điện thoại và mật khẩu.`
- `401` sai SĐT/mật khẩu: `Số điện thoại hoặc mật khẩu không đúng.`
- `500` server: `Lỗi server khi đăng nhập.`

---

## #3 - GET `/api/auth/me`
> Lấy thông tin người dùng hiện tại (từ token)

**Auth:** 🔒 Bắt buộc (Bearer Token)

### ✅ Thành công (200)
Backend chọn từ `users` và thêm `total_reports`:
```json
{
  "success": true,
  "message": "Lấy thông tin thành công.",
  "data": {
    "user_id": "uuid-xxxx",
    "full_name": "...",
    "phone_number": "...",
    "role": "admin|staff|citizen",
    "avatar_url": null,
    "total_reports": 3
  }
}
```

### ❌ Thất bại
```json
{ "success": false, "message": "..." }
```
Các case:
- `401` không có token: `Không có token xác thực. Vui lòng đăng nhập.`
- `401` token hết hạn: `Token đã hết hạn. Vui lòng đăng nhập lại.`
- `401` token không hợp lệ: `Token không hợp lệ.` hoặc `Token không hợp lệ. Người dùng không tồn tại.`
- `500` server: `Lỗi server.`

---

## #4 - PUT `/api/auth/change-password`
> Đổi mật khẩu

**Auth:** 🔒 Bắt buộc (Bearer Token)

**Body (JSON):**
```json
{
  "old_password": "admin123",
  "new_password": "newpass456"
}
```

### ✅ Thành công (200)
```json
{ "success": true, "message": "Đổi mật khẩu thành công!" }
```

### ❌ Thất bại
```json
{ "success": false, "message": "..." }
```
- `400` thiếu field: `Vui lòng nhập mật khẩu cũ và mật khẩu mới.`
- `400` mật khẩu mới < 6: `Mật khẩu mới phải có ít nhất 6 ký tự.`
- `400` mật khẩu cũ sai: `Mật khẩu cũ không đúng.`
- `401` auth lỗi (token): theo middleware authenticate
- `500` server: `Lỗi server.`
