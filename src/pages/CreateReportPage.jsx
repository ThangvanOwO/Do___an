import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import VietMap from '../components/VietMap';
import { reportsAPI, categoriesAPI } from '../services/api';

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
    categoriesAPI.getAll().then(res => setCategories(res.data)).catch(() => {});
    // Lấy vị trí hiện tại
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation({ lat: 10.7750, lng: 106.6977 }),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setLocation({ lat: 10.7750, lng: 106.6977 });
    }
  }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

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
      images.forEach(img => fd.append('images', img));

      const res = await reportsAPI.create(fd);
      setSuccess(res.message);
      setTimeout(() => navigate(`/report/${res.data.report_id}`), 1500);
    } catch (err) {
      setError(err.message || 'Tạo báo cáo thất bại');
    }
    setLoading(false);
  };

  return (
    <div className="create-report-page">
      <h2>📝 Tạo báo cáo sự cố mới</h2>
      <p className="page-desc">Chụp ảnh, chọn vị trí, gửi báo cáo trong 30 giây!</p>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="create-report-layout">
        <form onSubmit={handleSubmit} className="report-form">
          <div className="form-group">
            <label>Tiêu đề sự cố *</label>
            <input type="text" name="title" value={form.title} onChange={handleChange}
              placeholder="VD: Hố ga mất nắp trên đường Nguyễn Huệ" required />
          </div>

          <div className="form-group">
            <label>Danh mục sự cố *</label>
            <select name="category_id" value={form.category_id} onChange={handleChange} required>
              <option value="">-- Chọn danh mục --</option>
              {categories.map(c => (
                <option key={c.category_id} value={c.category_id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Mô tả chi tiết *</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Mô tả hiện trạng sự cố, mức độ nghiêm trọng, ảnh hưởng..." rows={4} required />
          </div>

          <div className="form-group">
            <label>📷 Ảnh hiện trường (tối đa 5 ảnh)</label>
            <input type="file" accept="image/*" multiple onChange={handleImageChange} />
            {previews.length > 0 && (
              <div className="image-previews">
                {previews.map((src, i) => <img key={i} src={src} alt={`preview-${i}`} />)}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>📍 Vị trí: {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'Chưa chọn'}</label>
            <p className="hint">Bấm vào bản đồ để chọn vị trí hoặc kéo marker</p>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? '⏳ Đang gửi...' : '🚀 Gửi báo cáo'}
          </button>
        </form>

        <div className="map-side">
          <VietMap
            reports={[]}
            selectedLocation={location}
            onMapClick={(loc) => setLocation(loc)}
            zoom={14}
          />
        </div>
      </div>
    </div>
  );
}
