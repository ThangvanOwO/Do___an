const API_BASE = 'http://localhost:5000/api';

function getHeaders(isJson = true) {
  const headers = {};
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (isJson) headers['Content-Type'] = 'application/json';
  return headers;
}

async function request(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

// ========== AUTH ==========
export const authAPI = {
  login: (body) => request('/auth/login', { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }),
  getMe: () => request('/auth/me', { headers: getHeaders() }),
  changePassword: (body) => request('/auth/change-password', { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }),
};

// ========== USERS ==========
export const usersAPI = {
  getAll: (params = '') => request(`/users${params}`, { headers: getHeaders() }),
  getById: (id) => request(`/users/${id}`, { headers: getHeaders() }),
  update: (id, body) => request(`/users/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }),
  remove: (id) => request(`/users/${id}`, { method: 'DELETE', headers: getHeaders() }),
  uploadAvatar: (id, formData) => request(`/users/${id}/avatar`, { method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: formData }),
};

// ========== CATEGORIES ==========
export const categoriesAPI = {
  getAll: (params = '') => request(`/categories${params}`),
  getById: (id) => request(`/categories/${id}`),
  create: (body) => request('/categories', { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }),
  update: (id, body) => request(`/categories/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }),
  remove: (id) => request(`/categories/${id}`, { method: 'DELETE', headers: getHeaders() }),
};

// ========== REPORTS ==========
export const reportsAPI = {
  getAll: (params = '') => request(`/reports${params}`, { headers: getHeaders() }),
  getById: (id) => request(`/reports/${id}`, { headers: getHeaders() }),
  getMyReports: (params = '') => request(`/reports/my-reports${params}`, { headers: getHeaders() }),
  getNearby: (lat, lng, radius = 5) => request(`/reports/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  getMapData: (params = '') => request(`/reports/map-data${params}`),
  create: (formData) => request('/reports', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: formData }),
  update: (id, body) => request(`/reports/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }),
  updateStatus: (id, body) => request(`/reports/${id}/status`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(body) }),
  uploadImages: (id, formData) => request(`/reports/${id}/images`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: formData }),
  remove: (id) => request(`/reports/${id}`, { method: 'DELETE', headers: getHeaders() }),
};

// ========== LOGS ==========
export const logsAPI = {
  getAll: (params = '') => request(`/logs${params}`, { headers: getHeaders() }),
  getByReport: (reportId) => request(`/logs/report/${reportId}`),
  create: (formData) => request('/logs', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: formData }),
  getById: (id) => request(`/logs/${id}`, { headers: getHeaders() }),
};

// ========== STATISTICS ==========
export const statisticsAPI = {
  getOverview: () => request('/statistics/overview', { headers: getHeaders() }),
  byCategory: () => request('/statistics/by-category', { headers: getHeaders() }),
  byStatus: () => request('/statistics/by-status', { headers: getHeaders() }),
  getHeatmap: (params = '') => request(`/statistics/heatmap${params}`),
  topReporters: (limit = 10) => request(`/statistics/top-reporters?limit=${limit}`, { headers: getHeaders() }),
  recentActivity: (limit = 20) => request(`/statistics/recent-activity?limit=${limit}`, { headers: getHeaders() }),
};

// ========== FLOODS (Ngập lụt) ==========
export const floodsAPI = {
  getAll: (params = '') => request(`/floods${params}`, { headers: getHeaders() }),
  getById: (id) => request(`/floods/${id}`, { headers: getHeaders() }),
  getMapData: (params = '') => request(`/floods/map-data${params}`),
  getNearby: (lat, lng, radius = 5) => request(`/floods/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  create: (formData) => request('/floods', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: formData }),
  resolve: (id) => request(`/floods/${id}/resolve`, { method: 'PATCH', headers: getHeaders() }),
  remove: (id) => request(`/floods/${id}`, { method: 'DELETE', headers: getHeaders() }),
};
