# MyChurch Admin Panel

A browser-based admin panel for managing MyChurch app content.

## Features
- **Sermons** — Add/edit/delete sermons with audio upload through the API
- **Events** — Manage church events
- **Devotions, Clips, Groups, Bible Plan** — Manage core church content
- **Settings** — Update live stream state, verse of the day, and church profile
- **Authentication** — Email/password login through the Postgres-backed API

## Local Development

```bash
cd admin
npm install
cp .env.example .env
# Point VITE_API_BASE_URL to your local or deployed API
npm run dev
```

## Local Stack

Run the API stack from the repo root:

```bash
docker compose up -d --build
```

Default local admin login:

- email: `admin@mychurch.local`
- password: `changeme123`

## Deploy

The admin is a static Vite app. Any static host works as long as:

- `VITE_API_BASE_URL` points at the deployed backend
- the backend allows the deployed admin origin via CORS
- the admin user exists in the `users` table with `role = 'admin'` and `is_active = true`

## First-Time Setup

1. Start Postgres and the API with Docker.
2. Sign in with the seeded admin account or promote another account in Postgres.
3. Open the admin app and begin publishing content.

## How Content Flows

```
Admin Panel (web)  →  Express API  →  Postgres
                           ↓
                     Local/remote uploads
                           ↓
                       Mobile App
```

Admin changes content through the API, Postgres becomes the source of truth, and the mobile app reads the same data contract.
