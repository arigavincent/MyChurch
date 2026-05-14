const { createError } = require('./errors');

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanOptionalText(value) {
  const text = cleanText(value);
  return text || null;
}

function cleanBoolean(value) {
  return value === true || value === 'true';
}

function cleanInteger(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function cleanArray(value) {
  if (Array.isArray(value)) {
    return value.map(cleanText).filter(Boolean);
  }

  const text = cleanText(value);
  if (!text) return [];

  return text
    .split(',')
    .map(cleanText)
    .filter(Boolean);
}

function cleanPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function requireText(value, field, message) {
  const text = cleanText(value);
  if (!text) {
    throw createError(400, message || `${field} is required`);
  }
  return text;
}

function ensureTimestamp(value, field) {
  const text = cleanText(value);
  if (!text) {
    throw createError(400, `${field} is required`);
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    throw createError(400, `${field} must be a valid date`);
  }

  return date.toISOString();
}

function ensureOptionalTimestamp(value) {
  const text = cleanText(value);
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    throw createError(400, 'Invalid date supplied');
  }
  return date.toISOString();
}

function stripUndefined(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );
}

function deriveMediaType(audioUrl, videoUrl) {
  if (audioUrl && videoUrl) return 'hybrid';
  if (videoUrl) return 'video';
  return 'audio';
}

function prepareSermonInput(body) {
  const title = requireText(body.title, 'title');
  const speaker = requireText(body.speaker, 'speaker');
  const summary = requireText(body.summary, 'summary');
  const publishedAt = ensureTimestamp(body.publishedAt || new Date().toISOString(), 'publishedAt');
  const audioUrl = cleanOptionalText(body.audioUrl);
  const videoUrl = cleanOptionalText(body.videoUrl);

  if (!audioUrl && !videoUrl) {
    throw createError(400, 'A sermon needs at least an audio URL or a video URL');
  }

  return stripUndefined({
    title,
    speaker,
    summary,
    published_at: publishedAt,
    duration_label: cleanOptionalText(body.durationLabel),
    audio_url: audioUrl,
    video_url: videoUrl,
    media_type: deriveMediaType(audioUrl, videoUrl),
    featured: cleanBoolean(body.featured),
    artwork_url: cleanOptionalText(body.artworkUrl),
    tags: cleanArray(body.tags),
    slug: cleanText(body.slug) || slugify(`${title}-${speaker}`),
  });
}

function prepareDevotionInput(body) {
  const title = requireText(body.title, 'title');
  const reference = requireText(body.reference, 'reference');
  return stripUndefined({
    title,
    reference,
    scripture_text: requireText(body.scriptureText, 'scriptureText'),
    body: requireText(body.body, 'body'),
    prayer: requireText(body.prayer, 'prayer'),
    published_at: ensureTimestamp(body.publishedAt || new Date().toISOString(), 'publishedAt'),
    featured: cleanBoolean(body.featured),
    slug: cleanText(body.slug) || slugify(`${title}-${reference}`),
  });
}

function prepareClipInput(body) {
  const title = requireText(body.title, 'title');
  return stripUndefined({
    title,
    description: requireText(body.description, 'description'),
    video_url: requireText(body.videoUrl, 'videoUrl'),
    thumbnail_url: cleanOptionalText(body.thumbnailUrl),
    published_at: ensureTimestamp(body.publishedAt || new Date().toISOString(), 'publishedAt'),
    featured: cleanBoolean(body.featured),
    slug: cleanText(body.slug) || slugify(title),
  });
}

function prepareEventInput(body) {
  const title = requireText(body.title, 'title');
  const startsAt = ensureTimestamp(body.startsAt || body.startAt || body.publishedAt || new Date().toISOString(), 'startsAt');

  return stripUndefined({
    title,
    summary: requireText(body.summary, 'summary'),
    location: requireText(body.location, 'location'),
    category: cleanText(body.category) || 'service',
    starts_at: startsAt,
    ends_at: ensureOptionalTimestamp(body.endsAt),
    featured: cleanBoolean(body.featured),
    registration_url: cleanOptionalText(body.registrationUrl),
    slug: cleanText(body.slug) || slugify(`${title}-${startsAt}`),
  });
}

function prepareGroupInput(body) {
  const name = requireText(body.name, 'name');
  return stripUndefined({
    name,
    leader: requireText(body.leader, 'leader'),
    description: requireText(body.description, 'description'),
    meeting_time_label: requireText(body.meetingTimeLabel, 'meetingTimeLabel'),
    location: requireText(body.location, 'location'),
    contact_phone: cleanOptionalText(cleanPhone(body.contactPhone)),
    category: cleanText(body.category) || 'community',
    featured: cleanBoolean(body.featured),
    slug: cleanText(body.slug) || slugify(name),
  });
}

function prepareBiblePlanInput(body) {
  const day = cleanInteger(body.day, 0);
  if (day < 1 || day > 365) {
    throw createError(400, 'day must be between 1 and 365');
  }

  return stripUndefined({
    day,
    title: requireText(body.title, 'title'),
    reference: requireText(body.reference, 'reference'),
    summary: cleanOptionalText(body.summary),
  });
}

function prepareAppConfigInput(body) {
  return stripUndefined({
    church_name: requireText(body.churchName, 'churchName'),
    tagline: cleanOptionalText(body.tagline),
    city: cleanOptionalText(body.city),
    country: cleanOptionalText(body.country),
    primary_contact_email: cleanOptionalText(body.primaryContactEmail),
    primary_contact_phone: cleanOptionalText(cleanPhone(body.primaryContactPhone)),
    address: cleanOptionalText(body.address),
    youtube_url: cleanOptionalText(body.youtubeUrl),
    instagram_url: cleanOptionalText(body.instagramUrl),
    facebook_url: cleanOptionalText(body.facebookUrl),
    whatsapp_url: cleanOptionalText(body.whatsappUrl),
    live_stream_id: cleanOptionalText(body.liveStreamId),
    live_stream_enabled: cleanBoolean(body.liveStreamEnabled),
    hero_headline: cleanOptionalText(body.heroHeadline),
    hero_subheadline: cleanOptionalText(body.heroSubheadline),
  });
}

function prepareVerseOfDayInput(body) {
  return stripUndefined({
    text: requireText(body.text, 'text'),
    reference: requireText(body.reference, 'reference'),
    theme: cleanOptionalText(body.theme),
  });
}

function preparePrayerRequestInput(body) {
  return {
    name: requireText(body.name, 'name'),
    request: requireText(body.request, 'request'),
    urgency: cleanText(body.urgency) || 'steady',
  };
}

function preparePrayerCommentInput(body) {
  return {
    request_id: requireText(body.requestId, 'requestId'),
    name: requireText(body.name, 'name'),
    text: requireText(body.text, 'text'),
  };
}

function prepareTestimonyInput(body) {
  return {
    name: requireText(body.name, 'name'),
    testimony: requireText(body.testimony, 'testimony'),
  };
}

function prepareReadingProgressInput(userId, body) {
  const completed = body.completed && typeof body.completed === 'object' ? body.completed : {};
  return {
    user_id: userId,
    completed,
  };
}

function prepareUserProgressInput(userId, body) {
  return {
    user_id: userId,
    completed_devotions: Array.isArray(body.completedDevotions)
      ? body.completedDevotions.map(String)
      : [],
  };
}

function prepareSermonNoteInput(userId, body) {
  return {
    user_id: userId,
    sermon_id: requireText(body.sermonId, 'sermonId'),
    text: requireText(body.text, 'text'),
  };
}

function prepareDonationInput(userId, body) {
  const amount = cleanInteger(body.amount, 0);
  if (amount < 10) {
    throw createError(400, 'amount must be at least 10');
  }

  return {
    owner_id: userId,
    amount,
    method: cleanText(body.method) || 'mpesa',
    frequency: cleanText(body.frequency) || 'one-time',
    status: cleanText(body.status) || 'pending',
    phone: requireText(cleanPhone(body.phone), 'phone'),
    checkout_request_id: cleanOptionalText(body.checkoutRequestId),
  };
}

module.exports = {
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
  cleanPhone,
  cleanText,
  slugify,
};
