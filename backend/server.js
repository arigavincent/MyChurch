require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { OAuth2Client } = require('google-auth-library');

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const { query, withTransaction } = require('./lib/db');
const { runMigrations } = require('./lib/migrations');
const { BRAND_NAME, GIVING_ACCOUNT_REF } = require('./branding');
const {
  authenticate,
  PUBLIC_USER_FIELDS,
  requireAdmin,
  hashPassword,
  verifyPassword,
  signToken,
  sanitizeUser,
} = require('./lib/auth');
const { camelizeRow, serializeRows } = require('./lib/serializers');
const {
  prepareSermonInput,
  prepareDevotionInput,
  prepareClipInput,
  prepareEventInput,
  prepareGroupInput,
  prepareBiblePlanInput,
  prepareAppConfigInput,
  prepareVerseOfDayInput,
  preparePrayerRequestInput,
  preparePrayerCommentInput,
  prepareTestimonyInput,
  prepareReadingProgressInput,
  prepareUserProgressInput,
  prepareSermonNoteInput,
  prepareDonationInput,
  cleanText,
} = require('./lib/content');
const { createError } = require('./lib/errors');
const { getAccessToken, stkPush, queryStatus } = require('./mpesa');

const app = express();
app.set('trust proxy', 1);
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const uploadsDir = path.join(__dirname, 'uploads');
const publicDir = path.join(__dirname, 'public');
const adminPublicDir = path.join(publicDir, 'admin');
const sermonAudioUploadsDir = path.join(uploadsDir, 'sermons', 'audio');
const sermonVideoUploadsDir = path.join(uploadsDir, 'sermons', 'video');
const clipVideoUploadsDir = path.join(uploadsDir, 'clips', 'video');
const googleClientIds = cleanText(process.env.GOOGLE_CLIENT_IDS)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const googleAuthClient = new OAuth2Client();

[sermonAudioUploadsDir, sermonVideoUploadsDir, clipVideoUploadsDir].forEach((directory) => {
  fs.mkdirSync(directory, { recursive: true });
});

app.use(cors({
  origin: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(uploadsDir));
app.get('/privacy-policy', (_req, res) => {
  res.sendFile(path.join(publicDir, 'privacy-policy.html'));
});

function createUpload(relativeDirectory, options = {}) {
  const {
    allowedExtensions = [],
    allowedMimePrefix = '',
    label = 'Media',
    maxSizeMb = 250,
  } = options;

  let storage;

  if (process.env.CLOUDINARY_CLOUD_NAME) {
    storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: async (req, file) => {
        const isVideo = file.mimetype?.startsWith('video/');
        const isAudio = file.mimetype?.startsWith('audio/');
        
        return {
          folder: `church-app/${relativeDirectory.replace(/\\/g, '/')}`,
          resource_type: (isVideo || isAudio) ? 'video' : 'auto',
          public_id: `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
          // Explicitly set format for videos to ensure .mp4 extensions in URLs
          format: isVideo ? 'mp4' : undefined,
        };
      },
    });
  } else {
    storage = multer.diskStorage({
      destination: (_req, _file, callback) => callback(null, path.join(uploadsDir, relativeDirectory)),
      filename: (_req, file, callback) => {
        const extension = path.extname(file.originalname || '').toLowerCase();
        callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
      },
    });
  }

  return multer({
    storage,
    limits: {
      fileSize: maxSizeMb * 1024 * 1024,
    },
    fileFilter: (_req, file, callback) => {
      const extension = path.extname(file.originalname || '').toLowerCase();
      const isMimeAllowed = allowedMimePrefix ? file.mimetype?.startsWith(allowedMimePrefix) : true;
      const isExtensionAllowed = allowedExtensions.length === 0 || allowedExtensions.includes(extension);

      if (!isMimeAllowed && !isExtensionAllowed) {
        callback(createError(400, `${label} file type is not supported`));
        return;
      }

      callback(null, true);
    },
  });
}

const sermonAudioUpload = createUpload(path.join('sermons', 'audio'), {
  allowedExtensions: ['.mp3', '.m4a', '.aac', '.wav', '.ogg'],
  allowedMimePrefix: 'audio/',
  label: 'Audio',
  maxSizeMb: 80,
});

const sermonVideoUpload = createUpload(path.join('sermons', 'video'), {
  allowedExtensions: ['.mp4', '.m4v', '.mov', '.webm'],
  allowedMimePrefix: 'video/',
  label: 'Video',
  maxSizeMb: 300,
});

const clipVideoUpload = createUpload(path.join('clips', 'video'), {
  allowedExtensions: ['.mp4', '.m4v', '.mov', '.webm'],
  allowedMimePrefix: 'video/',
  label: 'Video',
  maxSizeMb: 200,
});

const ADMIN_RESOURCES = {
  sermons: {
    table: 'sermons',
    orderBy: 'published_at DESC',
    prepare: prepareSermonInput,
  },
  devotions: {
    table: 'devotions',
    orderBy: 'published_at DESC',
    prepare: prepareDevotionInput,
  },
  clips: {
    table: 'short_clips',
    orderBy: 'published_at DESC',
    prepare: prepareClipInput,
  },
  events: {
    table: 'events',
    orderBy: 'starts_at ASC',
    prepare: prepareEventInput,
  },
  groups: {
    table: 'groups',
    orderBy: 'name ASC',
    prepare: prepareGroupInput,
  },
  'bible-plan': {
    table: 'bible_plan',
    orderBy: 'day ASC',
    prepare: prepareBiblePlanInput,
  },
};

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function buildInsertStatement(table, payload) {
  const entries = Object.entries(payload);
  const columns = entries.map(([key]) => key);
  const placeholders = entries.map((_, index) => `$${index + 1}`);
  return {
    sql: `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
    values: entries.map(([, value]) => value),
  };
}

function buildUpdateStatement(table, id, payload) {
  const entries = Object.entries(payload);
  if (entries.length === 0) {
    throw createError(400, 'Nothing to update');
  }

  const setters = entries.map(([key], index) => `${key} = $${index + 1}`);
  return {
    sql: `UPDATE ${table} SET ${setters.join(', ')}, updated_at = NOW() WHERE id = $${entries.length + 1} RETURNING *`,
    values: [...entries.map(([, value]) => value), id],
  };
}

function getPublicApiBaseUrl(req) {
  const configured = cleanText(process.env.PUBLIC_API_BASE_URL);
  if (configured) return configured.replace(/\/$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

function buildUploadUrl(req, relativePath) {
  return `${getPublicApiBaseUrl(req)}/uploads/${relativePath.replace(/\\/g, '/')}`;
}

function normalizeUploadUrl(req, value) {
  const text = cleanText(value);
  if (!text || !text.includes('/uploads/')) return value;

  const publicBase = getPublicApiBaseUrl(req);

  if (text.startsWith('/uploads/')) {
    return `${publicBase}${text}`;
  }

  try {
    const parsed = new URL(text);
    if (parsed.pathname.startsWith('/uploads/')) {
      return `${publicBase}${parsed.pathname}${parsed.search || ''}${parsed.hash || ''}`;
    }
  } catch (_error) {
    const uploadIndex = text.indexOf('/uploads/');
    if (uploadIndex >= 0) {
      return `${publicBase}${text.slice(uploadIndex)}`;
    }
  }

  return value;
}

function normalizePublicUrls(req, value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizePublicUrls(req, item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, innerValue]) => [key, normalizePublicUrls(req, innerValue)])
    );
  }

  if (typeof value === 'string') {
    return normalizeUploadUrl(req, value);
  }

  return value;
}

function serializeRowForRequest(req, row) {
  return normalizePublicUrls(req, camelizeRow(row));
}

function serializeRowsForRequest(req, rows) {
  return rows.map((row) => serializeRowForRequest(req, row));
}

async function listRows(req, table, orderBy) {
  const result = await query(`SELECT * FROM ${table} ORDER BY ${orderBy}`);
  return serializeRowsForRequest(req, result.rows);
}

async function getRowById(table, id) {
  const result = await query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
  return result.rows[0] ? camelizeRow(result.rows[0]) : null;
}

async function upsertSingleRow(table, payload) {
  const entries = Object.entries(payload);
  const setters = entries.map(([key], index) => `${key} = $${index + 1}`);
  const values = entries.map(([, value]) => value);
  const result = await query(
    `UPDATE ${table} SET ${setters.join(', ')}, updated_at = NOW() WHERE id = 1 RETURNING *`,
    values
  );
  return camelizeRow(result.rows[0]);
}

async function seedAdminUser() {
  const adminEmail = cleanText(process.env.ADMIN_EMAIL);
  const adminPassword = cleanText(process.env.ADMIN_PASSWORD);
  const adminName = cleanText(process.env.ADMIN_NAME) || 'Local Admin';

  if (!adminEmail || !adminPassword) {
    return;
  }

  const existing = await query('SELECT id FROM users WHERE email = $1', [adminEmail]);
  const passwordHash = await hashPassword(adminPassword);

  if (existing.rowCount === 0) {
    await query(
      `
        INSERT INTO users (email, password_hash, name, role, is_active)
        VALUES ($1, $2, $3, 'admin', true)
      `,
      [adminEmail, passwordHash, adminName]
    );
    return;
  }

  await query(
    `
      UPDATE users
      SET password_hash = $2, name = $3, role = 'admin', is_active = true, auth_provider = 'local', updated_at = NOW()
      WHERE email = $1
    `,
    [adminEmail, passwordHash, adminName]
  );
}

async function maybePromoteFirstUser(userId) {
  if (process.env.NODE_ENV === 'production') return;

  const totalUsers = await query('SELECT COUNT(*)::INT AS count FROM users');
  if (totalUsers.rows[0].count !== 1) return;

  await query(
    `UPDATE users SET role = 'admin', is_active = true, updated_at = NOW() WHERE id = $1`,
    [userId]
  );
}

async function verifyGoogleIdentity(idToken) {
  if (!idToken) {
    throw createError(400, 'Google sign-in token is required');
  }

  if (googleClientIds.length === 0) {
    throw createError(503, 'Google sign-in is not configured on the server');
  }

  let ticket;
  try {
    ticket = await googleAuthClient.verifyIdToken({
      idToken,
      audience: googleClientIds,
    });
  } catch (_error) {
    throw createError(401, 'Google sign-in could not be verified');
  }

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw createError(401, 'Google account details are incomplete');
  }

  if (payload.email_verified !== true) {
    throw createError(403, 'Google account email must be verified');
  }

  return payload;
}

async function getDashboardPayload(req) {
  const countsResult = await query(`
    SELECT
      (SELECT COUNT(*)::INT FROM sermons) AS sermons,
      (SELECT COUNT(*)::INT FROM bible_plan) AS bible_plan,
      (SELECT COUNT(*)::INT FROM devotions) AS devotions,
      (SELECT COUNT(*)::INT FROM short_clips) AS short_clips,
      (SELECT COUNT(*)::INT FROM events) AS events,
      (SELECT COUNT(*)::INT FROM groups) AS groups
  `);

  const recentResult = await query(`
    SELECT id, title, speaker AS meta, 'sermon' AS type, published_at AS sort_date
    FROM sermons
    UNION ALL
    SELECT id, title, reference AS meta, 'devotion' AS type, published_at AS sort_date
    FROM devotions
    UNION ALL
    SELECT id, title, location AS meta, 'event' AS type, starts_at AS sort_date
    FROM events
    UNION ALL
    SELECT id, title, NULL::TEXT AS meta, 'clip' AS type, published_at AS sort_date
    FROM short_clips
    ORDER BY sort_date DESC
    LIMIT 8
  `);

  const configResult = await query('SELECT * FROM app_config WHERE id = 1');

  return {
    counts: camelizeRow(countsResult.rows[0]),
    recent: serializeRowsForRequest(req, recentResult.rows),
    config: camelizeRow(configResult.rows[0]),
  };
}

async function getHomePayload(req) {
  const [configResult, verseResult, latestDevotion, latestSermon, clips, events] = await Promise.all([
    query('SELECT * FROM app_config WHERE id = 1'),
    query('SELECT * FROM verse_of_day WHERE id = 1'),
    query('SELECT * FROM devotions ORDER BY published_at DESC LIMIT 1'),
    query('SELECT * FROM sermons ORDER BY published_at DESC LIMIT 1'),
    query('SELECT * FROM short_clips ORDER BY published_at DESC LIMIT 3'),
    query('SELECT * FROM events WHERE starts_at >= NOW() ORDER BY starts_at ASC LIMIT 3'),
  ]);

  return {
    appConfig: configResult.rows[0] ? camelizeRow(configResult.rows[0]) : null,
    verse: verseResult.rows[0] ? camelizeRow(verseResult.rows[0]) : null,
    latestDevotion: latestDevotion.rows[0] ? serializeRowForRequest(req, latestDevotion.rows[0]) : null,
    latestSermon: latestSermon.rows[0] ? serializeRowForRequest(req, latestSermon.rows[0]) : null,
    clips: serializeRowsForRequest(req, clips.rows),
    events: serializeRowsForRequest(req, events.rows),
  };
}

async function listPrayerRequests(req) {
  const result = await query(`
    SELECT
      prayer_requests.*,
      COALESCE(
        ARRAY_REMOVE(ARRAY_AGG(prayer_request_prayers.device_id), NULL),
        ARRAY[]::TEXT[]
      ) AS prayed_by
    FROM prayer_requests
    LEFT JOIN prayer_request_prayers
      ON prayer_request_prayers.request_id = prayer_requests.id
    GROUP BY prayer_requests.id
    ORDER BY prayer_requests.created_at DESC
  `);

  return serializeRowsForRequest(req, result.rows);
}

async function getPrayerComments(req, requestId) {
  const result = await query(
    `
      SELECT *
      FROM prayer_comments
      WHERE request_id = $1
      ORDER BY created_at ASC
    `,
    [requestId]
  );

  return serializeRowsForRequest(req, result.rows);
}

async function updateDonationByCheckoutId(checkoutRequestId, updates) {
  if (!checkoutRequestId) return false;

  const entries = Object.entries(updates);
  if (entries.length === 0) return false;

  const setters = entries.map(([key], index) => `${key} = $${index + 1}`);
  const values = entries.map(([, value]) => value);
  const result = await query(
    `
      UPDATE donations
      SET ${setters.join(', ')}, updated_at = NOW()
      WHERE checkout_request_id = $${entries.length + 1}
      RETURNING id
    `,
    [...values, checkoutRequestId]
  );

  return result.rowCount > 0;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const email = cleanText(req.body.email).toLowerCase();
  const password = cleanText(req.body.password);
  const name = cleanText(req.body.name) || null;

  if (!email || !password) {
    throw createError(400, 'Email and password are required');
  }

  if (password.length < 6) {
    throw createError(400, 'Password must be at least 6 characters');
  }

  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount > 0) {
    throw createError(409, 'Email already exists');
  }

  const passwordHash = await hashPassword(password);
  const created = await query(
    `
      INSERT INTO users (email, password_hash, name, auth_provider)
      VALUES ($1, $2, $3, 'local')
      RETURNING ${PUBLIC_USER_FIELDS}
    `,
    [email, passwordHash, name]
  );

  await maybePromoteFirstUser(created.rows[0].id);
  const refreshed = await query(
    `
      SELECT ${PUBLIC_USER_FIELDS}
      FROM users
      WHERE id = $1
    `,
    [created.rows[0].id]
  );

  const user = sanitizeUser(refreshed.rows[0]);
  res.status(201).json({
    token: signToken(user),
    user,
  });
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const email = cleanText(req.body.email).toLowerCase();
  const password = cleanText(req.body.password);

  if (!email || !password) {
    throw createError(400, 'Email and password are required');
  }

  const result = await query(
    `
      SELECT ${PUBLIC_USER_FIELDS}, password_hash
      FROM users
      WHERE email = $1
    `,
    [email]
  );

  const user = result.rows[0];
  if (!user) {
    throw createError(401, 'Invalid email or password');
  }

  if (!user.password_hash) {
    if (user.google_sub) {
      throw createError(400, 'This account uses Google sign-in. Continue with Google to access it.');
    }
    throw createError(400, 'Password sign-in is not available for this account');
  }

  if (!(await verifyPassword(password, user.password_hash))) {
    throw createError(401, 'Invalid email or password');
  }

  if (!user.is_active) {
    throw createError(403, 'Account inactive');
  }

  const safeUser = sanitizeUser(user);
  res.json({
    token: signToken(safeUser),
    user: safeUser,
  });
}));

app.post('/api/auth/google', asyncHandler(async (req, res) => {
  const idToken = cleanText(req.body.idToken);
  const googleIdentity = await verifyGoogleIdentity(idToken);
  const email = cleanText(googleIdentity.email).toLowerCase();
  const name = cleanText(googleIdentity.name) || null;
  const avatarUrl = cleanText(googleIdentity.picture) || null;
  const googleSub = cleanText(googleIdentity.sub);

  const user = await withTransaction(async (client) => {
    const existingByGoogle = await client.query(
      `SELECT ${PUBLIC_USER_FIELDS}, password_hash FROM users WHERE google_sub = $1`,
      [googleSub]
    );
    const existingByEmail = existingByGoogle.rowCount > 0
      ? null
      : await client.query(`SELECT ${PUBLIC_USER_FIELDS}, password_hash FROM users WHERE email = $1`, [email]);

    const existingUser = existingByGoogle.rows[0] || existingByEmail?.rows[0] || null;

    if (existingUser) {
      const nextProvider = existingUser.password_hash ? 'hybrid' : 'google';
      const updated = await client.query(
        `
          UPDATE users
          SET
            email = $1,
            name = COALESCE($2, name),
            avatar_url = $3,
            google_sub = $4,
            auth_provider = $5,
            is_active = true,
            updated_at = NOW()
          WHERE id = $6
          RETURNING ${PUBLIC_USER_FIELDS}
        `,
        [email, name, avatarUrl, googleSub, nextProvider, existingUser.id]
      );

      return updated.rows[0];
    }

    const created = await client.query(
      `
        INSERT INTO users (email, name, avatar_url, google_sub, auth_provider)
        VALUES ($1, $2, $3, $4, 'google')
        RETURNING ${PUBLIC_USER_FIELDS}
      `,
      [email, name, avatarUrl, googleSub]
    );

    return created.rows[0];
  });

  await maybePromoteFirstUser(user.id);
  const refreshed = await query(
    `
      SELECT ${PUBLIC_USER_FIELDS}
      FROM users
      WHERE id = $1
    `,
    [user.id]
  );
  const safeUser = sanitizeUser(refreshed.rows[0]);

  res.json({
    token: signToken(safeUser),
    user: safeUser,
  });
}));

