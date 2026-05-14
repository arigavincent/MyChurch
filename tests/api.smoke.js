const fs = require('node:fs');
const path = require('node:path');

function parseEnvFile(filePath) {
  const values = {};
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    values[key] = value;
  }
  return values;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const envPath = path.join(__dirname, '..', 'backend', '.env');
const env = fs.existsSync(envPath) ? parseEnvFile(envPath) : {};
const API_BASE = (process.env.API_BASE_URL || env.PUBLIC_API_BASE_URL || 'http://localhost:4100').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || env.ADMIN_EMAIL || 'admin@mychurch.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || env.ADMIN_PASSWORD || 'changeme123';

async function request(route, options = {}) {
  const headers = {
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${route}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${route} failed: ${payload.error || response.statusText}`);
  }
  return payload;
}

async function main() {
  const health = await request('/health');
  assert(health.ok === true, 'Health endpoint did not return ok=true');

  const home = await request('/api/app/home');
  assert(home && typeof home === 'object', 'Home payload was not returned');

  const email = `smoke-${Date.now()}@example.com`;
  const password = 'smoketest123';
  const registration = await request('/api/auth/register', {
    method: 'POST',
    body: {
      email,
      password,
      name: 'Smoke Test',
    },
  });

  assert(registration.token, 'Register response did not include a token');

  const me = await request('/api/auth/me', {
    token: registration.token,
  });
  assert(me.user?.email === email, 'Authenticated user lookup did not match registered email');

  const donation = await request('/api/me/donations', {
    method: 'POST',
    token: registration.token,
    body: {
      amount: 100,
      phone: '0712345678',
      method: 'mpesa',
      frequency: 'one-time',
      status: 'pending',
    },
  });
  assert(donation.donation?.amount === 100, 'Donation insert did not return expected amount');

  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    },
  });
  assert(adminLogin.token, 'Admin login did not return a token');

  const dashboard = await request('/api/admin/dashboard', {
    token: adminLogin.token,
  });
  assert(dashboard.counts && typeof dashboard.counts === 'object', 'Admin dashboard payload was missing counts');

  console.log(`API smoke test passed for ${API_BASE}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
