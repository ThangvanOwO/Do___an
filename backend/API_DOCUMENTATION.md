# 📡 API Documentation - Bản đồ Cộng đồng & Báo cáo Sự cố

**Base URL:** `http://localhost:5000/api`

## 📌 Quy tắc chung

### Response Format (Thành công)
```json
{
  "success": true,
  "message": "Mô tả kết quả",
  "data": { ... }
}
```

### Response Format (Thất bại)
```json
{
  "success": false,
  "message": "Mô tả lỗi"
}
```

### Authentication
- Gửi token trong header: `Authorization: Bearer <token>`
- Token nhận được khi đăng nhập/đăng ký, hết hạn sau 7 ngày

### Roles (Phân quyền)
| Role | Mô tả |
|------|--------|
| `citizen` | Người dân - tạo/xem báo cáo |
| `admin` | Quản lý - quản lý toàn bộ hệ thống |
| `staff` | Nhân viên sửa chữa - xử lý sự cố |

---

## 🔐 1. AUTH - Xác thực (4 endpoints)

### #1. POST `/api/auth/register` - Đăng ký
| | |
|---|---|
| **Auth** | Không cần |
| **Body** | `{ "full_name": "Nguyễn Văn A", "phone_number": "0901000008", "password": "123456", "role": "citizen" }` |

**✅ Thành công (201):**
```json
{
  "success": true,
  "message": "Đăng ký thành công!",
  "data": {
    "user": { "user_id": "...", "full_name": "Nguyễn Văn A", "phone_number": "0901000008", "role": "citizen", "avatar_url": null },
    "token": "eyJhbGci..."
  }
}
```
**❌ Thất bại (400/409):**
```json
{ "success": false, "message": "Số điện thoại đã được đăng ký." }
{ "success": false, "message": "Vui lòng điền đầy đủ: full_name, phone_number, password" }
{ "success": false, "message": "Mật khẩu phải có ít nhất 6 ký tự." }
```

---

### #2. POST `/api/auth/login` - Đăng nhập
| | |
|---|---|
| **Auth** | Không cần |
| **Body** | `{ "phone_number": "0901000001", "password": "admin123" }` |

**✅ Thành công (200):**
```json
{
  "success": true,
  "message": "Đăng nhập thành công!",
  "data": {
    "user": { "user_id": "...", "full_name": "Nguyễn Văn Admin", "phone_number": "0901000001", "role": "admin", "avatar_url": null },
    "token": "eyJhbGci..."
  }
}
```
**❌ Thất bại (401/403):**
```json
{ "success": false, "message": "Số điện thoại hoặc mật khẩu không đúng." }
{ "success": false, "message": "Tài khoản đã bị vô hiệu hóa." }
```

---

### #3. GET `/api/auth/me` - Lấy thông tin cá nhân
| | |
|---|---|
| **Auth** | Bearer Token (tất cả role) |

**✅ Thành công (200):**
```json
{
  "success": true,
  "message": "Lấy thông tin thành công.",
  "data": {
    "user_id": "...", "full_name": "...", "phone_number": "...", "role": "citizen",
    "avatar_url": null, "is_active": 1, "created_at": "...", "total_reports": 3
  }
}
```
**❌ Thất bại (401):**
```json
{ "success": false, "message": "Không có token xác thực. Vui lòng đăng nhập." }
```

---

### #4. PUT `/api/auth/change-password` - Đổi mật khẩu
| | |
|---|---|
| **Auth** | Bearer Token (tất cả role) |
| **Body** | `{ "old_password": "123456", "new_password": "654321" }` |

**✅ Thành công (200):**
```json
{ "success": true, "message": "Đổi mật khẩu thành công!" }
```
**❌ Thất bại (400):**
```json
{ "success": false, "message": "Mật khẩu cũ không đúng." }
```

---

## 👥 2. USERS - Quản lý người dùng (6 endpoints)

