const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('./db');
const { camelizeRow } = require('./serializers');

const JWT_SECRET = process.env.JWT_SECRET || 'replace-me-in-production';
const TOKEN_TTL = process.env.JWT_TTL || '30d';
const PUBLIC_USER_FIELDS = 'id, email, name, role, is_active, created_at, updated_at, google_sub, avatar_url, auth_provider';

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function sanitizeUser(row) {
  if (!row) return null;
  const safe = { ...row };
  delete safe.password_hash;
  return camelizeRow(safe);
}

async function loadUserById(id) {
  const result = await query(
    `
      SELECT ${PUBLIC_USER_FIELDS}, password_hash
      FROM users
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await loadUserById(payload.sub);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Account unavailable' });
    }

    req.user = sanitizeUser(user);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin' || req.user.isActive !== true) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

module.exports = {
  authenticate,
  requireAdmin,
  hashPassword,
  PUBLIC_USER_FIELDS,
  verifyPassword,
  signToken,
  sanitizeUser,
};
