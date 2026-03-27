/**
 * Gộp danh mục trùng tên (do seed nhiều lần tạo UUID khác nhau).
 * Loại dòng tên bị lỗi encoding (nhiều dấu ?).
 * Ưu tiên bản có chữ Unicode đúng (ít ký tự ? thay thế).
 */
function questionMarkCount(name) {
  return ((name || '').match(/\?/g) || []).length;
}

function nameQuality(name) {
  if (!name || typeof name !== 'string') return -1;
  const q = questionMarkCount(name);
  return 1000 - q * 200 + name.length * 0.01;
}

/** Tên có vẻ bị hỏng UTF-8 trong DB */
function isLikelyCorruptName(name) {
  return questionMarkCount(name) >= 3;
}

export function dedupeCategoriesByName(categories) {
  if (!Array.isArray(categories)) return [];
  const sane = categories.filter((c) => !isLikelyCorruptName(c.name));
  const map = new Map();
  for (const c of sane) {
    const raw = (c.name || '').trim();
    const key = raw.toLowerCase();
    if (!key) continue;
    const prev = map.get(key);
    if (!prev || nameQuality(c.name) > nameQuality(prev.name)) {
      map.set(key, c);
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', 'vi', { sensitivity: 'base' })
  );
}
