export const COLLECTIONS = {
  roles: 'roles',
  config: 'config',
  sermons: 'sermons',
  devotions: 'devotions',
  shortClips: 'short_clips',
  events: 'events',
  groups: 'groups',
  prayerRequests: 'prayer_requests',
  prayerComments: 'prayer_comments',
  testimonies: 'testimonies',
  biblePlan: 'bible_plan',
  readingProgress: 'reading_progress',
  userProgress: 'user_progress',
  donations: 'donations',
  sermonNotes: 'sermon_notes',
};

export const CONFIG_DOCS = {
  app: 'app',
  verseOfDay: 'verse_of_day',
};

export const SERMON_MEDIA_TYPES = {
  audio: 'audio',
  video: 'video',
  hybrid: 'hybrid',
};

export function trimText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function toSlug(value) {
  return trimText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function ensureHttps(value) {
  const text = trimText(value);
  if (!text) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(text) || text.startsWith('//') || text.startsWith('/')) {
    return text;
  }
  return `https://${text}`;
}

export function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }
  if (digits.startsWith('254') && digits.length >= 12) {
    return digits;
  }
  if (digits.length === 9) {
    return `254${digits}`;
  }
  return digits;
}

export function deriveSermonMediaType({ audioUrl, videoUrl }) {
  const hasAudio = !!trimText(audioUrl);
  const hasVideo = !!trimText(videoUrl);
  if (hasAudio && hasVideo) return SERMON_MEDIA_TYPES.hybrid;
  if (hasVideo) return SERMON_MEDIA_TYPES.video;
  return SERMON_MEDIA_TYPES.audio;
}

export function buildSermonPayload(values) {
  const publishedAt = trimText(values.publishedAt) || new Date().toISOString();
  const audioUrl = ensureHttps(values.audioUrl);
  const videoUrl = ensureHttps(values.videoUrl);
  return pruneEmptyFields({
    title: trimText(values.title),
    speaker: trimText(values.speaker),
    summary: trimText(values.summary),
    publishedAt,
    durationLabel: trimText(values.durationLabel),
    audioUrl,
    videoUrl,
    mediaType: deriveSermonMediaType({ audioUrl, videoUrl }),
    featured: !!values.featured,
    artworkUrl: ensureHttps(values.artworkUrl),
    tags: normalizeTags(values.tags),
    slug: toSlug(`${values.title}-${values.speaker}`),
  });
}

export function buildDevotionPayload(values) {
  const publishedAt = trimText(values.publishedAt) || new Date().toISOString();
  return pruneEmptyFields({
    title: trimText(values.title),
    reference: trimText(values.reference),
    scriptureText: trimText(values.scriptureText),
    body: trimText(values.body),
    prayer: trimText(values.prayer),
    publishedAt,
    featured: !!values.featured,
    slug: toSlug(`${values.title}-${values.reference}`),
  });
}

export function buildClipPayload(values) {
  const publishedAt = trimText(values.publishedAt) || new Date().toISOString();
  return pruneEmptyFields({
    title: trimText(values.title),
    description: trimText(values.description),
    videoUrl: ensureHttps(values.videoUrl),
    thumbnailUrl: ensureHttps(values.thumbnailUrl),
    publishedAt,
    featured: !!values.featured,
    slug: toSlug(values.title),
  });
}

export function buildEventPayload(values) {
  const startsAt = buildIsoDateTime(values.startDate, values.startTime);
  const endsAt = values.endDate || values.endTime
    ? buildIsoDateTime(values.endDate || values.startDate, values.endTime || values.startTime)
    : '';
  return pruneEmptyFields({
    title: trimText(values.title),
    summary: trimText(values.summary),
    location: trimText(values.location),
    category: trimText(values.category) || 'service',
    startsAt,
    endsAt,
    featured: !!values.featured,
    registrationUrl: ensureHttps(values.registrationUrl),
    slug: toSlug(`${values.title}-${startsAt}`),
  });
}

