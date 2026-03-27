import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import VietMap from '../components/VietMap';
import { reportsAPI, categoriesAPI } from '../services/api';
import { FileText, MapPin, ImagePlus, Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CreateReportPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', category_id: '',
  });
  const [location, setLocation] = useState(null);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    categoriesAPI.getAll().then((res) => setCategories(res.data || [])).catch(() => {});
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation({ lat: 10.7750, lng: 106.6977 }),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setLocation({ lat: 10.7750, lng: 106.6977 });
    }
  }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  useEffect(
    () => () => {
      previews.forEach((u) => URL.revokeObjectURL(u));
    },
    [previews]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) { setError('Vui lòng chọn vị trí trên bản đồ'); return; }
    if (!form.category_id) { setError('Vui lòng chọn danh mục sự cố'); return; }

    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('category_id', form.category_id);
      fd.append('latitude', location.lat);
      fd.append('longitude', location.lng);
      images.forEach((img) => fd.append('images', img));

      const res = await reportsAPI.create(fd);
      setSuccess(res.message || 'Đã gửi báo cáo thành công');
      setTimeout(() => navigate(`/report/${res.data.report_id}`), 1500);
    } catch (err) {
      setError(err.message || 'Tạo báo cáo thất bại');
    }
    setLoading(false);
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-on-surface placeholder:text-slate-400 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-10 space-y-8 pb-16">
      {/* Page header — đồng bộ tone dashboard */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-primary/5 via-white to-surface-container-low p-6 md:p-10 shadow-sm">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <FileText className="h-3.5 w-3.5" />
              Báo cáo mới
            </div>
            <h1 className="font-display text-3xl font-black tracking-tight text-on-surface md:text-4xl">
              Tạo báo cáo sự cố
            </h1>
            <p className="max-w-xl text-on-surface-variant text-base md:text-lg">
              Chọn danh mục, mô tả hiện trường, đính kèm ảnh và xác định vị trí trên bản đồ.
            </p>
          </div>
          {user && (
            <p className="text-sm text-slate-500 md:text-right">
              Đăng nhập: <span className="font-semibold text-on-surface">{user.full_name}</span>
            </p>
          )}
        </div>
      </section>

      {error && (
        <div
          className="flex items-start gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-error"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800"
          role="status"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 space-y-6 rounded-2xl border border-slate-200/80 bg-surface-container-lowest p-6 shadow-sm md:p-8"
        >
          <div className="space-y-2">
            <label htmlFor="title" className="flex items-center gap-2 text-sm font-bold text-on-surface">
              Tiêu đề <span className="text-error">*</span>
            </label>
            <input
              id="title"
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className={inputClass}
              placeholder="VD: Hố ga mất nắp trên đường Nguyễn Huệ"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category_id" className="flex items-center gap-2 text-sm font-bold text-on-surface">
              Danh mục sự cố <span className="text-error">*</span>
            </label>
            <select
              id="category_id"
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className={inputClass}
              required
            >
              <option value="">— Chọn danh mục —</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">
              Danh mục được gộp theo tên; nếu thiếu mục, cần cập nhật dữ liệu trên máy chủ.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="flex items-center gap-2 text-sm font-bold text-on-surface">
              Mô tả chi tiết <span className="text-error">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              className={`${inputClass} min-h-[140px] resize-y`}
              placeholder="Mô tả hiện trạng, mức độ, ảnh hưởng..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-on-surface">
              <ImagePlus className="h-4 w-4 text-primary" />
              Ảnh hiện trường (tối đa 5)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-container"
            />
            {previews.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {previews.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Xem trước ${i + 1}`}
                    className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-surface-container-low/50 p-4">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="font-bold text-on-surface">Vị trí trên bản đồ</p>
                <p className="mt-1 text-on-surface-variant">
                  {location
                    ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                    : 'Đang lấy vị trí...'}
                </p>
                <p className="mt-2 text-xs text-slate-500">Bấm bản đồ hoặc kéo marker để chỉnh.</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-primary-container disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Gửi báo cáo
              </>
            )}
          </button>
        </form>

        <div className="lg:col-span-7 flex flex-col gap-3 min-h-0">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-on-surface">Bản đồ</h2>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">VietMap</span>
          </div>
          <div className="flex-1 min-h-[360px] overflow-hidden rounded-2xl border border-slate-200 shadow-md lg:min-h-[520px]">
            <VietMap
              reports={[]}
              selectedLocation={location}
              onMapClick={(loc) => setLocation(loc)}
              zoom={14}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
