# MyChurch API Backend

This backend now owns authentication, content CRUD, M-Pesa initiation, uploads, and all reads and writes to Postgres.

## Local setup

### 1. Configure env

```bash
cp backend/.env.example backend/.env
```

The default local database URL uses Docker on host port `5433`.

### 2. Start the stack

From the repo root:

```bash
docker compose up -d --build
```

Services:

- API: `http://localhost:4100`
- Postgres: `localhost:5433`
- Adminer: `http://localhost:8082`

### 3. Verify

```bash
curl http://localhost:4100/health
npm run smoke:api
```

## Local admin account

The backend seeds an admin user from `backend/.env`:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`

Defaults:

- email: `ariga.dev@gmail.com`
- password: `ariga123`

## API surface

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Public app data

- `GET /api/app/home`
- `GET /api/app/config`
- `GET /api/app/verse-of-day`
- `GET /api/app/sermons`
- `GET /api/app/devotions`
- `GET /api/app/clips`
- `GET /api/app/events`
- `GET /api/app/groups`
- `GET /api/app/bible-plan`
- `GET /api/app/testimonies`
- `POST /api/app/testimonies`
- `GET /api/app/prayer-requests`
- `POST /api/app/prayer-requests`
- `GET /api/app/prayer-requests/:requestId/comments`
- `POST /api/app/prayer-comments`
- `POST /api/app/prayer-requests/:requestId/pray`

### Authenticated user data

- `GET /api/me/reading-progress`
- `PUT /api/me/reading-progress`
- `GET /api/me/user-progress`
- `PUT /api/me/user-progress`
- `GET /api/me/sermon-notes`
- `POST /api/me/sermon-notes`
- `GET /api/me/donations`
- `POST /api/me/donations`

### Admin

- `GET /api/admin/dashboard`
- CRUD on:
  - `/api/admin/sermons`
  - `/api/admin/devotions`
  - `/api/admin/clips`
  - `/api/admin/events`
  - `/api/admin/groups`
  - `/api/admin/bible-plan`
- `GET|PUT /api/admin/config/app`
- `GET|PUT /api/admin/config/verse-of-day`
- `POST /api/admin/uploads/sermons/audio`

### M-Pesa

- `POST /api/mpesa/stkpush`
- `POST /api/mpesa/callback`
- `POST /api/mpesa/status`

## Production notes

- Set `MPESA_ENV=production` only with live Safaricom credentials.
- `PUBLIC_API_BASE_URL` must point to your deployed API origin so uploaded media URLs resolve correctly.
- Use HTTPS in production for M-Pesa callbacks and mobile clients.
