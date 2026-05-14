import { Platform } from 'react-native';
import { GIVING_ACCOUNT_REF } from '../branding';

function getDefaultApiBase() {
  if (Platform.OS === 'android') return 'http://10.0.2.2:4100';
  return 'http://localhost:4100';
}

const API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || getDefaultApiBase()).replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }
  return payload;
}

export async function initiateSTKPush({ phone, amount, frequency, ownerId }) {
  return request('/api/mpesa/stkpush', {
    method: 'POST',
    body: JSON.stringify({
      phone,
      amount,
      frequency,
      ownerId: ownerId || null,
      accountRef: GIVING_ACCOUNT_REF,
    }),
  });
}

export async function fetchPaymentStatus(checkoutRequestId) {
  return request('/api/mpesa/status', {
    method: 'POST',
    body: JSON.stringify({ checkoutRequestId }),
  });
}

export { API_BASE };
