import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

function getDefaultApiBase() {
  if (Platform.OS === 'android') return 'http://10.0.2.2:4100';
  return 'http://localhost:4100';
}

export const API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || getDefaultApiBase()).replace(/\/$/, '');
const TOKEN_KEY = '@mychurch_api_token';

function normalizeUser(user) {
  if (!user) return null;
  return {
    ...user,
    authProvider: user.authProvider || (user.googleSub ? 'google' : 'local'),
    uid: user.id,
  };
}

export async function getStoredToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setStoredToken(token) {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }
}

export async function clearStoredToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}, config = {}) {
  const token = config.token || (config.auth === false ? '' : await getStoredToken());
  const headers = new Headers(options.headers || {});

  if (!config.isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (config.auth !== false && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (_error) {
    throw new Error('Could not reach the server. Check that the backend is running and your device can reach it.');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }
  return payload;
}

export async function registerUser(email, password, name = '') {
  const payload = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  }, { auth: false });

  await setStoredToken(payload.token);
  return {
    token: payload.token,
    user: normalizeUser(payload.user),
  };
}

export async function loginUser(email, password) {
  const payload = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, { auth: false });

  await setStoredToken(payload.token);
  return {
    token: payload.token,
    user: normalizeUser(payload.user),
  };
}

export async function loginWithGoogleToken(idToken) {
  const payload = await request('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  }, { auth: false });

  await setStoredToken(payload.token);
  return {
    token: payload.token,
    user: normalizeUser(payload.user),
  };
}

export async function fetchCurrentUser() {
  const payload = await request('/api/auth/me');
  return normalizeUser(payload.user);
}

export async function updateCurrentUser(body) {
  const payload = await request('/api/auth/me', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return normalizeUser(payload.user);
}

export async function fetchHomePayload() {
  return request('/api/app/home', {}, { auth: false });
}

export async function fetchAppConfig() {
  const payload = await request('/api/app/config', {}, { auth: false });
  return payload.config;
}

export async function fetchVerseOfDay() {
  const payload = await request('/api/app/verse-of-day', {}, { auth: false });
  return payload.verse;
}

export async function fetchSermons(type = 'all') {
  const suffix = type && type !== 'all' ? `?type=${encodeURIComponent(type)}` : '';
  const payload = await request(`/api/app/sermons${suffix}`, {}, { auth: false });
  return payload.sermons || [];
}

export async function fetchDevotions() {
  const payload = await request('/api/app/devotions', {}, { auth: false });
  return payload.devotions || [];
}

export async function fetchClips() {
  const payload = await request('/api/app/clips', {}, { auth: false });
  return payload.clips || [];
}

export async function fetchEvents() {
  const payload = await request('/api/app/events', {}, { auth: false });
  return payload.events || [];
}

export async function fetchGroups() {
  const payload = await request('/api/app/groups', {}, { auth: false });
  return payload.groups || [];
}

export async function fetchBiblePlan() {
  const payload = await request('/api/app/bible-plan', {}, { auth: false });
  return payload.plans || [];
}

export async function fetchTestimonies() {
  const payload = await request('/api/app/testimonies', {}, { auth: false });
  return payload.testimonies || [];
}

export async function createTestimony(body) {
  return request('/api/app/testimonies', {
    method: 'POST',
    body: JSON.stringify(body),
  }, { auth: false });
}

export async function fetchPrayerRequests() {
  const payload = await request('/api/app/prayer-requests', {}, { auth: false });
  return payload.requests || [];
}

export async function fetchPrayerComments(requestId) {
  const payload = await request(`/api/app/prayer-requests/${requestId}/comments`, {}, { auth: false });
  return payload.comments || [];
}

export async function createPrayerRequest(body) {
  return request('/api/app/prayer-requests', {
    method: 'POST',
    body: JSON.stringify(body),
  }, { auth: false });
}

export async function createPrayerComment(body) {
  return request('/api/app/prayer-comments', {
    method: 'POST',
    body: JSON.stringify(body),
  }, { auth: false });
}

export async function prayForRequest(requestId, deviceId) {
  return request(`/api/app/prayer-requests/${requestId}/pray`, {
    method: 'POST',
    body: JSON.stringify({ deviceId }),
  }, { auth: false });
}

export async function fetchReadingProgress() {
  const payload = await request('/api/me/reading-progress');
  return payload.progress;
}

export async function saveReadingProgress(completed) {
  const payload = await request('/api/me/reading-progress', {
    method: 'PUT',
    body: JSON.stringify({ completed }),
  });
  return payload.progress;
}

export async function fetchUserProgress() {
  const payload = await request('/api/me/user-progress');
  return payload.progress;
}

export async function saveUserProgress(completedDevotions) {
  const payload = await request('/api/me/user-progress', {
    method: 'PUT',
    body: JSON.stringify({ completedDevotions }),
  });
  return payload.progress;
}

export async function fetchSermonNotes(sermonId) {
  const payload = await request(`/api/me/sermon-notes?sermonId=${encodeURIComponent(sermonId)}`);
  return payload.notes || [];
}

export async function createSermonNote(body) {
  const payload = await request('/api/me/sermon-notes', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return payload.note;
}

export async function createDonation(body) {
  const payload = await request('/api/me/donations', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return payload.donation;
}

export async function fetchDonations() {
  const payload = await request('/api/me/donations');
  return payload.donations || [];
}
