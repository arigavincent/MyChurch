# MyChurch Data Model

This project now uses Postgres as the shared source of truth for:

- the Expo mobile app
- the Vite admin console
- the Express API and M-Pesa backend

The canonical schema lives in `backend/migrations/001_init.sql`.
The shared payload builders live in `shared/contentModel.js`.

## Core content tables

### `sermons`

- `title`
- `speaker`
- `summary`
- `published_at`
- `duration_label`
- `audio_url`
- `video_url`
- `media_type`: `audio` | `video` | `hybrid`
- `featured`
- `artwork_url`
- `tags`
- `slug`
- `created_at`
- `updated_at`

At least one of `audio_url` or `video_url` must exist.

### `devotions`

- `title`
- `reference`
- `scripture_text`
- `body`
- `prayer`
- `published_at`
- `featured`
- `slug`
- `created_at`
- `updated_at`

### `short_clips`

- `title`
- `description`
- `video_url`
- `thumbnail_url`
- `published_at`
- `featured`
- `slug`
- `created_at`
- `updated_at`

### `events`

- `title`
- `summary`
- `location`
- `category`
- `starts_at`
- `ends_at`
- `featured`
- `registration_url`
- `slug`
- `created_at`
- `updated_at`

### `groups`

- `name`
- `leader`
- `description`
- `meeting_time_label`
- `location`
- `contact_phone`
- `category`
- `featured`
- `slug`
- `created_at`
- `updated_at`

### `bible_plan`

- `day`
- `title`
- `reference`
- `summary`
- `created_at`
- `updated_at`

## Singleton config tables

### `app_config`

- `church_name`
- `tagline`
- `city`
- `country`
- `primary_contact_email`
- `primary_contact_phone`
- `address`
- `youtube_url`
- `instagram_url`
- `facebook_url`
- `whatsapp_url`
- `live_stream_id`
- `live_stream_enabled`
- `hero_headline`
- `hero_subheadline`
- `updated_at`

### `verse_of_day`

- `text`
- `reference`
- `theme`
- `updated_at`

## Community tables

### `prayer_requests`

- `name`
- `request`
- `urgency`
- `pray_count`
- `created_at`
- `updated_at`

### `prayer_request_prayers`

- `request_id`
- `device_id`
- `created_at`

### `prayer_comments`

- `request_id`
- `name`
- `text`
- `created_at`

### `testimonies`

- `name`
- `testimony`
- `created_at`

## User and account tables

### `users`

- `email`
- `password_hash`
- `name`
- `role`
- `is_active`
- `created_at`
- `updated_at`

### `reading_progress`

- `user_id`
- `completed` as JSONB
- `updated_at`

### `user_progress`

- `user_id`
- `completed_devotions` as `TEXT[]`
- `updated_at`

### `donations`

- `owner_id`
- `amount`
- `method`
- `frequency`
- `status`
- `phone`
- `checkout_request_id`
- `mpesa_receipt_number`
- `provider_payload` as JSONB
- `created_at`
- `updated_at`

### `sermon_notes`

- `user_id`
- `sermon_id`
- `text`
- `created_at`
- `updated_at`

## Implementation rules

- Add or edit content through the builders in `shared/contentModel.js`.
- Preserve the API contract between camelCase payloads and snake_case database columns.
- Keep optional fields omitted instead of persisting empty strings.
- Do not add a new table or field without updating:
  - `backend/migrations/001_init.sql`
  - `backend/lib/content.js`
  - `shared/contentModel.js` when admin/mobile write the entity
  - the corresponding admin and mobile surfaces