app.get('/api/auth/me', authenticate, asyncHandler(async (req, res) => {
  res.json({ user: req.user });
}));

app.put('/api/auth/me', authenticate, asyncHandler(async (req, res) => {
  const name = cleanText(req.body.name) || null;
  const updated = await query(
    `
      UPDATE users
      SET name = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING ${PUBLIC_USER_FIELDS}
    `,
    [name, req.user.id]
  );

  res.json({ user: sanitizeUser(updated.rows[0]) });
}));

app.get('/api/app/home', asyncHandler(async (req, res) => {
  res.json(await getHomePayload(req));
}));

app.get('/api/app/config', asyncHandler(async (_req, res) => {
  const result = await query('SELECT * FROM app_config WHERE id = 1');
  res.json({ config: camelizeRow(result.rows[0]) });
}));

app.get('/api/app/verse-of-day', asyncHandler(async (_req, res) => {
  const result = await query('SELECT * FROM verse_of_day WHERE id = 1');
  res.json({ verse: result.rows[0] ? camelizeRow(result.rows[0]) : null });
}));

app.get('/api/app/sermons', asyncHandler(async (req, res) => {
  const type = cleanText(req.query.type);
  const params = [];
  let whereClause = '';

  if (type && type !== 'all') {
    params.push(type);
    whereClause = 'WHERE media_type = $1';
  }

  const result = await query(
    `SELECT * FROM sermons ${whereClause} ORDER BY published_at DESC`,
    params
  );

  res.json({ sermons: serializeRowsForRequest(req, result.rows) });
}));

