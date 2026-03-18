# 📊 6. STATISTICS - Thống kê (6 endpoints)

---

## #31 - GET `/api/statistics/overview`
> Thống kê tổng quan hệ thống

**Auth:** 🔒 Admin / Staff

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy thống kê tổng quan thành công.",
  "data": {
    "total_reports": 25,
    "total_users": 7,
    "total_categories": 8,
    "reports_by_status": {
      "pending": 8,
      "confirmed": 5,
      "in_progress": 4,
      "resolved": 6,
      "rejected": 2
    },
    "reports_this_month": 12,
    "reports_last_month": 8,
    "resolved_rate": 24.0,
    "avg_resolution_time_hours": 48.5
  }
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 403 | Không phải admin/staff | `{"success": false, "message": "Bạn không có quyền thực hiện hành động này."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #32 - GET `/api/statistics/by-category`
> Thống kê số báo cáo theo danh mục

**Auth:** 🔒 Admin / Staff

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy thống kê theo danh mục thành công.",
  "data": [
    {
      "category_id": 1,
      "name": "Ổ gà / Hư hỏng mặt đường",
      "icon": "🕳️",
      "color": "#e74c3c",
      "total": 5,
      "pending": 2,
      "confirmed": 1,
      "in_progress": 1,
      "resolved": 1,
      "rejected": 0
    },
    {
      "category_id": 2,
      "name": "Ngập nước / Thoát nước",
      "icon": "🌊",
      "color": "#3498db",
      "total": 3,
      "pending": 1,
      "confirmed": 0,
      "in_progress": 1,
      "resolved": 1,
      "rejected": 0
    }
  ]
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 403 | Không phải admin/staff | `{"success": false, "message": "Bạn không có quyền thực hiện hành động này."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #33 - GET `/api/statistics/by-status`
> Thống kê chi tiết theo trạng thái

**Auth:** 🔒 Admin / Staff

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy thống kê theo trạng thái thành công.",
  "data": [
    {
      "status": "pending",
      "count": 8,
      "percentage": 32.0
    },
    {
      "status": "confirmed",
      "count": 5,
      "percentage": 20.0
    },
    {
      "status": "in_progress",
      "count": 4,
      "percentage": 16.0
    },
    {
      "status": "resolved",
      "count": 6,
      "percentage": 24.0
    },
    {
      "status": "rejected",
      "count": 2,
      "percentage": 8.0
    }
  ]
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 403 | Không phải admin/staff | `{"success": false, "message": "Bạn không có quyền thực hiện hành động này."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #34 - GET `/api/statistics/heatmap`
> Lấy dữ liệu heatmap (tọa độ + mức độ)

**Auth:** 🔓 Không yêu cầu

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy dữ liệu heatmap thành công.",
  "data": [
    {
      "latitude": 10.7731,
      "longitude": 106.7030,
      "weight": 3,
      "status": "confirmed",
      "severity": "high"
    },
    {
      "latitude": 10.7800,
      "longitude": 106.6950,
      "weight": 1,
      "status": "pending",
      "severity": "medium"
    }
  ]
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #35 - GET `/api/statistics/top-reporters`
> Top người báo cáo nhiều nhất

**Auth:** 🔒 Admin / Staff

**Query Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| limit | number | Số lượng (mặc định: 10) |

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy top người báo cáo thành công.",
  "data": [
    {
      "user_id": "uuid-xxxx",
      "full_name": "Trần Thị Bình",
      "avatar_url": null,
      "total_reports": 8,
      "resolved_reports": 3,
      "total_upvotes": 15
    },
    {
      "user_id": "uuid-yyyy",
      "full_name": "Nguyễn Thị Lan",
      "avatar_url": null,
      "total_reports": 6,
      "resolved_reports": 2,
      "total_upvotes": 10
    }
  ]
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 403 | Không phải admin/staff | `{"success": false, "message": "Bạn không có quyền thực hiện hành động này."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |

---

## #36 - GET `/api/statistics/recent-activity`
> Hoạt động gần đây trên hệ thống

**Auth:** 🔒 Admin / Staff

**Query Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| limit | number | Số lượng (mặc định: 20) |

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy hoạt động gần đây thành công.",
  "data": [
    {
      "type": "report",
      "report_id": "uuid-xxxx",
      "title": "Cây đổ chắn đường",
      "action": "Báo cáo mới được tạo",
      "user_name": "Trần Thị Bình",
      "created_at": "2026-03-03T..."
    },
    {
      "type": "log",
      "log_id": "uuid-yyyy",
      "report_id": "uuid-zzzz",
      "title": "Ổ gà lớn trên đường Nguyễn Huệ",
      "action": "Xác nhận sự cố",
      "user_name": "Phạm Văn Cường",
      "created_at": "2026-03-02T..."
    }
  ]
}
```

### ❌ Thất bại
| Code | Trường hợp | Response |
|------|-----------|----------|
| 401 | Chưa đăng nhập | `{"success": false, "message": "Không có quyền truy cập. Vui lòng đăng nhập."}` |
| 403 | Không phải admin/staff | `{"success": false, "message": "Bạn không có quyền thực hiện hành động này."}` |
| 500 | Lỗi server | `{"success": false, "message": "Lỗi server."}` |