### #5. GET `/api/users` - Danh sách người dùng
| | |
|---|---|
| **Auth** | Bearer Token (admin) |
| **Query** | `?page=1&limit=20&role=citizen&search=nguyen&is_active=1` |

**✅ Thành công (200):**
```json
{
  "success": true,
  "data": {
    "users": [ { "user_id": "...", "full_name": "...", "role": "...", ... } ],
    "pagination": { "total": 7, "page": 1, "limit": 20, "total_pages": 1 }
  }
}
```

---

### #6. GET `/api/users/:id` - Chi tiết người dùng
| | |
|---|---|
| **Auth** | Bearer Token (tất cả role) |

**✅ (200):** `{ "success": true, "data": { "user_id": "...", "full_name": "...", "total_reports": 3, ... } }`
**❌ (404):** `{ "success": false, "message": "Không tìm thấy người dùng." }`

---

### #7. PUT `/api/users/:id` - Cập nhật thông tin
| | |
|---|---|
| **Auth** | Bearer Token (chủ sở hữu hoặc admin) |
| **Body** | `{ "full_name": "Tên mới", "phone_number": "0909...", "role": "staff" }` |

**✅ (200):** `{ "success": true, "message": "Cập nhật thông tin thành công.", "data": { ... } }`
**❌ (403):** `{ "success": false, "message": "Bạn không có quyền chỉnh sửa thông tin người dùng này." }`
**❌ (409):** `{ "success": false, "message": "Số điện thoại đã được sử dụng bởi tài khoản khác." }`

---

### #8. PUT `/api/users/:id/avatar` - Upload avatar
| | |
|---|---|
| **Auth** | Bearer Token (chủ sở hữu hoặc admin) |
| **Body** | `form-data: avatar = [file ảnh]` |

**✅ (200):** `{ "success": true, "data": { "avatar_url": "/uploads/avatars/avatar_xxx.jpg" } }`
**❌ (400):** `{ "success": false, "message": "Chỉ cho phép upload file ảnh (JPEG, PNG, GIF, WEBP)." }`

---

### #9. PATCH `/api/users/:id/toggle-active` - Kích hoạt/Vô hiệu hóa
| | |
|---|---|
| **Auth** | Bearer Token (admin) |

**✅ (200):** `{ "success": true, "message": "Đã vô hiệu hóa tài khoản.", "data": { "is_active": 0 } }`
**❌ (400):** `{ "success": false, "message": "Bạn không thể vô hiệu hóa chính mình." }`

---

### #10. DELETE `/api/users/:id` - Xóa người dùng
| | |
|---|---|
| **Auth** | Bearer Token (admin) |

**✅ (200):** `{ "success": true, "message": "Đã xóa người dùng thành công." }`
**❌ (404):** `{ "success": false, "message": "Không tìm thấy người dùng." }`

---

## 📂 3. CATEGORIES - Danh mục sự cố (5 endpoints)

### #11. GET `/api/categories` - Danh sách danh mục
| | |
|---|---|
| **Auth** | Không cần |
| **Query** | `?is_active=1` |

**✅ (200):**
```json
{
  "success": true,
  "data": [
    { "category_id": "...", "name": "Hạ tầng", "icon": "🏗️", "priority_level": 1, "total_reports": 2 },
    { "category_id": "...", "name": "Vệ sinh môi trường", "icon": "🗑️", "priority_level": 1, "total_reports": 1 }
  ]
}
```

---

### #12. GET `/api/categories/:id` - Chi tiết danh mục
| | |
|---|---|
| **Auth** | Không cần |

**✅ (200):** `{ "success": true, "data": { "category_id": "...", "name": "...", "total_reports": 2 } }`
**❌ (404):** `{ "success": false, "message": "Không tìm thấy danh mục." }`

---

### #13. POST `/api/categories` - Tạo danh mục mới
| | |
|---|---|
| **Auth** | Bearer Token (admin) |
| **Body** | `{ "name": "Điện lực", "description": "Sự cố về điện", "icon": "⚡", "priority_level": 1 }` |

