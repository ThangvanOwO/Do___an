/**
 * Proxy VietMap Route API — tránh CORS trình duyệt, giữ API key ở server (ưu tiên env).
 */
import { Router } from 'express';

const router = Router();

/** Trùng key mặc định trên frontend map tiles (chỉ dev; production nên đặt VIETMAP_API_KEY) */
const FALLBACK_VIETMAP_KEY = '57a5a77555b7aef0739b533e3cd94eaa993ce8bcc6af834a';

/** Rút gọn HTML/text từ VietMap (423 thường trả trang lỗi HTML). */
function textSnippet(raw, max = 240) {
  if (!raw || typeof raw !== 'string') return '';
  const plain = raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length <= max ? plain : `${plain.slice(0, max)}…`;
}

function vietmapHttpErrorPayload(status, bodyText) {
  const snippet = textSnippet(bodyText);
  /** 423 Locked — VietMap/WAF: key không có Route, gói hết hạn, hoặc bị chặn */
  if (status === 423) {
    return {
      code: 'SERVICE_LOCKED',
      messages: [
        'VietMap trả HTTP 423 (Locked): key thường chưa được cấp quyền Route API, gói Maps API hết hạn, hoặc tài khoản/dịch vụ bị khóa.',
        'Cách xử lý: đăng nhập VietMap Maps API → kiểm tra gói có bật Routing → tạo key mới → đặt biến VIETMAP_API_KEY trong backend/.env và khởi động lại server.',
        snippet ? `Chi tiết từ máy chủ: ${snippet}` : null,
      ]
        .filter(Boolean)
        .join(' '),
      paths: [],
      _httpStatus: 423,
    };
  }
  if (status === 401 || status === 403) {
    return {
      code: 'INVALID_KEY',
      messages: `VietMap HTTP ${status}: API key không hợp lệ hoặc không được phép gọi Route.${snippet ? ` ${snippet}` : ''}`,
      paths: [],
      _httpStatus: status,
    };
  }
  if (status === 429) {
    return {
      code: 'OVER_DAILY_LIMIT',
      messages: `VietMap HTTP 429: quá nhiều yêu cầu. Thử lại sau hoặc nâng gói.${snippet ? ` ${snippet}` : ''}`,
      paths: [],
      _httpStatus: 429,
    };
  }
  return {
    code: 'HTTP_ERROR',
    messages: [`VietMap HTTP ${status} (không phải JSON).`, snippet].filter(Boolean).join(' — '),
    paths: [],
    _httpStatus: status,
  };
}

router.get('/route', async (req, res) => {
  try {
    const { olat, olng, dlat, dlng, vehicle = 'motorcycle' } = req.query;
    const lat1 = parseFloat(olat);
    const lng1 = parseFloat(olng);
    const lat2 = parseFloat(dlat);
    const lng2 = parseFloat(dlng);

    if (![lat1, lng1, lat2, lng2].every((n) => Number.isFinite(n))) {
      return res.status(200).json({
        code: 'INVALID_REQUEST',
        messages: 'Thiếu hoặc sai tham số: olat, olng, dlat, dlng (số thực).',
        paths: [],
      });
    }

    const allowed = new Set(['car', 'motorcycle', 'truck']);
    const v = allowed.has(String(vehicle)) ? String(vehicle) : 'motorcycle';

    const apikey = process.env.VIETMAP_API_KEY || FALLBACK_VIETMAP_KEY;
    const params = new URLSearchParams({
      apikey,
      points_encoded: 'true',
      vehicle: v,
    });
    params.append('point', `${lat1},${lng1}`);
    params.append('point', `${lat2},${lng2}`);

    const url = `https://maps.vietmap.vn/api/route/v3?${params.toString()}`;
    const r = await fetch(url);
    const text = await r.text();

    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (!r.ok) {
      try {
        const j = text ? JSON.parse(text) : {};
        if (j && typeof j === 'object' && (j.code || j.messages || j.message)) {
          return res.status(200).json({
            code: j.code || 'ERROR_UNKNOWN',
            messages:
              typeof j.messages === 'string'
                ? j.messages
                : typeof j.message === 'string'
                  ? j.message
                  : JSON.stringify(j.messages || j),
            paths: Array.isArray(j.paths) ? j.paths : [],
            _httpStatus: r.status,
          });
        }
      } catch {
        /* không phải JSON */
      }
      return res.status(200).json(vietmapHttpErrorPayload(r.status, text));
    }

    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {
        code: 'ERROR_UNKNOWN',
        messages: `VietMap trả về không phải JSON dù HTTP ${r.status} OK.${textSnippet(text) ? ` ${textSnippet(text)}` : ''}`,
        paths: [],
      };
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(200).json({
      code: 'ERROR_UNKNOWN',
      messages: e?.message || 'Lỗi khi gọi VietMap Route.',
      paths: [],
    });
  }
});

export default router;