app.get('/api/app/devotions', asyncHandler(async (req, res) => {
  res.json({ devotions: await listRows(req, 'devotions', 'published_at DESC') });
}));

app.get('/api/app/clips', asyncHandler(async (req, res) => {
  res.json({ clips: await listRows(req, 'short_clips', 'published_at DESC') });
}));

app.get('/api/app/events', asyncHandler(async (req, res) => {
  res.json({ events: await listRows(req, 'events', 'starts_at ASC') });
}));

app.get('/api/app/groups', asyncHandler(async (req, res) => {
  res.json({ groups: await listRows(req, 'groups', 'name ASC') });
}));

app.get('/api/app/bible-plan', asyncHandler(async (req, res) => {
  res.json({ plans: await listRows(req, 'bible_plan', 'day ASC') });
}));

app.get('/api/app/testimonies', asyncHandler(async (req, res) => {
  res.json({ testimonies: await listRows(req, 'testimonies', 'created_at DESC') });
}));

app.get('/api/app/prayer-requests', asyncHandler(async (req, res) => {
  res.json({ requests: await listPrayerRequests(req) });
}));

app.get('/api/app/prayer-requests/:requestId/comments', asyncHandler(async (req, res) => {
  res.json({ comments: await getPrayerComments(req, req.params.requestId) });
}));