**✅ (201):** `{ "success": true, "message": "Tạo danh mục thành công.", "data": { ... } }`
**❌ (409):** `{ "success": false, "message": "Tên danh mục đã tồn tại." }`

---

### #14. PUT `/api/categories/:id` - Cập nhật danh mục
| | |
|---|---|
| **Auth** | Bearer Token (admin) |
| **Body** | `{ "name": "Tên mới", "description": "...", "icon": "...", "priority_level": 2, "is_active": 1 }` |

**✅ (200):** `{ "success": true, "message": "Cập nhật danh mục thành công.", "data": { ... } }`

---

### #15. DELETE `/api/categories/:id` - Xóa danh mục
| | |
|---|---|
| **Auth** | Bearer Token (admin) |

**✅ (200):** `{ "success": true, "message": "Đã xóa danh mục thành công." }`
**❌ (400):** `{ "success": false, "message": "Không thể xóa. Danh mục đang được sử dụng bởi 5 báo cáo." }`

---

## 📋 4. REPORTS - Báo cáo sự cố (11 endpoints)

### #16. GET `/api/reports` - Danh sách báo cáo
| | |
|---|---|
| **Auth** | Không bắt buộc (có token sẽ thêm `has_upvoted`) |
| **Query** | `?page=1&limit=20&status=pending&category_id=xxx&user_id=xxx&search=hố ga&sort_by=created_at&sort_order=DESC&lat=10.77&lng=106.70&radius=5` |