export function buildGroupPayload(values) {
  return pruneEmptyFields({
    name: trimText(values.name),
    leader: trimText(values.leader),
    description: trimText(values.description),
    meetingTimeLabel: trimText(values.meetingTimeLabel),
    location: trimText(values.location),
    contactPhone: normalizePhone(values.contactPhone),
    category: trimText(values.category) || 'community',
    featured: !!values.featured,
    slug: toSlug(values.name),
  });
}

export function buildBiblePlanPayload(values) {
  return pruneEmptyFields({
    day: Number.parseInt(values.day, 10),
    title: trimText(values.title),
    reference: trimText(values.reference),
    summary: trimText(values.summary),
  });
}

export function buildAppConfigPayload(values) {
  return pruneEmptyFields({
    churchName: trimText(values.churchName),
    tagline: trimText(values.tagline),
    city: trimText(values.city),
    country: trimText(values.country),
    primaryContactEmail: trimText(values.primaryContactEmail),
    primaryContactPhone: normalizePhone(values.primaryContactPhone),
    address: trimText(values.address),
    youtubeUrl: ensureHttps(values.youtubeUrl),
    instagramUrl: ensureHttps(values.instagramUrl),
    facebookUrl: ensureHttps(values.facebookUrl),
    whatsappUrl: ensureHttps(values.whatsappUrl),
    liveStreamId: normalizeLiveStreamId(values.liveStreamId),
    liveStreamEnabled: !!values.liveStreamEnabled,
    heroHeadline: trimText(values.heroHeadline),
    heroSubheadline: trimText(values.heroSubheadline),
  });
}

export function buildVerseOfDayPayload(values) {
  return pruneEmptyFields({
    text: trimText(values.text),
    reference: trimText(values.reference),
    theme: trimText(values.theme),
  });
}

export function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value.map(trimText).filter(Boolean).slice(0, 8);
  }
  return trimText(value)
    .split(',')
    .map(trimText)
    .filter(Boolean)
    .slice(0, 8);
}

export function buildIsoDateTime(dateValue, timeValue) {
  const date = trimText(dateValue);
  const time = trimText(timeValue) || '00:00';
  if (!date) return '';
  return new Date(`${date}T${time}:00`).toISOString();
}

export function formatEventDateLabel(isoString) {
  if (!isoString) return 'Date TBA';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatEventTimeLabel(isoString) {
  if (!isoString) return 'Time TBA';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatLongDateLabel(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function relativeTimeFromDate(dateLike) {
  const date = typeof dateLike?.toDate === 'function'
    ? dateLike.toDate()
    : new Date(dateLike);
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return 'Just now';
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return 'Just now';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}d ago`;
  return formatLongDateLabel(date.toISOString());
}

export function getYouTubeVideoId(url) {
  const value = trimText(url);
  if (!value) return '';
  const directId = value.match(/^[a-zA-Z0-9_-]{11}$/);
  if (directId) return directId[0];

  try {
    const parsed = new URL(value.startsWith('http') ? value : `https://${value}`);
    const directParam = parsed.searchParams.get('v');
    if (directParam?.match(/^[a-zA-Z0-9_-]{11}$/)) {
      return directParam;
    }
  } catch {}

  const matched = value.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return matched?.[1] || '';
}

export function normalizeLiveStreamId(value) {
  const text = trimText(value);
  if (!text) return '';
  return getYouTubeVideoId(text) || text;
}

export function getYouTubeEmbedUrl(value) {
  const id = getYouTubeVideoId(value);
  if (!id) return '';
  return `https://www.youtube.com/embed/${id}?autoplay=0&playsinline=1&rel=0&modestbranding=1`;
}

export function getVideoPlaybackKind(value) {
  const text = trimText(value);
  if (!text) return 'none';
  if (getYouTubeVideoId(text)) return 'youtube';
  if (text.includes('/uploads/')) return 'file';
  if (/\.(mp4|m4v|mov|webm|m3u8)(?:$|[?#])/i.test(text)) return 'file';
  return 'external';
}

export function canPlayVideoInApp(value) {
  const kind = getVideoPlaybackKind(value);
  return kind === 'youtube' || kind === 'file';
}

export function pruneEmptyFields(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    })
  );
}