app.post('/api/app/testimonies', asyncHandler(async (req, res) => {
  const payload = prepareTestimonyInput(req.body);
  const statement = buildInsertStatement('testimonies', payload);
  const result = await query(statement.sql, statement.values);
  res.status(201).json({ testimony: camelizeRow(result.rows[0]) });
}));

app.post('/api/app/prayer-requests', asyncHandler(async (req, res) => {
  const payload = preparePrayerRequestInput(req.body);
  const result = await query(
    `
      INSERT INTO prayer_requests (name, request, urgency, pray_count, created_at, updated_at)
      VALUES ($1, $2, $3, 0, NOW(), NOW())
      RETURNING *
    `,
    [payload.name, payload.request, payload.urgency]
  );
  res.status(201).json({ request: camelizeRow({ ...result.rows[0], prayed_by: [] }) });
}));

app.post('/api/app/prayer-comments', asyncHandler(async (req, res) => {
  const payload = preparePrayerCommentInput(req.body);
  const result = await query(
    `
      INSERT INTO prayer_comments (request_id, name, text)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [payload.request_id, payload.name, payload.text]
  );
  res.status(201).json({ comment: camelizeRow(result.rows[0]) });
}));

app.post('/api/app/prayer-requests/:requestId/pray', asyncHandler(async (req, res) => {
  const requestId = req.params.requestId;
  const deviceId = cleanText(req.body.deviceId);

  if (!deviceId) {
    throw createError(400, 'deviceId is required');
  }

  const updated = await withTransaction(async (client) => {
    const existing = await client.query(
      `
        SELECT 1
        FROM prayer_request_prayers
        WHERE request_id = $1 AND device_id = $2
      `,
      [requestId, deviceId]
    );

    if (existing.rowCount === 0) {
      await client.query(
        `
          INSERT INTO prayer_request_prayers (request_id, device_id)
          VALUES ($1, $2)
        `,
        [requestId, deviceId]
      );

      await client.query(
        `
          UPDATE prayer_requests
          SET pray_count = pray_count + 1, updated_at = NOW()
          WHERE id = $1
        `,
        [requestId]
      );
    }

    const refreshed = await client.query(`
      SELECT
        prayer_requests.*,
        COALESCE(
          ARRAY_REMOVE(ARRAY_AGG(prayer_request_prayers.device_id), NULL),
          ARRAY[]::TEXT[]
        ) AS prayed_by
      FROM prayer_requests
      LEFT JOIN prayer_request_prayers
        ON prayer_request_prayers.request_id = prayer_requests.id
      WHERE prayer_requests.id = $1
      GROUP BY prayer_requests.id
    `, [requestId]);

    return refreshed.rows[0];
  });

  res.json({ request: camelizeRow(updated) });
}));

app.get('/api/me/reading-progress', authenticate, asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT * FROM reading_progress WHERE user_id = $1',
    [req.user.id]
  );

  res.json({
    progress: result.rows[0]
      ? camelizeRow(result.rows[0])
      : { userId: req.user.id, completed: {}, updatedAt: null },
  });
}));

app.put('/api/me/reading-progress', authenticate, asyncHandler(async (req, res) => {
  const payload = prepareReadingProgressInput(req.user.id, req.body);
  const result = await query(
    `
      INSERT INTO reading_progress (user_id, completed, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET completed = EXCLUDED.completed, updated_at = NOW()
      RETURNING *
    `,
    [payload.user_id, payload.completed]
  );

  res.json({ progress: camelizeRow(result.rows[0]) });
}));

app.get('/api/me/user-progress', authenticate, asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT * FROM user_progress WHERE user_id = $1',
    [req.user.id]
  );

  res.json({
    progress: result.rows[0]
      ? camelizeRow(result.rows[0])
      : { userId: req.user.id, completedDevotions: [], updatedAt: null },
  });
}));

app.put('/api/me/user-progress', authenticate, asyncHandler(async (req, res) => {
  const payload = prepareUserProgressInput(req.user.id, req.body);
  const result = await query(
    `
      INSERT INTO user_progress (user_id, completed_devotions, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET completed_devotions = EXCLUDED.completed_devotions, updated_at = NOW()
      RETURNING *
    `,
    [payload.user_id, payload.completed_devotions]
  );

  res.json({ progress: camelizeRow(result.rows[0]) });
}));

app.get('/api/me/sermon-notes', authenticate, asyncHandler(async (req, res) => {
  const sermonId = cleanText(req.query.sermonId);
  if (!sermonId) {
    throw createError(400, 'sermonId is required');
  }

  const result = await query(
    `
      SELECT *
      FROM sermon_notes
      WHERE user_id = $1 AND sermon_id = $2
      ORDER BY created_at DESC
    `,
    [req.user.id, sermonId]
  );

  res.json({ notes: serializeRows(result.rows) });
}));

app.post('/api/me/sermon-notes', authenticate, asyncHandler(async (req, res) => {
  const payload = prepareSermonNoteInput(req.user.id, req.body);
  const result = await query(
    `
      INSERT INTO sermon_notes (sermon_id, user_id, text)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [payload.sermon_id, payload.user_id, payload.text]
  );

  res.status(201).json({ note: camelizeRow(result.rows[0]) });
}));

app.put('/api/me/sermon-notes/:noteId', authenticate, asyncHandler(async (req, res) => {
  const text = cleanText(req.body.text);
  if (!text) {
    throw createError(400, 'text is required');
  }

  const result = await query(
    `
      UPDATE sermon_notes
      SET text = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `,
    [text, req.params.noteId, req.user.id]
  );

  if (result.rowCount === 0) {
    throw createError(404, 'Note not found');
  }

  res.json({ note: camelizeRow(result.rows[0]) });
}));

app.delete('/api/me/sermon-notes/:noteId', authenticate, asyncHandler(async (req, res) => {
  const result = await query(
    'DELETE FROM sermon_notes WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.noteId, req.user.id]
  );

  if (result.rowCount === 0) {
    throw createError(404, 'Note not found');
  }

  res.status(204).end();
}));

app.post('/api/me/donations', authenticate, asyncHandler(async (req, res) => {
  const payload = prepareDonationInput(req.user.id, req.body);
  const result = await query(
    `
      INSERT INTO donations (
        owner_id, amount, method, frequency, status, phone, checkout_request_id, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `,
    [
      payload.owner_id,
      payload.amount,
      payload.method,
      payload.frequency,
      payload.status,
      payload.phone,
      payload.checkout_request_id,
    ]
  );

  res.status(201).json({ donation: camelizeRow(result.rows[0]) });
}));

app.get('/api/me/donations', authenticate, asyncHandler(async (req, res) => {
  const result = await query(
    `
      SELECT *
      FROM donations
      WHERE owner_id = $1
      ORDER BY created_at DESC
    `,
    [req.user.id]
  );

  res.json({ donations: serializeRows(result.rows) });
}));

app.get('/api/admin/dashboard', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  res.json(await getDashboardPayload(req));
}));

