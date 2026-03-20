# Cấu trúc theo MVC (frontend)

Áp dụng cho các tính năng phức tạp (ví dụ **chi tiết sự cố**).

| Lớp | Thư mục | Trách nhiệm |
|-----|---------|-------------|
| **Model** | `features/<tên>/model/` | Dữ liệu, quy tắc nghiệp vụ thuần (không React), chuẩn hóa text/ảnh/API origin. |
| **Controller** | `features/<tên>/controller/` | Hook hoặc class: gọi API, state, điều phối; không chứa markup lớn. |
| **View** | `features/<tên>/view/` | Component JSX + Tailwind: chỉ nhận props và hiển thị. |
| **Page** | `src/pages/` | Gắn `react-router`, khởi tạo controller, render View. |

**Backend** Express vẫn là MVC riêng: `routes` ≈ controller, `mysql` queries ≈ model.

## Ví dụ: `report-detail`

- `model/reportDetailModel.js` — tên danh mục (fallback UTF-8), ảnh, timeline labels.
- `controller/useReportDetailController.js` — `reportsAPI`, `categoriesAPI`, chỉ đường VietMap.
- `view/ReportDetailView.jsx` — layout giống bản thiết kế Material + surface.

Mở rộng: tạo thư mục `features/<feature-mới>/` với cùng 3 lớp và một Page mỏng.
