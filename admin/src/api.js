const defaultApiBase = typeof window !== 'undefined'
  ? window.location.origin
  : 'http://localhost:4100';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || defaultApiBase).replace(/\/$/, '');
const TOKEN_KEY = 'mychurch_admin_token';

export function getAdminToken() {
  return window.localStorage.getItem(TOKEN_KEY) || '';
}

export function setAdminToken(token) {
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearAdminToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}, config = {}) {
  const token = config.token || getAdminToken();
  const headers = new Headers(options.headers || {});

  if (!config.isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (config.auth !== false && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload;
}

export async function loginAdmin(email, password) {
  const payload = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, { auth: false });

  setAdminToken(payload.token);
  return payload;
}

export async function fetchCurrentAdmin() {
  return request('/api/auth/me');
}

export async function fetchAdminDashboard() {
  return request('/api/admin/dashboard');
}

export async function listAdminItems(resource) {
  return request(`/api/admin/${resource}`);
}

export async function createAdminItem(resource, body) {
  return request(`/api/admin/${resource}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateAdminItem(resource, id, body) {
  return request(`/api/admin/${resource}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteAdminItem(resource, id) {
  return request(`/api/admin/${resource}/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchAdminAppConfig() {
  return request('/api/admin/config/app');
}

export async function saveAdminAppConfig(body) {
  return request('/api/admin/config/app', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function fetchAdminVerseOfDay() {
  return request('/api/admin/config/verse-of-day');
}

export async function saveAdminVerseOfDay(body) {
  return request('/api/admin/config/verse-of-day', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

async function uploadAdminFile(path, file) {
  const formData = new FormData();
  formData.append('file', file);

  return request(path, {
    method: 'POST',
    body: formData,
  }, { isFormData: true });
}

export async function uploadSermonAudio(file) {
  return uploadAdminFile('/api/admin/uploads/sermons/audio', file);
}

export async function uploadSermonVideo(file) {
  return uploadAdminFile('/api/admin/uploads/sermons/video', file);
}

export async function uploadClipVideo(file) {
  return uploadAdminFile('/api/admin/uploads/clips/video', file);
}

export { API_BASE };