Object.entries(ADMIN_RESOURCES).forEach(([route, config]) => {
  app.get(`/api/admin/${route}`, authenticate, requireAdmin, asyncHandler(async (req, res) => {
    res.json({ items: await listRows(req, config.table, config.orderBy) });
  }));

  app.post(`/api/admin/${route}`, authenticate, requireAdmin, asyncHandler(async (req, res) => {
    const payload = config.prepare(req.body);
    const statement = buildInsertStatement(config.table, payload);
    const result = await query(statement.sql, statement.values);
    res.status(201).json({ item: serializeRowForRequest(req, result.rows[0]) });
  }));

  app.put(`/api/admin/${route}/:id`, authenticate, requireAdmin, asyncHandler(async (req, res) => {
    const payload = config.prepare(req.body);
    const statement = buildUpdateStatement(config.table, req.params.id, payload);
    const result = await query(statement.sql, statement.values);
    if (result.rowCount === 0) {
      throw createError(404, 'Item not found');
    }
    res.json({ item: serializeRowForRequest(req, result.rows[0]) });
  }));

  app.delete(`/api/admin/${route}/:id`, authenticate, requireAdmin, asyncHandler(async (req, res) => {
    const result = await query(
      `DELETE FROM ${config.table} WHERE id = $1 RETURNING id`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      throw createError(404, 'Item not found');
    }

    res.status(204).end();
  }));
});

app.get('/api/admin/config/app', authenticate, requireAdmin, asyncHandler(async (_req, res) => {
  const result = await query('SELECT * FROM app_config WHERE id = 1');
  res.json({ config: camelizeRow(result.rows[0]) });
}));