**✅ (200):**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "report_id": "...", "title": "Hố ga mất nắp", "description": "...",
        "latitude": 10.7731, "longitude": 106.7030, "address": "...",
        "status": "pending", "upvote_count": 3, "created_at": "...",
        "reporter_name": "Hoàng Văn Dân", "category_name": "Hạ tầng", "category_icon": "🏗️",
        "images": [ { "image_id": "...", "image_url": "/uploads/reports/xxx.jpg" } ],
        "has_upvoted": false
      }
    ],
    "pagination": { "total": 5, "page": 1, "limit": 20, "total_pages": 1 }
  }
}
```

---

### #17. GET `/api/reports/my-reports` - Báo cáo của tôi
| | |
|---|---|
| **Auth** | Bearer Token (tất cả role) |
| **Query** | `?page=1&limit=20&status=pending` |

**✅ (200):** Tương tự #16 nhưng chỉ trả về báo cáo của người dùng hiện tại.

---

### #18. GET `/api/reports/nearby` - Báo cáo gần đây (theo GPS)
| | |
|---|---|
| **Auth** | Không cần |
| **Query** | `?lat=10.77&lng=106.70&radius=5` (radius = km) |

**✅ (200):**
```json
{
  "success": true,
  "message": "Tìm thấy 3 báo cáo trong bán kính 5km.",
  "data": [ { "report_id": "...", "title": "...", "distance_km": 1.23, ... } ]
}
```
**❌ (400):** `{ "success": false, "message": "Vui lòng cung cấp tọa độ (lat, lng)." }`

---

### #19. GET `/api/reports/map-data` - Dữ liệu bản đồ (markers)
| | |
|---|---|
| **Auth** | Không cần |
| **Query** | `?status=pending&category_id=xxx` |

**✅ (200):**
```json
{
  "success": true,
  "message": "Lấy 5 điểm trên bản đồ.",
  "data": [
    { "report_id": "...", "title": "...", "latitude": 10.77, "longitude": 106.70, "status": "pending", "upvote_count": 3, "category_name": "Hạ tầng", "category_icon": "🏗️" }
  ]
}
```

---

### #20. GET `/api/reports/:id` - Chi tiết báo cáo
| | |
|---|---|
| **Auth** | Không bắt buộc |

**✅ (200):**
```json
{
  "success": true,
  "data": {
    "report_id": "...", "title": "...", "description": "...",
    "latitude": 10.77, "longitude": 106.70, "status": "in_progress",
    "reporter_name": "...", "category_name": "Hạ tầng",
    "images": [ { "image_id": "...", "image_url": "..." } ],
    "logs": [
      { "log_id": "...", "old_status": "pending", "new_status": "confirmed", "changed_by_name": "Admin", "note": "Đã xác nhận", "updated_at": "..." }
    ],
    "has_upvoted": false
  }
}
```
**❌ (404):** `{ "success": false, "message": "Không tìm thấy báo cáo." }`

---

### #21. POST `/api/reports` - Tạo báo cáo mới
| | |
|---|---|
| **Auth** | Bearer Token (tất cả role) |
| **Body** | `form-data: title, description, latitude, longitude, address, category_id, images (nhiều file ảnh, tối đa 5)` |

**✅ (201):**
```json
{
  "success": true,
  "message": "Tạo báo cáo sự cố thành công! Chúng tôi sẽ xử lý sớm nhất.",
  "data": { "report_id": "...", "title": "...", "status": "pending", "images": [...] }
}
```
**❌ (400):** `{ "success": false, "message": "Vui lòng điền đầy đủ: title, description, latitude, longitude, category_id" }`

---

### #22. PUT `/api/reports/:id` - Cập nhật báo cáo
| | |
|---|---|
| **Auth** | Bearer Token (chủ sở hữu hoặc admin) |
| **Body** | `{ "title": "...", "description": "...", "latitude": ..., "longitude": ..., "address": "...", "category_id": "..." }` |

**✅ (200):** `{ "success": true, "message": "Cập nhật báo cáo thành công.", "data": { ... } }`
**❌ (403):** `{ "success": false, "message": "Bạn không có quyền chỉnh sửa báo cáo này." }`

---

### #23. PATCH `/api/reports/:id/status` - Cập nhật trạng thái
| | |
|---|---|
| **Auth** | Bearer Token (admin, staff) |
| **Body** | `{ "new_status": "in_progress", "note": "Đang cử đội kỹ thuật xuống." }` |
| **Giá trị status** | `pending`, `confirmed`, `in_progress`, `resolved`, `rejected` |

**✅ (200):**
```json
{
  "success": true,
  "message": "Cập nhật trạng thái thành công: Chờ tiếp nhận → Đang xử lý",
  "data": { "report_id": "...", "old_status": "pending", "new_status": "in_progress", "log_id": "..." }
}
```

---

### #24. POST `/api/reports/:id/upvote` - Upvote / Bỏ upvote (Toggle)
| | |
|---|---|
| **Auth** | Bearer Token (tất cả role) |

**✅ Upvote (200):**
```json
{ "success": true, "message": "Đã xác nhận (upvote) báo cáo.", "data": { "upvoted": true, "upvote_count": 4 } }
```
**✅ Bỏ upvote (200):**
```json
{ "success": true, "message": "Đã bỏ xác nhận (upvote).", "data": { "upvoted": false, "upvote_count": 3 } }
```

---

### #25. POST `/api/reports/:id/images` - Upload thêm ảnh
| | |
|---|---|
| **Auth** | Bearer Token (chủ sở hữu hoặc admin) |
| **Body** | `form-data: images (nhiều file, tối đa 5)` |

**✅ (201):** `{ "success": true, "message": "Đã upload 3 ảnh thành công.", "data": [ { "image_id": "...", "image_url": "..." } ] }`

---

### #26. DELETE `/api/reports/:id` - Xóa báo cáo
| | |
|---|---|
| **Auth** | Bearer Token (chủ sở hữu hoặc admin) |

**✅ (200):** `{ "success": true, "message": "Đã xóa báo cáo thành công." }`
**❌ (403):** `{ "success": false, "message": "Bạn không có quyền xóa báo cáo này." }`

---

## 📝 5. LOGS - Nhật ký xử lý (4 endpoints)

### #27. GET `/api/logs` - Danh sách nhật ký
| | |
|---|---|
| **Auth** | Bearer Token (admin, staff) |
| **Query** | `?page=1&limit=20&report_id=xxx&changed_by=xxx` |

**✅ (200):**
```json
{
  "success": true,
  "data": {
    "logs": [
      { "log_id": "...", "report_title": "...", "old_status": "pending", "new_status": "confirmed", "changed_by_name": "Admin", "note": "...", "proof_image_url": null }
    ],
    "pagination": { "total": 5, "page": 1, "limit": 20, "total_pages": 1 }
  }
}
```

---

### #28. GET `/api/logs/report/:reportId` - Lịch sử xử lý 1 báo cáo
| | |
|---|---|
| **Auth** | Không cần |

**✅ (200):**
```json
{
  "success": true,
  "data": {
    "report_id": "...", "report_title": "...", "current_status": "in_progress",
    "logs": [ { "log_id": "...", "old_status": "pending", "new_status": "confirmed", ... } ]
  }
}
```

---

### #29. POST `/api/logs` - Tạo log kèm ảnh chứng minh
| | |
|---|---|
| **Auth** | Bearer Token (admin, staff) |
| **Body** | `form-data: report_id, new_status, note, proof_image (file ảnh)` |

**✅ (201):**
```json
{
  "success": true,
  "message": "Tạo nhật ký xử lý thành công.",
  "data": { "log_id": "...", "old_status": "confirmed", "new_status": "resolved", "proof_image_url": "/uploads/proofs/xxx.jpg" }
}
```

---

### #30. GET `/api/logs/:id` - Chi tiết 1 log
| | |
|---|---|
| **Auth** | Bearer Token (tất cả role) |

**✅ (200):** `{ "success": true, "data": { "log_id": "...", "report_title": "...", "changed_by_name": "...", ... } }`

---

## 📊 6. STATISTICS - Thống kê (6 endpoints)

### #31. GET `/api/statistics/overview` - Tổng quan
| | |
|---|---|
| **Auth** | Bearer Token (admin) |

**✅ (200):**
```json
{
  "success": true,
  "data": {
    "total_users": 7, "total_reports": 5, "total_categories": 8, "resolve_rate": "20.0%",
    "reports_by_status": [ { "status": "pending", "count": 2 }, ... ],
    "monthly_reports": [ { "month": "2026-03", "total": 5, "resolved": 1 } ],
    "users_by_role": [ { "role": "admin", "count": 2 }, ... ]
  }
}
```

---

### #32. GET `/api/statistics/by-category` - Theo danh mục
| | |
|---|---|
| **Auth** | Bearer Token (admin, staff) |

**✅ (200):**
```json
{
  "success": true,
  "data": [
    { "category_id": "...", "name": "Hạ tầng", "icon": "🏗️", "total_reports": 2, "pending": 1, "confirmed": 0, "in_progress": 1, "resolved": 0, "rejected": 0 }
  ]
}
```

---

### #33. GET `/api/statistics/by-status` - Theo trạng thái
| | |
|---|---|
| **Auth** | Bearer Token (admin, staff) |

**✅ (200):**
```json
{
  "success": true,
  "data": [
    { "status": "pending", "count": 2, "label": "Chờ tiếp nhận" },
    { "status": "in_progress", "count": 1, "label": "Đang xử lý" }
  ]
}
```

---

### #34. GET `/api/statistics/heatmap` - Bản đồ nhiệt
| | |
|---|---|
| **Auth** | Không cần |
| **Query** | `?category_id=xxx&status=pending` |

**✅ (200):**
```json
{
  "success": true,
  "data": [
    { "lat": 10.7731, "lng": 106.7030, "weight": 6 },
    { "lat": 10.7875, "lng": 106.6791, "weight": 3 }
  ]
}
```

---

### #35. GET `/api/statistics/top-reporters` - Top người báo cáo
| | |
|---|---|
| **Auth** | Bearer Token (admin) |
| **Query** | `?limit=10` |

**✅ (200):**
```json
{
  "success": true,
  "data": [
    { "user_id": "...", "full_name": "Hoàng Văn Dân", "total_reports": 2, "resolved_reports": 1, "total_upvotes": 5 }
  ]
}
```

---

### #36. GET `/api/statistics/recent-activity` - Hoạt động gần đây
| | |
|---|---|
| **Auth** | Bearer Token (admin, staff) |
| **Query** | `?limit=20` |

**✅ (200):**
```json
{
  "success": true,
  "data": {
    "recent_reports": [ { "report_id": "...", "title": "...", "status": "pending", "reporter_name": "...", "created_at": "..." } ],
    "recent_logs": [ { "log_id": "...", "report_title": "...", "old_status": "pending", "new_status": "confirmed", "staff_name": "Admin" } ]
  }
}
```

---

## 🔔 7. NOTIFICATIONS - Thông báo (5 endpoints)

### #37. GET `/api/notifications` - Danh sách thông báo
| | |
|---|---|
| **Auth** | Bearer Token (tất cả role) |
| **Query** | `?page=1&limit=20&is_read=0` |

**✅ (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      { "notification_id": "...", "title": "Báo cáo đã được xác nhận", "message": "...", "type": "status_update", "is_read": 0, "created_at": "..." }
    ],
    "unread_count": 2,
    "pagination": { "total": 3, "page": 1, "limit": 20, "total_pages": 1 }
  }
}
```

