# 📋 4. REPORTS - Báo cáo sự cố (11 endpoints)

---

## #16 - GET `/api/reports`
> Lấy danh sách báo cáo (có filter + phân trang)

**Auth:** 🔓 Tùy chọn (nếu đăng nhập sẽ thấy `user_upvoted`)

**Query Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| page | number | Trang (mặc định: 1) |
| limit | number | Số lượng/trang (mặc định: 20) |
| status | string | `pending`, `confirmed`, `in_progress`, `resolved`, `rejected` |
| category_id | number | Lọc theo danh mục |
| severity | string | `low`, `medium`, `high`, `critical` |
| search | string | Tìm theo tiêu đề hoặc mô tả |
| sort | string | `newest`, `oldest`, `most_upvoted` (mặc định: `newest`) |

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy danh sách báo cáo thành công.",
  "data": {
    "reports": [
      {
        "report_id": "uuid-xxxx",
        "title": "Ổ gà lớn trên đường Nguyễn Huệ",
        "description": "Ổ gà sâu khoảng 30cm...",
        "latitude": 10.7731,
        "longitude": 106.7030,
        "address": "123 Nguyễn Huệ, Q.1",
        "severity": "high",
        "status": "confirmed",
        "upvote_count": 5,
        "user_upvoted": 0,
        "created_at": "2026-03-02T...",
        "updated_at": "2026-03-02T...",
        "reporter_name": "Trần Thị Bình",
        "reporter_avatar": null,
        "category_name": "Ổ gà / Hư hỏng mặt đường",
        "category_icon": "🕳️",
        "category_color": "#e74c3c",
        "image_count": 2,
        "thumbnail": "/uploads/reports/report-xxxxx-1.jpg"
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
        "address": "123 Nguyễn Huệ, Q.1",
        "severity": "high",
        "status": "confirmed",
        "upvote_count": 5,
        "created_at": "2026-03-02T...",
        "updated_at": "2026-03-02T...",
        "category_name": "Ổ gà / Hư hỏng mặt đường",
        "category_icon": "🕳️",
        "category_color": "#e74c3c",
        "image_count": 2,
        "thumbnail": "/uploads/reports/report-xxxxx-1.jpg"
      }
    ],
    "pagination": {
      "total": 3,
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
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #18 - GET `/api/reports/nearby`
> Lấy báo cáo gần 1 tọa độ

**Auth:** 🔓 Không yêu cầu

**Query Parameters (Bắt buộc):**
| Param | Type | Mô tả |
|-------|------|-------|
| latitude | number | Vĩ độ tâm |
| longitude | number | Kinh độ tâm |
| radius | number | Bán kính (km), mặc định: 5 |
| limit | number | Số lượng tối đa (mặc định: 50) |

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy báo cáo lân cận thành công.",
  "data": [
    {
      "report_id": "uuid-xxxx",
      "title": "Ổ gà lớn trên đường Nguyễn Huệ",
      "latitude": 10.7731,
      "longitude": 106.7030,
      "address": "123 Nguyễn Huệ, Q.1",
      "severity": "high",
      "status": "confirmed",
      "category_name": "Ổ gà / Hư hỏng mặt đường",
      "category_icon": "🕳️",
      "category_color": "#e74c3c",
      "distance_km": 0.54,
      "created_at": "2026-03-02T..."
    }
  ]
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 400 | Thiếu tọa độ | `{"success": false, "message": "Cần cung cấp latitude và longitude."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #19 - GET `/api/reports/map-data`
> Lấy dữ liệu marker cho bản đồ

**Auth:** 🔓 Không yêu cầu

**Query Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| status | string | Lọc trạng thái |
| category_id | number | Lọc danh mục |

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy dữ liệu bản đồ thành công.",
  "data": [
    {
      "report_id": "uuid-xxxx",
      "title": "Ổ gà lớn trên đường Nguyễn Huệ",
      "latitude": 10.7731,
      "longitude": 106.7030,
      "severity": "high",
      "status": "confirmed",
      "category_name": "Ổ gà / Hư hỏng mặt đường",
      "category_icon": "🕳️",
      "category_color": "#e74c3c",
      "upvote_count": 5,
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

## #20 - GET `/api/reports/:id`
> Xem chi tiết 1 báo cáo

**Auth:** 🔓 Tùy chọn (có đăng nhập → thấy `user_upvoted`)

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy thông tin báo cáo thành công.",
  "data": {
    "report_id": "uuid-xxxx",
    "title": "Ổ gà lớn trên đường Nguyễn Huệ",
    "description": "Ổ gà sâu khoảng 30cm...",
    "latitude": 10.7731,
    "longitude": 106.7030,
    "address": "123 Nguyễn Huệ, Q.1",
    "severity": "high",
    "status": "confirmed",
    "upvote_count": 5,
    "user_upvoted": 0,
    "created_at": "2026-03-02T...",
    "updated_at": "2026-03-02T...",
    "reporter": {
      "user_id": "uuid-xxxx",
      "full_name": "Trần Thị Bình",
      "avatar_url": null
    },
    "category": {
      "category_id": 1,
      "name": "Ổ gà / Hư hỏng mặt đường",
      "icon": "🕳️",
      "color": "#e74c3c"
    },
    "images": [
      {
        "image_id": "uuid-xxxx",
        "image_url": "/uploads/reports/report-xxxxx-1.jpg",
        "created_at": "2026-03-02T..."
      }
    ],
    "logs": [
      {
        "log_id": "uuid-xxxx",
        "action": "Xác nhận sự cố",
        "note": "Đã xác minh...",
        "proof_image_url": null,
        "handler_name": "Phạm Văn Cường",
        "created_at": "2026-03-02T..."
      }
    ]
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 404 | ID không tồn tại | `{"success": false, "message": "Không tìm thấy báo cáo."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #21 - POST `/api/reports`
> Tạo báo cáo sự cố mới

**Auth:** 🔒 Bắt buộc

**Body:** `multipart/form-data`
| Field | Type | Bắt buộc | Mô tả |
|-------|------|----------|-------|
| title | string | ✅ | Tiêu đề |
| description | string | ✅ | Mô tả chi tiết |
| category_id | number | ✅ | ID danh mục |
| latitude | number | ✅ | Vĩ độ |
| longitude | number | ✅ | Kinh độ |
| address | string | ❌ | Địa chỉ |
| severity | string | ❌ | `low`, `medium` (default), `high`, `critical` |
| images | File[] | ❌ | Tối đa 5 ảnh (jpg/png/gif, max 5MB/ảnh) |

### ✅ Thành công (201)
```json
{
  "success": true,
  "message": "Tạo báo cáo thành công.",
  "data": {
    "report_id": "uuid-xxxx",
    "title": "Cây đổ chắn đường",
    "description": "Cây lớn đổ ngang đường...",
    "category_id": 5,
    "latitude": 10.7800,
    "longitude": 106.6950,
    "address": "456 Lê Lợi, Q.1",
    "severity": "high",
    "status": "pending",
    "user_id": "uuid-xxxx",
    "upvote_count": 0,
    "created_at": "2026-03-03T...",
    "updated_at": "2026-03-03T...",
    "images": [
      {
        "image_id": "uuid-xxxx",
        "image_url": "/uploads/reports/report-xxxxx-1.jpg"
      }
    ]
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 400 | Thiếu trường bắt buộc | `{"success": false, "message": "Tiêu đề, mô tả, danh mục, vị trí là bắt buộc."}` |
| 400 | category_id không hợp lệ | `{"success": false, "message": "Danh mục không tồn tại."}` |
| 400 | File quá lớn/sai định dạng | `{"success": false, "message": "Chỉ cho phép upload ảnh (jpg, png, gif). Dung lượng tối đa 5MB mỗi file."}` |
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #22 - PUT `/api/reports/:id`
> Cập nhật báo cáo (chỉ chính chủ, chỉ khi `pending`)

**Auth:** 🔒 Bắt buộc (chính chủ)

**Body (JSON):**
```json
{
  "title": "Tiêu đề mới",
  "description": "Mô tả mới",
  "category_id": 2,
  "latitude": 10.78,
  "longitude": 106.69,
  "address": "Địa chỉ mới",
  "severity": "critical"
}
```

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Cập nhật báo cáo thành công.",
  "data": {
    "report_id": "uuid-xxxx",
    "title": "Tiêu đề mới",
    "description": "Mô tả mới",
    "category_id": 2,
    "latitude": 10.78,
    "longitude": 106.69,
    "address": "Địa chỉ mới",
    "severity": "critical",
    "status": "pending",
    "user_id": "uuid-xxxx",
    "upvote_count": 0,
    "created_at": "2026-03-02T...",
    "updated_at": "2026-03-03T..."
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 400 | Body rỗng | `{"success": false, "message": "Cần ít nhất 1 trường để cập nhật."}` |
| 400 | Đã xử lý (not pending) | `{"success": false, "message": "Chỉ có thể chỉnh sửa báo cáo đang chờ xử lý."}` |
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 403 | Không phải chính chủ | `{"success": false, "message": "Bạn chỉ có thể chỉnh sửa báo cáo của mình."}` |
| 404 | ID không tồn tại | `{"success": false, "message": "Không tìm thấy báo cáo."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #23 - PATCH `/api/reports/:id/status`
> Cập nhật trạng thái báo cáo

**Auth:** 🔒 Admin / Staff

**Body (JSON):**
```json
{
  "status": "confirmed",
  "note": "Đã xác minh tại hiện trường"
}
```
> `status` hợp lệ: `confirmed`, `in_progress`, `resolved`, `rejected`

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Cập nhật trạng thái thành công.",
  "data": {
    "report_id": "uuid-xxxx",
    "status": "confirmed",
    "updated_at": "2026-03-03T...",
    "log": {
      "log_id": "uuid-xxxx",
      "action": "Cập nhật trạng thái thành confirmed",
      "note": "Đã xác minh tại hiện trường",
      "handler_id": "uuid-xxxx",
      "created_at": "2026-03-03T..."
    }
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 400 | Thiếu status | `{"success": false, "message": "Trạng thái mới là bắt buộc."}` |
| 400 | Status không hợp lệ | `{"success": false, "message": "Trạng thái không hợp lệ. Cho phép: confirmed, in_progress, resolved, rejected"}` |
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 403 | Không phải admin/staff | `{"success": false, "message": "Bạn không có quyền thực hiện hành động này."}` |
| 404 | ID không tồn tại | `{"success": false, "message": "Không tìm thấy báo cáo."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #24 - POST `/api/reports/:id/upvote`
> Upvote / Bỏ upvote báo cáo (toggle)

**Auth:** 🔒 Bắt buộc

### ✅ Thành công - Upvote (200)
```json
{
  "success": true,
  "message": "Đã ủng hộ báo cáo.",
  "data": {
    "upvoted": true,
    "upvote_count": 6
  }
}
```

### ✅ Thành công - Bỏ upvote (200)
```json
{
  "success": true,
  "message": "Đã bỏ ủng hộ báo cáo.",
  "data": {
    "upvoted": false,
    "upvote_count": 5
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 404 | ID không tồn tại | `{"success": false, "message": "Không tìm thấy báo cáo."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #25 - POST `/api/reports/:id/images`
> Upload thêm ảnh cho báo cáo

**Auth:** 🔒 Bắt buộc (chính chủ)

**Body:** `multipart/form-data`
| Field | Type | Mô tả |
|-------|------|-------|
| images | File[] | Tối đa 5 ảnh (jpg/png/gif, max 5MB/ảnh) |

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Upload ảnh thành công.",
  "data": {
    "images": [
      {
        "image_id": "uuid-xxxx",
        "image_url": "/uploads/reports/report-xxxxx-3.jpg",
        "created_at": "2026-03-03T..."
      }
    ]
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 400 | Không chọn file | `{"success": false, "message": "Vui lòng chọn ít nhất 1 ảnh."}` |
| 400 | Quá giới hạn | `{"success": false, "message": "Báo cáo đã có X ảnh. Chỉ có thể thêm tối đa Y ảnh nữa."}` |
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 403 | Không phải chính chủ | `{"success": false, "message": "Bạn chỉ có thể thêm ảnh cho báo cáo của mình."}` |
| 404 | ID không tồn tại | `{"success": false, "message": "Không tìm thấy báo cáo."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #26 - DELETE `/api/reports/:id`
> Xóa báo cáo

**Auth:** 🔒 Chính chủ (khi `pending`) hoặc Admin

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
| 400 | Citizen nhưng status ≠ pending | `{"success": false, "message": "Chỉ có thể xóa báo cáo đang chờ xử lý."}` |
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 403 | Không phải chính chủ/admin | `{"success": false, "message": "Bạn không có quyền xóa báo cáo này."}` |
| 404 | ID không tồn tại | `{"success": false, "message": "Không tìm thấy báo cáo."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |
