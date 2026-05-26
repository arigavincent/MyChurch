const LOCAL_API_BASE = (process.env.LOCAL_API_BASE || 'http://127.0.0.1:4100').replace(/\/$/, '');
const REMOTE_API_BASE = (process.env.REMOTE_API_BASE || 'https://shekinah-sons-backend.onrender.com').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ariga.dev@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ariga123';

function isLocalUploadUrl(value) {
  if (!value || typeof value !== 'string') return false;
  return (
    value.includes('/uploads/') ||
    value.includes('127.0.0.1') ||
    value.includes('localhost') ||
    value.includes('192.168.') ||
    value.includes('10.0.2.2')
  );
}

function isPublishableSermon(sermon) {
  return !isLocalUploadUrl(sermon.audioUrl) && !isLocalUploadUrl(sermon.videoUrl);
}

function sortByPublishedAt(items) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.publishedAt || left.startsAt || 0).getTime();
    const rightTime = new Date(right.publishedAt || right.startsAt || 0).getTime();
    return leftTime - rightTime;
  });
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${path}: ${payload.error || 'Request failed'}`);
  }

  return payload;
}

async function loginAdmin() {
  const payload = await request(REMOTE_API_BASE, '/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!payload.token) {
    throw new Error('Remote admin login did not return a token.');
  }

  return payload.token;
}

async function authenticated(path, token, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return request(REMOTE_API_BASE, path, {
    ...options,
    headers,
  });
}

async function fetchLocalContent() {
  const [home, sermons, devotions, clips, events] = await Promise.all([
    request(LOCAL_API_BASE, '/api/app/home'),
    request(LOCAL_API_BASE, '/api/app/sermons'),
    request(LOCAL_API_BASE, '/api/app/devotions'),
    request(LOCAL_API_BASE, '/api/app/clips'),
    request(LOCAL_API_BASE, '/api/app/events'),
  ]);

  return {
    appConfig: home.appConfig,
    verse: home.verse,
    sermons: (sermons.sermons || []).filter(isPublishableSermon),
    devotions: devotions.devotions || [],
    clips: clips.clips || [],
    events: events.events || [],
  };
}

function sermonPayload(sermon) {
  return {
    title: sermon.title,
    speaker: sermon.speaker,
    summary: sermon.summary,
    publishedAt: sermon.publishedAt,
    durationLabel: sermon.durationLabel,
    audioUrl: sermon.audioUrl,
    videoUrl: sermon.videoUrl,
    featured: sermon.featured,
    artworkUrl: sermon.artworkUrl,
    tags: sermon.tags || [],
    slug: sermon.slug,
  };
}

function devotionPayload(devotion) {
  return {
    title: devotion.title,
    reference: devotion.reference,
    scriptureText: devotion.scriptureText,
    body: devotion.body,
    prayer: devotion.prayer,
    publishedAt: devotion.publishedAt,
    featured: devotion.featured,
    slug: devotion.slug,
  };
}

function clipPayload(clip) {
  return {
    title: clip.title,
    description: clip.description,
    videoUrl: clip.videoUrl,
    thumbnailUrl: clip.thumbnailUrl,
    publishedAt: clip.publishedAt,
    featured: clip.featured,
    slug: clip.slug,
  };
}

function eventPayload(event) {
  return {
    title: event.title,
    summary: event.summary,
    location: event.location,
    category: event.category,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    featured: event.featured,
    registrationUrl: event.registrationUrl,
    slug: event.slug,
  };
}

async function replaceResource(route, items, mapper, token) {
  const existing = await authenticated(`/api/admin/${route}`, token);
  const collection = existing.items || existing[route] || [];

  for (const item of collection) {
    await authenticated(`/api/admin/${route}/${item.id}`, token, {
      method: 'DELETE',
    });
  }

  for (const item of sortByPublishedAt(items)) {
    await authenticated(`/api/admin/${route}`, token, {
      method: 'POST',
      body: JSON.stringify(mapper(item)),
    });
  }
}

async function main() {
  const local = await fetchLocalContent();
  const token = await loginAdmin();

  await authenticated('/api/admin/config/app', token, {
    method: 'PUT',
    body: JSON.stringify(local.appConfig),
  });

  await authenticated('/api/admin/config/verse-of-day', token, {
    method: 'PUT',
    body: JSON.stringify(local.verse),
  });

  await replaceResource('sermons', local.sermons, sermonPayload, token);
  await replaceResource('devotions', local.devotions, devotionPayload, token);
  await replaceResource('clips', local.clips, clipPayload, token);
  await replaceResource('events', local.events, eventPayload, token);

  console.log(JSON.stringify({
    remoteApiBase: REMOTE_API_BASE,
    synced: {
      sermons: local.sermons.length,
      devotions: local.devotions.length,
      clips: local.clips.length,
      events: local.events.length,
    },
    skippedLocalUploadSermons: (await request(LOCAL_API_BASE, '/api/app/sermons')).sermons.filter((item) => !isPublishableSermon(item)).length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
