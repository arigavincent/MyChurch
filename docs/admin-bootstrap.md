# Admin Bootstrap

The admin console now authenticates against the backend and reads admin access from the `users` table in Postgres.

## Access model

A user can access the admin console only when both of these columns are set on their row:

- `role = 'admin'`
- `is_active = true`

## Local first-time setup

1. Start the local stack:

```bash
docker compose up -d --build
```

2. Sign in to the admin console with the seeded local account from `backend/.env`.

Default values:

- email: `admin@mychurch.local`
- password: `changeme123`

3. If you want to promote a different account, update it in Postgres:

```bash
docker compose exec postgres psql -U mychurch -d mychurch -c "UPDATE users SET role = 'admin', is_active = true WHERE email = 'you@example.com';"
```

## Important notes

- The backend seeds the local admin from `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME`.
- In non-production mode, the very first registered user may also be promoted automatically when no users exist yet.
- If the admin console shows an access message, verify the account row in `users`.

## Related config

- Mobile app env template: `.env.example`
- Admin env template: `admin/.env.example`
- Backend env template: `backend/.env.example`
- Shared schema contract: `docs/data-model.md`
- Database migration: `backend/migrations/001_init.sql`