---

### #38. GET `/api/notifications/unread-count` - Số thông báo chưa đọc
| | |
|---|---|
| **Auth** | Bearer Token (tất cả role) |

**✅ (200):** `{ "success": true, "data": { "unread_count": 2 } }`

---

### #39. PATCH `/api/notifications/:id/read` - Đánh dấu đã đọc
| | |
|---|---|
| **Auth** | Bearer Token (tất cả role) |

**✅ (200):** `{ "success": true, "message": "Đã đánh dấu đã đọc.", "data": { "notification_id": "...", "is_read": 1 } }`

---

### #40. PATCH `/api/notifications/read-all` - Đánh dấu tất cả đã đọc
| | |
|---|---|
| **Auth** | Bearer Token (tất cả role) |

**✅ (200):** `{ "success": true, "message": "Đã đánh dấu 3 thông báo đã đọc.", "data": { "updated_count": 3 } }`

---

### #41. DELETE `/api/notifications/:id` - Xóa thông báo
| | |
|---|---|
| **Auth** | Bearer Token (tất cả role) |

**✅ (200):** `{ "success": true, "message": "Đã xóa thông báo." }`
**❌ (404):** `{ "success": false, "message": "Không tìm thấy thông báo." }`

---

## 🧪 Tài khoản test

| Role | SĐT | Mật khẩu |
|------|------|----------|
| Admin | `0901000001` | `admin123` |
| Admin | `0901000002` | `admin123` |
| Staff | `0901000003` | `staff123` |
| Staff | `0901000004` | `staff123` |
| Citizen | `0901000005` | `user123` |
| Citizen | `0901000006` | `user123` |
| Citizen | `0901000007` | `user123` |

---

## 🚀 Cách chạy

```bash
cd backend
npm install
npm run seed    # Tạo dữ liệu mẫu
npm start       # Chạy server (port 5000)
npm run dev     # Chạy dev mode (auto-restart)
```

## ⚠️ HTTP Status Codes

| Code | Ý nghĩa |
|------|---------|
| `200` | Thành công |
| `201` | Tạo mới thành công |
| `400` | Dữ liệu đầu vào không hợp lệ |
| `401` | Chưa xác thực / Token hết hạn |
| `403` | Không có quyền truy cập |
| `404` | Không tìm thấy tài nguyên |
| `409` | Dữ liệu bị trùng lặp |
| `500` | Lỗi server nội bộ |