app.put('/api/admin/config/app', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const config = await upsertSingleRow('app_config', prepareAppConfigInput(req.body));
  res.json({ config });
}));

app.get('/api/admin/config/verse-of-day', authenticate, requireAdmin, asyncHandler(async (_req, res) => {
  const result = await query('SELECT * FROM verse_of_day WHERE id = 1');
  res.json({ verse: result.rows[0] ? camelizeRow(result.rows[0]) : null });
}));

app.put('/api/admin/config/verse-of-day', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const verse = await upsertSingleRow('verse_of_day', prepareVerseOfDayInput(req.body));
  res.json({ verse });
}));

app.post('/api/admin/uploads/sermons/audio', authenticate, requireAdmin, (req, res, next) => {
  sermonAudioUpload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Audio upload error:', err);
      return next(err);
    }
    next();
  });
}, asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError(400, 'Audio file is required');
  }

  const url = req.file.path || buildUploadUrl(req, path.join('sermons', 'audio', req.file.filename));

  res.status(201).json({
    url,
    fileName: req.file.filename || req.file.public_id,
  });
}));

app.post('/api/admin/uploads/sermons/video', authenticate, requireAdmin, (req, res, next) => {
  sermonVideoUpload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Video upload error:', err);
      return next(err);
    }
    next();
  });
}, asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError(400, 'Video file is required');
  }

  const url = req.file.path || buildUploadUrl(req, path.join('sermons', 'video', req.file.filename));

  res.status(201).json({
    url,
    fileName: req.file.filename || req.file.public_id,
  });
}));

app.post('/api/admin/uploads/clips/video', authenticate, requireAdmin, (req, res, next) => {
  clipVideoUpload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Clip upload error:', err);
      return next(err);
    }
    next();
  });
}, asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError(400, 'Video file is required');
  }

  const url = req.file.path || buildUploadUrl(req, path.join('clips', 'video', req.file.filename));

  res.status(201).json({
    url,
    fileName: req.file.filename || req.file.public_id,
  });
}));

app.post('/api/mpesa/stkpush', asyncHandler(async (req, res) => {
  const { phone, amount, accountRef, frequency, ownerId } = req.body;
  if (!phone || !amount) {
    throw createError(400, 'Phone and amount required');
  }

  const token = await getAccessToken();
  const result = await stkPush(token, phone, amount, accountRef || GIVING_ACCOUNT_REF);

  res.json({
    success: true,
    ownerId: ownerId || null,
    frequency: frequency || 'one-time',
    checkoutRequestId: result.CheckoutRequestID || '',
    providerResult: result,
  });
}));

app.post('/api/mpesa/callback', asyncHandler(async (req, res) => {
  const callback = req.body?.Body?.stkCallback;
  const checkoutRequestId = callback?.CheckoutRequestID;

  if (callback?.ResultCode === 0) {
    await updateDonationByCheckoutId(checkoutRequestId, {
      status: 'completed',
      receipt_number: callback.CallbackMetadata?.Item?.find((item) => item.Name === 'MpesaReceiptNumber')?.Value || '',
      provider_payload: callback,
    });
  } else {
    await updateDonationByCheckoutId(checkoutRequestId, {
      status: 'failed',
      failure_reason: callback?.ResultDesc || 'Payment failed',
      provider_payload: callback || null,
    });
  }

  res.json({ ResultCode: 0, ResultDesc: 'Received' });
}));

app.post('/api/mpesa/status', asyncHandler(async (req, res) => {
  const checkoutRequestId = cleanText(req.body.checkoutRequestId);
  if (!checkoutRequestId) {
    throw createError(400, 'checkoutRequestId required');
  }

  const token = await getAccessToken();
  const result = await queryStatus(token, checkoutRequestId);
  res.json(result);
}));

if (fs.existsSync(adminPublicDir)) {
  app.use('/admin', express.static(adminPublicDir));
  app.get(['/admin', '/admin/*'], (_req, res) => {
    res.sendFile(path.join(adminPublicDir, 'index.html'));
  });
}

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  if (status >= 500) {
    console.error(error);
  }
  res.status(status).json({ error: error.message || 'Server error' });
});

async function start() {
  await runMigrations();
  await seedAdminUser();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`${BRAND_NAME} API running on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start backend', error);
  process.exit(1);
});
