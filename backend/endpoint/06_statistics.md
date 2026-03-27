# 📊 6. STATISTICS - Thống kê

> Base: `/api/statistics`
> Các endpoint trả `{success,message,data}` khi thành công và `{success:false,message}` khi lỗi.

---

## #31 - GET `/api/statistics/overview`
> Thống kê tổng quan hệ thống

**Auth:** 🔒 Admin only (`authorize('admin')`)

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy thống kê tổng quan thành công.",
  "data": {
    "total_users": 7,
    "total_reports": 25,
    "total_categories": 8,
    "completion_rate": "24.0%",
    "reports_by_status": [
      { "status": "pending", "count": 8 },
      { "status": "in_progress", "count": 4 }
    ],
    "monthly_reports": [
      { "month": "2025-04", "total": 12, "completed": 6 }
    ],
    "users_by_role": [
      { "role": "admin", "count": 2 },
      { "role": "citizen", "count": 5 }
    ]
  }
}
```

### ❌ Thất bại
- `401/403`: theo middleware `authenticate/authorize`
- `500`: `Lỗi server.`

---

## #32 - GET `/api/statistics/by-category`
> Thống kê theo danh mục

**Auth:** 🔒 Admin hoặc Staff (`authorize('admin','staff')`)

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Thống kê theo danh mục thành công.",
  "data": [
    {
      "category_id": "uuid-xxxx",
      "name": "Hạ tầng",
      "priority_level": 1,
      "total_reports": 2,
      "pending": 1,
      "in_progress": 0,
      "completed": 1,
      "cancelled": 0
    }
  ]
}
```

### ❌ Thất bại
- `401/403`: theo middleware
- `500`: `Lỗi server.`

---

## #33 - GET `/api/statistics/by-status`
> Thống kê theo trạng thái

**Auth:** 🔒 Admin hoặc Staff (`authorize('admin','staff')`)

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Thống kê theo trạng thái thành công.",
  "data": [
    { "status": "pending", "count": 8, "label": "Chờ tiếp nhận" },
    { "status": "in_progress", "count": 4, "label": "Đang xử lý" }
  ]
}
```

### ❌ Thất bại
- `401/403`: theo middleware
- `500`: `Lỗi server.`

---

## #34 - GET `/api/statistics/heatmap`
> Dữ liệu heatmap (tọa độ + weight)

**Auth:** Không yêu cầu

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy N điểm heatmap.",
  "data": [
    { "lat": 10.77, "lng": 106.70, "weight": 2 }
  ]
}
```

### ❌ Thất bại
- `500`: `Lỗi server.`

---

## #35 - GET `/api/statistics/top-reporters`
> Top người báo cáo nhiều nhất

**Auth:** 🔒 Admin only (`authorize('admin')`)

**Query Parameters:**
- `limit` (number, mặc định `10`)

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy danh sách người báo cáo nhiều nhất.",
  "data": [
    {
      "user_id": "uuid-xxxx",
      "full_name": "...",
      "avatar_url": null,
      "role": "citizen",
      "total_reports": 8,
      "completed_reports": 3
    }
  ]
}
```

### ❌ Thất bại
- `401/403`: theo middleware
- `500`: `Lỗi server.`

---

## #36 - GET `/api/statistics/recent-activity`
> Hoạt động gần đây trên hệ thống

**Auth:** 🔒 Admin hoặc Staff (`authorize('admin','staff')`)

**Query Parameters:**
- `limit` (number, mặc định `20`)

### ✅ Thành công (200)
```json
{
  "success": true,
  "message": "Lấy hoạt động gần đây thành công.",
  "data": {
    "recent_reports": [
      { "report_id": "...", "title": "...", "status": "pending", "created_at": "...", "reporter_name": "...", "category_name": "..." }
    ],
    "recent_logs": [
      { "log_id": "...", "old_status": "...", "new_status": "...", "updated_at": "...", "staff_name": "...", "report_title": "..." }
    ]
  }
}
```

### ❌ Thất bại
- `401/403`: theo middleware
- `500`: `Lỗi server.`

