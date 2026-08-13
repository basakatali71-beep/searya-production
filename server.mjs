import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { backup, DatabaseSync } from 'node:sqlite';
import { Polar } from '@polar-sh/sdk';
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { initialForSaleListings, initialWtbListings } from './src/data/seedListings.js';
import { GUIDES, GUIDE_CATEGORIES, GUIDE_PUBLISHED_DATE } from './src/data/guides.js';
import { DISCOVERY_PAGES, DISCOVERY_INDEX_THRESHOLD } from './src/data/discoveryPages.js';
import { blogPosts as CORE_BLOG_POSTS } from './src/data/blogPosts.js';
import GENERATED_BLOG_POSTS from './src/data/blogPosts.json' with { type: 'json' };
import { INDEXNOW_KEY, indexNowKeyPath, submitIndexNow } from './src/services/indexNow.js';
import { submitSitemapToGoogle } from './src/services/googleSearchConsole.js';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || '127.0.0.1';
const NODE_ENV = process.env.NODE_ENV || 'development';
const APP_ORIGIN = process.env.APP_ORIGIN || `http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`;
const PUBLIC_ORIGIN = 'https://searya.com';
const REQUESTED_PAYMENT_MODE = process.env.PAYMENT_MODE || (NODE_ENV === 'production' ? 'disabled' : 'demo');
const POLAR_SERVER = String(process.env.POLAR_SERVER || 'sandbox').trim().toLowerCase() === 'production' ? 'production' : 'sandbox';
const PAYMENT_MODE = NODE_ENV === 'production' && REQUESTED_PAYMENT_MODE === 'polar' && POLAR_SERVER !== 'production' ? 'disabled' : REQUESTED_PAYMENT_MODE;
const LAUNCH_FREE_MODE = process.env.LAUNCH_FREE_MODE
  ? String(process.env.LAUNCH_FREE_MODE).trim().toLowerCase() !== 'false'
  : NODE_ENV === 'production' && PAYMENT_MODE === 'disabled';
const DEFAULT_DB_PATH = NODE_ENV === 'production' && existsSync('/var/data') ? '/var/data/searya.sqlite' : './data/searya.sqlite';
const DB_PATH = resolve(ROOT, process.env.SEARYA_DB_PATH || DEFAULT_DB_PATH);
const BACKUP_DIR = resolve(process.env.SEARYA_BACKUP_DIR || resolve(DB_PATH, '..', 'backups'));
const SESSION_COOKIE = 'searya_session';
const VISITOR_COOKIE = 'searya_visitor';
const OAUTH_COOKIE = 'searya_oauth_state';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const PRESENCE_ACTIVE_WINDOW_SECONDS = 120;
const MAX_JSON_BYTES = 6 * 1024 * 1024;
const CONTACT_UNLOCK_MESSAGE_COUNT = 6;
const LAUNCH_FREE_LISTING_LIMIT = 3;
const LAUNCH_FREE_CONNECTION_LIMIT = 10;
const LAUNCH_FREE_CONNECTION_WINDOW_DAYS = 30;

mkdirSync(resolve(DB_PATH, '..'), { recursive: true });
const db = new DatabaseSync(DB_PATH, { timeout: 5000 });
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password_hash TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'buyer',
    status TEXT NOT NULL DEFAULT 'active',
    is_admin INTEGER NOT NULL DEFAULT 0,
    email_verified INTEGER NOT NULL DEFAULT 0,
    is_verified INTEGER NOT NULL DEFAULT 0,
    buyer_connections INTEGER NOT NULL DEFAULT 2,
    seller_free_listings INTEGER NOT NULL DEFAULT 1,
    seller_listing_credits INTEGER NOT NULL DEFAULT 0,
    seller_vip_credits INTEGER NOT NULL DEFAULT 0,
    boost_credits INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS oauth_states (
    state_hash TEXT PRIMARY KEY,
    provider TEXT NOT NULL CHECK(provider IN ('google','apple')),
    role TEXT NOT NULL DEFAULT 'buyer',
    code_verifier TEXT NOT NULL,
    nonce TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK(type IN ('sale','wtb')),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    content_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    is_verified INTEGER NOT NULL DEFAULT 0,
    priority_review INTEGER NOT NULL DEFAULT 0,
    boosted_until TEXT,
    views INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  ) STRICT;

  CREATE INDEX IF NOT EXISTS listings_status_type_created ON listings(status, type, created_at DESC);
  CREATE INDEX IF NOT EXISTS listings_owner ON listings(user_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    user_a TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(listing_id, user_a, user_b)
  ) STRICT;

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL,
    read_at TEXT
  ) STRICT;

  CREATE INDEX IF NOT EXISTS messages_thread_created ON messages(thread_id, created_at);
  CREATE INDEX IF NOT EXISTS messages_unread ON messages(thread_id, sender_id, read_at);

  CREATE TABLE IF NOT EXISTS contacted_projects (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY(user_id, listing_id)
  ) STRICT;

  CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_key TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL DEFAULT 'pending',
    provider_ref TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS page_views (
    id TEXT PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    path TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'direct',
    medium TEXT NOT NULL DEFAULT 'direct',
    campaign TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    term TEXT NOT NULL DEFAULT '',
    referrer TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  ) STRICT;

  CREATE INDEX IF NOT EXISTS page_views_created ON page_views(created_at DESC);
  CREATE INDEX IF NOT EXISTS page_views_visitor_created ON page_views(visitor_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS visitor_sessions (
    session_id TEXT PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    user_id TEXT,
    path TEXT NOT NULL DEFAULT '/',
    device TEXT NOT NULL DEFAULT 'unknown',
    started_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    ended_at TEXT,
    end_reason TEXT NOT NULL DEFAULT ''
  ) STRICT;

  CREATE INDEX IF NOT EXISTS visitor_sessions_started ON visitor_sessions(started_at DESC);
  CREATE INDEX IF NOT EXISTS visitor_sessions_last_seen ON visitor_sessions(last_seen_at DESC);
  CREATE INDEX IF NOT EXISTS visitor_sessions_visitor ON visitor_sessions(visitor_id, started_at DESC);

  CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    event_name TEXT NOT NULL,
    visitor_id TEXT NOT NULL,
    user_id TEXT,
    source TEXT NOT NULL DEFAULT 'direct',
    medium TEXT NOT NULL DEFAULT 'direct',
    campaign TEXT NOT NULL DEFAULT '',
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
  ) STRICT;

  CREATE INDEX IF NOT EXISTS analytics_events_created ON analytics_events(created_at DESC);
  CREATE INDEX IF NOT EXISTS analytics_events_name_created ON analytics_events(event_name, created_at DESC);
  CREATE INDEX IF NOT EXISTS analytics_events_visitor_created ON analytics_events(visitor_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS blocks (
    blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY(blocker_id, blocked_id)
  ) STRICT;

  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'all',
    min_price INTEGER NOT NULL DEFAULT 0,
    max_price INTEGER NOT NULL DEFAULT 10000000,
    frequency TEXT NOT NULL DEFAULT 'daily',
    created_at TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS password_resets (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS email_verifications (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL
  ) STRICT;
`);

if (!db.prepare('PRAGMA table_info(users)').all().some(column => column.name === 'email_verified')) {
  db.exec('ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;');
  db.exec('UPDATE users SET email_verified=1 WHERE email IS NULL OR is_admin=1;');
}
if (!db.prepare('PRAGMA table_info(users)').all().some(column => column.name === 'boost_credits')) {
  db.exec('ALTER TABLE users ADD COLUMN boost_credits INTEGER NOT NULL DEFAULT 0;');
}
if (!db.prepare('PRAGMA table_info(listings)').all().some(column => column.name === 'boosted_until')) {
  db.exec('ALTER TABLE listings ADD COLUMN boosted_until TEXT;');
}
if (!db.prepare('PRAGMA table_info(alerts)').all().some(column => column.name === 'last_sent_at')) {
  db.exec('ALTER TABLE alerts ADD COLUMN last_sent_at TEXT;');
}
if (!db.prepare('PRAGMA table_info(visitor_sessions)').all().some(column => column.name === 'user_id')) {
  db.exec('ALTER TABLE visitor_sessions ADD COLUMN user_id TEXT;');
}
if (!db.prepare('PRAGMA table_info(visitor_sessions)').all().some(column => column.name === 'device')) {
  db.exec("ALTER TABLE visitor_sessions ADD COLUMN device TEXT NOT NULL DEFAULT 'unknown';");
}
for (const [column, definition] of [
  ['source', "TEXT NOT NULL DEFAULT 'direct'"],
  ['medium', "TEXT NOT NULL DEFAULT 'direct'"],
  ['campaign', "TEXT NOT NULL DEFAULT ''"],
  ['content', "TEXT NOT NULL DEFAULT ''"],
  ['term', "TEXT NOT NULL DEFAULT ''"],
  ['referrer', "TEXT NOT NULL DEFAULT ''"]
]) {
  if (!db.prepare('PRAGMA table_info(page_views)').all().some(item => item.name === column)) {
    db.exec(`ALTER TABLE page_views ADD COLUMN ${column} ${definition};`);
  }
}

const packages = Object.freeze({
  buyer_connections_10: { key: 'buyer_connections_10', name: '10 Buyer Connections', amountCents: 900, buyerConnections: 10 },
  seller_listings_3: { key: 'seller_listings_3', name: '3 Seller Listings', amountCents: 900, sellerListingCredits: 3 },
  seller_vip_10: { key: 'seller_vip_10', name: 'Seller Pro Launch Pack', amountCents: 1999, sellerListingCredits: 10, sellerVipCredits: 1, boostCredits: 1 }
});

const polarProductEnvironments = Object.freeze({
  buyer_connections_10: 'POLAR_PRODUCT_BUYER_CONNECTIONS_10',
  seller_listings_3: 'POLAR_PRODUCT_SELLER_LISTINGS_3',
  seller_vip_10: 'POLAR_PRODUCT_SELLER_VIP_10'
});

function nowIso() {
  return new Date().toISOString();
}

function notifySearchEngines(paths) {
  if (NODE_ENV !== 'production') return;
  submitIndexNow(paths, { origin: PUBLIC_ORIGIN })
    .then(result => console.log(`IndexNow accepted ${result.submitted} URL(s) with HTTP ${result.status}.`))
    .catch(error => console.error('IndexNow submission error:', error));
  submitSitemapToGoogle()
    .then(result => { if (result.configured) console.log('Google Search Console sitemap refreshed.'); })
    .catch(error => console.error('Google Search Console sitemap error:', error));
}

function cleanText(value, max = 500) {
  return String(value ?? '').replace(/<[^>]*>/g, '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function analyticsVisitorId(req) {
  const visitorId = String(parseCookies(req)[VISITOR_COOKIE] || '');
  return /^[a-f0-9-]{20,50}$/i.test(visitorId) ? visitorId : '';
}

function analyticsAttribution(pathValue = '/', referrerValue = '') {
  let pageUrl;
  try { pageUrl = new URL(String(pathValue || '/'), APP_ORIGIN); }
  catch { pageUrl = new URL('/', APP_ORIGIN); }
  const referrer = cleanText(referrerValue, 500);
  let referrerHost = '';
  try { referrerHost = referrer ? new URL(referrer).hostname.replace(/^www\./, '').toLowerCase() : ''; }
  catch { referrerHost = ''; }
  const sourceParam = cleanText(pageUrl.searchParams.get('utm_source'), 80).toLowerCase();
  const mediumParam = cleanText(pageUrl.searchParams.get('utm_medium'), 80).toLowerCase();
  const source = sourceParam || (/(^|\.)t\.co$|(^|\.)(x|twitter)\.com$/.test(referrerHost) ? 'x' : /(^|\.)google\./.test(referrerHost) ? 'google' : referrerHost || 'direct');
  const medium = mediumParam || (source === 'direct' ? 'direct' : 'referral');
  return {
    source,
    medium,
    campaign: cleanText(pageUrl.searchParams.get('utm_campaign'), 120),
    content: cleanText(pageUrl.searchParams.get('utm_content'), 120),
    term: cleanText(pageUrl.searchParams.get('utm_term'), 120),
    referrer
  };
}

function recordAnalyticsEvent(req, eventName, metadata = {}) {
  const visitorId = analyticsVisitorId(req);
  if (!visitorId) return;
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const attribution = db.prepare(`SELECT source,medium,campaign FROM page_views WHERE visitor_id=? AND created_at>=? ORDER BY CASE WHEN source='direct' THEN 1 ELSE 0 END,created_at DESC LIMIT 1`).get(visitorId, since)
    || { source: 'direct', medium: 'direct', campaign: '' };
  db.prepare(`INSERT INTO analytics_events(id,event_name,visitor_id,user_id,source,medium,campaign,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?,?)`).run(
    randomUUID(), cleanText(eventName, 60), visitorId, null, attribution.source, attribution.medium, attribution.campaign, JSON.stringify(metadata || {}).slice(0, 2000), nowIso()
  );
}

const BEHAVIOR_EVENT_NAMES = new Set([
  'session_started', 'tab_changed', 'search_performed', 'filter_changed', 'sort_changed',
  'listing_opened', 'listing_shared', 'button_clicked', 'auth_started', 'auth_completed',
  'auth_failed', 'auth_abandoned', 'listing_form_started', 'listing_form_abandoned',
  'listing_submit_attempted', 'listing_submit_succeeded', 'listing_submit_failed',
  'conversation_attempted', 'conversation_started_client', 'conversation_failed',
  'exit_feedback_shown', 'exit_feedback_submitted', 'exit_feedback_dismissed', 'ui_error',
  'discovery_page_view', 'discovery_project_click', 'discovery_seller_cta_click', 'discovery_buyer_cta_click'
]);

const BEHAVIOR_METADATA_KEYS = new Set([
  'sessionId', 'path', 'device', 'tab', 'query', 'resultCount', 'category', 'sort',
  'listingId', 'listingTitle', 'listingType', 'action', 'mode', 'role', 'step',
  'reason', 'code', 'source', 'durationSeconds', 'discoverySlug'
]);

function cleanBehaviorMetadata(value = {}) {
  const output = {};
  for (const [key, rawValue] of Object.entries(value && typeof value === 'object' ? value : {})) {
    if (!BEHAVIOR_METADATA_KEYS.has(key) || rawValue == null) continue;
    if (key === 'resultCount' || key === 'durationSeconds') {
      const number = Number(rawValue);
      if (Number.isFinite(number)) output[key] = Math.max(0, Math.min(86400, Math.round(number)));
      continue;
    }
    const limit = key === 'path' ? 300 : key === 'query' || key === 'listingTitle' ? 100 : 60;
    let text = cleanText(rawValue, limit);
    if (key === 'query') text = text.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[email removed]');
    if (key === 'sessionId' && !/^[a-f0-9-]{20,50}$/i.test(text)) continue;
    if (key === 'device' && !['mobile', 'tablet', 'desktop', 'unknown'].includes(text)) text = 'unknown';
    if (text) output[key] = text;
  }
  return output;
}

function recordBehaviorEvent(req, eventName, metadata = {}) {
  const visitorId = analyticsVisitorId(req);
  if (!visitorId || !BEHAVIOR_EVENT_NAMES.has(eventName)) return false;
  const safeMetadata = cleanBehaviorMetadata(metadata);
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const attribution = db.prepare(`SELECT source,medium,campaign FROM page_views WHERE visitor_id=? AND created_at>=? ORDER BY CASE WHEN source='direct' THEN 1 ELSE 0 END,created_at DESC LIMIT 1`).get(visitorId, since)
    || { source: 'direct', medium: 'direct', campaign: '' };
  const user = getUser(req);
  db.prepare(`INSERT INTO analytics_events(id,event_name,visitor_id,user_id,source,medium,campaign,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?,?)`).run(
    randomUUID(), eventName, visitorId, user?.id || null, attribution.source, attribution.medium, attribution.campaign, JSON.stringify(safeMetadata), nowIso()
  );
  if (safeMetadata.sessionId) {
    db.prepare(`UPDATE visitor_sessions SET user_id=COALESCE(?,user_id),device=CASE WHEN ?='unknown' THEN device ELSE ? END,path=COALESCE(?,path),last_seen_at=? WHERE session_id=? AND visitor_id=?`).run(
      user?.id || null, safeMetadata.device || 'unknown', safeMetadata.device || 'unknown', safeMetadata.path || null, nowIso(), safeMetadata.sessionId, visitorId
    );
  }
  return true;
}

function behaviorAnalytics(since, presenceCutoff) {
  const rows = db.prepare(`SELECT ae.event_name AS eventName,ae.visitor_id AS visitorId,ae.user_id AS userId,
      ae.source,ae.medium,ae.campaign,ae.metadata_json AS metadataJson,ae.created_at AS createdAt
    FROM analytics_events ae
    WHERE ae.created_at>=? AND ae.event_name IN (${[...BEHAVIOR_EVENT_NAMES].map(() => '?').join(',')})
    ORDER BY ae.created_at DESC LIMIT 5000`).all(since, ...BEHAVIOR_EVENT_NAMES);
  const events = rows.map(row => {
    let metadata = {};
    try { metadata = cleanBehaviorMetadata(JSON.parse(row.metadataJson || '{}')); } catch { metadata = {}; }
    return { ...row, metadata };
  });
  const increment = (map, key, extra = {}) => {
    if (!key) return;
    const item = map.get(key) || { key, count: 0, ...extra };
    item.count += 1;
    map.set(key, item);
  };
  const eventTotals = new Map();
  const listingTotals = new Map();
  const searchTotals = new Map();
  const exitReasons = new Map();
  for (const event of events) {
    increment(eventTotals, event.eventName);
    if (event.eventName === 'listing_opened') {
      const key = event.metadata.listingId || event.metadata.listingTitle;
      increment(listingTotals, key, { title: event.metadata.listingTitle || 'Listing' });
    }
    if (event.eventName === 'search_performed' && event.metadata.query) {
      const key = event.metadata.query.toLowerCase();
      const item = searchTotals.get(key) || { query: event.metadata.query, count: 0, zeroResults: 0 };
      item.count += 1;
      if (Number(event.metadata.resultCount) === 0) item.zeroResults += 1;
      searchTotals.set(key, item);
    }
    if (event.eventName === 'exit_feedback_submitted') increment(exitReasons, event.metadata.reason || 'other');
  }

  const sessions = db.prepare(`SELECT vs.session_id AS sessionId,vs.visitor_id AS visitorId,vs.user_id AS userId,
      vs.path,vs.device,vs.started_at AS startedAt,vs.last_seen_at AS lastSeenAt,vs.ended_at AS endedAt,vs.end_reason AS endReason,
      u.name AS userName,u.email AS userEmail,
      (SELECT pv.source FROM page_views pv WHERE pv.visitor_id=vs.visitor_id ORDER BY CASE WHEN pv.source='direct' THEN 1 ELSE 0 END,pv.created_at DESC LIMIT 1) AS source,
      (SELECT pv.campaign FROM page_views pv WHERE pv.visitor_id=vs.visitor_id ORDER BY pv.created_at DESC LIMIT 1) AS campaign
    FROM visitor_sessions vs LEFT JOIN users u ON u.id=vs.user_id
    WHERE vs.started_at>=? ORDER BY vs.started_at DESC LIMIT 100`).all(since);
  const sessionStats = db.prepare(`SELECT COUNT(*) AS total,
      COALESCE(AVG(MAX(0,(julianday(COALESCE(ended_at,last_seen_at))-julianday(started_at))*86400)),0) AS avgDuration
    FROM visitor_sessions WHERE started_at>=?`).get(since);
  const eventsBySession = new Map();
  for (const event of [...events].reverse()) {
    const sessionId = event.metadata.sessionId;
    if (!sessionId) continue;
    if (!eventsBySession.has(sessionId)) eventsBySession.set(sessionId, []);
    eventsBySession.get(sessionId).push(event);
  }
  let bounceSessions = 0;
  const journeys = sessions.slice(0, 40).map(session => {
    const sessionEvents = eventsBySession.get(session.sessionId) || [];
    const started = Date.parse(session.startedAt) || Date.now();
    const ended = Date.parse(session.endedAt || session.lastSeenAt) || started;
    const durationSeconds = Math.max(0, Math.min(86400, Math.round((ended - started) / 1000)));
    const meaningful = sessionEvents.filter(item => !['session_started', 'exit_feedback_shown', 'exit_feedback_dismissed'].includes(item.eventName));
    if (meaningful.length === 0) bounceSessions += 1;
    const feedback = [...sessionEvents].reverse().find(item => item.eventName === 'exit_feedback_submitted')?.metadata.reason || '';
    return {
      visitorKey: session.visitorId.slice(0, 8),
      userName: session.userName || '',
      userEmail: session.userEmail || '',
      path: session.path,
      device: session.device || 'unknown',
      source: session.source || 'direct',
      campaign: session.campaign || '',
      startedAt: session.startedAt,
      durationSeconds,
      active: !session.endedAt && session.lastSeenAt >= presenceCutoff,
      endReason: session.endReason || '',
      feedback,
      events: sessionEvents.slice(-20).map(event => ({ eventName: event.eventName, metadata: event.metadata, createdAt: event.createdAt }))
    };
  });
  const exitPages = db.prepare(`SELECT path AS key,COUNT(*) AS count FROM visitor_sessions WHERE started_at>=? AND ended_at IS NOT NULL GROUP BY path ORDER BY count DESC LIMIT 8`).all(since);
  const devices = db.prepare(`SELECT device AS key,COUNT(*) AS count FROM visitor_sessions WHERE started_at>=? GROUP BY device ORDER BY count DESC`).all(since);
  const count = name => eventTotals.get(name)?.count || 0;
  return {
    summary: {
      sessions: sessionStats.total,
      activeNow: db.prepare('SELECT COUNT(DISTINCT visitor_id) AS count FROM visitor_sessions WHERE ended_at IS NULL AND last_seen_at>=?').get(presenceCutoff).count,
      avgDurationSeconds: Math.max(0, Math.round(sessionStats.avgDuration || 0)),
      bounceRate: sessions.length ? Math.round((bounceSessions / sessions.length) * 100) : 0,
      feedbackResponses: count('exit_feedback_submitted'),
      errors: count('ui_error') + count('listing_submit_failed') + count('conversation_failed')
    },
    popularActions: [...eventTotals.values()].sort((a, b) => b.count - a.count).slice(0, 12),
    dropOffs: ['auth_abandoned', 'listing_form_abandoned', 'listing_submit_failed', 'conversation_failed', 'ui_error']
      .map(key => ({ key, count: count(key) })).filter(item => item.count > 0),
    topListings: [...listingTotals.values()].sort((a, b) => b.count - a.count).slice(0, 10),
    searches: [...searchTotals.values()].sort((a, b) => b.count - a.count).slice(0, 10),
    exitReasons: [...exitReasons.values()].sort((a, b) => b.count - a.count),
    exitPages,
    devices,
    journeys: journeys.slice(0, 25)
  };
}

function slugify(value) {
  return cleanText(value, 100).toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'proje';
}

function uniqueSlug(title, ignoreId = '') {
  const base = slugify(title);
  let candidate = base;
  let index = 2;
  const query = db.prepare('SELECT id FROM listings WHERE slug = ? AND id != ?');
  while (query.get(candidate, ignoreId)) candidate = `${base}-${index++}`;
  return candidate;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, expectedHex] = stored.split(':');
  const actual = scryptSync(String(password), salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '').split(';').map(part => part.trim()).filter(Boolean).map(part => {
    const index = part.indexOf('=');
    return [decodeURIComponent(part.slice(0, index)), decodeURIComponent(part.slice(index + 1))];
  }));
}

function launchFreeListingSlotsRemaining(userId) {
  const used = Number(db.prepare("SELECT COUNT(*) AS count FROM listings WHERE user_id=? AND status IN ('pending','approved')").get(userId)?.count || 0);
  return Math.max(0, LAUNCH_FREE_LISTING_LIMIT - used);
}

function launchFreeConnectionsRemaining(userId) {
  const cutoff = new Date(Date.now() - LAUNCH_FREE_CONNECTION_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const used = Number(db.prepare('SELECT COUNT(*) AS count FROM contacted_projects WHERE user_id=? AND created_at>=?').get(userId, cutoff)?.count || 0);
  return Math.max(0, LAUNCH_FREE_CONNECTION_LIMIT - used);
}

function publicUser(row) {
  if (!row) return null;
  const freeLaunchUser = LAUNCH_FREE_MODE && !row.is_admin;
  return {
    id: row.id,
    email: row.email || null,
    name: row.name,
    role: row.role,
    isAdmin: Boolean(row.is_admin),
    emailVerified: Boolean(row.email_verified),
    isVerified: Boolean(row.is_verified),
    buyerConnections: freeLaunchUser ? launchFreeConnectionsRemaining(row.id) : row.buyer_connections,
    sellerFreeListings: freeLaunchUser ? launchFreeListingSlotsRemaining(row.id) : row.seller_free_listings,
    sellerListingCredits: freeLaunchUser ? 0 : row.seller_listing_credits,
    sellerVipCredits: row.seller_vip_credits,
    boostCredits: row.boost_credits,
    createdAt: row.created_at,
    launchFree: LAUNCH_FREE_MODE
  };
}

function getUser(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const row = db.prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.status='active'`).get(sha256(token), nowIso());
  if (row) db.prepare('UPDATE users SET last_seen_at=? WHERE id=?').run(nowIso(), row.id);
  return row || null;
}

function sessionCookie(token, clear = false) {
  const parts = [`${SESSION_COOKIE}=${clear ? '' : encodeURIComponent(token)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  parts.push(`Max-Age=${clear ? 0 : SESSION_TTL_SECONDS}`);
  if (NODE_ENV === 'production') {
    parts.push('Secure');
    if (new URL(APP_ORIGIN).hostname === 'searya.com') parts.push('Domain=searya.com');
  }
  return parts.join('; ');
}

function oauthCookie(state, clear = false) {
  const sameSite = NODE_ENV === 'production' ? 'None' : 'Lax';
  const parts = [`${OAUTH_COOKIE}=${clear ? '' : encodeURIComponent(state)}`, 'Path=/api/auth/oauth', 'HttpOnly', `SameSite=${sameSite}`, `Max-Age=${clear ? 0 : 600}`];
  if (NODE_ENV === 'production') {
    parts.push('Secure');
    if (new URL(APP_ORIGIN).hostname === 'searya.com') parts.push('Domain=searya.com');
  }
  return parts.join('; ');
}

function visitorCookie(visitorId, clear = false) {
  const parts = [`${VISITOR_COOKIE}=${clear ? '' : encodeURIComponent(visitorId)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${clear ? 0 : 60 * 60 * 24 * 365}`];
  if (NODE_ENV === 'production') {
    parts.push('Secure');
    if (new URL(APP_ORIGIN).hostname === 'searya.com') parts.push('Domain=searya.com');
  }
  return parts.join('; ');
}

function createSession(userId) {
  const token = randomBytes(32).toString('base64url');
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').run(sha256(token), userId, expiresAt, createdAt);
  return token;
}

function unreadMessageCount(userId) {
  return db.prepare(`SELECT COUNT(*) AS count FROM messages m JOIN threads t ON t.id=m.thread_id WHERE (t.user_a=? OR t.user_b=?) AND m.sender_id<>? AND m.read_at IS NULL`).get(userId, userId, userId).count;
}

function json(res, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}

function redirect(res, location, cookies = []) {
  const headers = { Location: location, 'Cache-Control': 'no-store' };
  if (cookies.length) headers['Set-Cookie'] = cookies;
  res.writeHead(302, headers);
  res.end();
}

function fail(res, status, code, message) {
  return json(res, status, { error: { code, message } });
}

async function readBody(req, maxBytes = MAX_JSON_BYTES) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) throw Object.assign(new Error('Request is too large.'), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJson(req) {
  const raw = await readBody(req);
  if (!raw.length) return {};
  try { return JSON.parse(raw.toString('utf8')); } catch { throw Object.assign(new Error('Invalid JSON.'), { status: 400 }); }
}

async function readForm(req) {
  const raw = await readBody(req, 128 * 1024);
  return Object.fromEntries(new URLSearchParams(raw.toString('utf8')));
}

function requireUser(req, res, admin = false) {
  const user = getUser(req);
  if (!user) { fail(res, 401, 'AUTH_REQUIRED', 'You must sign in to continue.'); return null; }
  if (admin && !user.is_admin) { fail(res, 403, 'ADMIN_REQUIRED', 'Administrator access is required.'); return null; }
  return user;
}

function listingFromRow(row) {
  const content = JSON.parse(row.content_json || '{}');
  return {
    ...content,
    id: row.id,
    type: row.type,
    title: row.title,
    titleEn: content.titleEn || row.title,
    slug: row.slug,
    category: row.category,
    techPreferenceEn: String(content.techPreferenceEn || content.techPreference || '')
      .replace(/\s+veya\s+/gi, ' or ')
      .replace(/\s+ve\s+/gi, ' and '),
    askingPrice: row.price_cents / 100,
    budget: row.price_cents / 100,
    status: row.status === 'approved' ? (row.is_verified ? 'Verified' : 'Active') : row.status,
    statusEn: row.status === 'approved' ? (row.is_verified ? 'Verified' : 'Active') : row.status,
    isVerified: Boolean(row.is_verified),
    priorityReview: Boolean(row.priority_review),
    boostedUntil: row.boosted_until || null,
    isBoosted: Boolean(row.boosted_until && row.boosted_until > nowIso()),
    views: row.views,
    createdAtIso: row.created_at,
    ownerId: row.user_id
    ,managedBySearya: String(row.user_id || '').startsWith('seed-')
  };
}

function safeImageData(value) {
  const text = String(value || '').trim();
  if (/^https:\/\//i.test(text)) return text.slice(0, 2000);
  if (/^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/i.test(text) && text.length <= MAX_JSON_BYTES) return text;
  return '';
}

function mapListingInput(body, user) {
  const title = cleanText(body.title, 100);
  const type = body.type === 'wtb' ? 'wtb' : 'sale';
  const category = ['ai', 'saas', 'extension', 'mobile', 'notion', 'ui-kit', 'api'].includes(body.category) ? body.category : 'saas';
  const categoryLabel = SEO_CATEGORIES[category] || 'SaaS Projects';
  const price = Number(body.price ?? body.askingPrice ?? body.budget);
  const description = cleanText(body.description, 2000);
  const techStack = Array.isArray(body.techStack) ? body.techStack.map(item => cleanText(item, 40)).filter(Boolean).slice(0, 8) : [];
  const coverImage = type === 'sale' ? safeImageData(body.coverImage) : '';
  if (title.length < 3 || !Number.isFinite(price) || price <= 0 || description.length < 20 || !techStack.length) throw Object.assign(new Error('Complete all listing fields with valid information.'), { status: 422 });
  if (type === 'sale' && !coverImage) throw Object.assign(new Error('Add a real image of your project.'), { status: 422 });
  const seller = { name: user.name, handle: `@${slugify(user.name).replaceAll('-', '_')}`, avatar: '', githubVerified: Boolean(user.is_verified) };
  return { title, type, category, price, content: { titleEn: title, categoryEn: categoryLabel, shortDesc: description, shortDescEn: description, description, descriptionEn: description, fullDesc: description, fullDescEn: description, coverImage, techStack, techPreference: techStack.join(', '), seller, buyer: { name: user.name, avatar: '' }, mrr: 0, isAnonymous: false } };
}

const rateBuckets = new Map();

function requestIpAddress(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const cloudflare = String(req.headers['cf-connecting-ip'] || '').trim();
  const candidate = forwarded || cloudflare || String(req.socket.remoteAddress || '').replace(/^::ffff:/, '');
  return /^[a-f0-9:.]+$/i.test(candidate) ? candidate : undefined;
}

function rateLimited(req, key, limit, windowMs) {
  const now = Date.now();
  const ip = requestIpAddress(req) || 'unknown';
  const bucketKey = `${ip}:${key}`;
  const bucket = rateBuckets.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) { rateBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs }); return false; }
  bucket.count += 1;
  return bucket.count > limit;
}

function contactInfoDetected(text) {
  return /(?:https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\d\s().-]{7,}\d)|(?:instagram|telegram|whatsapp|discord)\s*[:@])/i.test(text);
}

async function sendEmail({ to, subject, text, idempotencyKey }) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return { configured: false };
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey || randomUUID() },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text })
  });
  if (!response.ok) throw new Error(`Email provider returned status ${response.status}.`);
  return { configured: true, data: await response.json() };
}

async function sendVerificationEmail(user) {
  const verificationToken = randomBytes(32).toString('base64url');
  const createdAt = nowIso();
  db.prepare('DELETE FROM email_verifications WHERE user_id=? AND used_at IS NULL').run(user.id);
  db.prepare('INSERT INTO email_verifications(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').run(sha256(verificationToken), user.id, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), createdAt);
  const verifyUrl = `${APP_ORIGIN}/?verify_token=${encodeURIComponent(verificationToken)}`;
  await sendEmail({ to: user.email, subject: 'Verify your Searya email', text: `Hi ${user.name}, verify your email address within 24 hours: ${verifyUrl}`, idempotencyKey: `verify-${user.id}-${sha256(verificationToken).slice(0, 16)}` });
}

function socialAuthConfigured(provider) {
  if (provider === 'google') return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return false;
}

function oauthRedirectUri(provider) {
  return `${APP_ORIGIN}/api/auth/oauth/${provider}/callback`;
}

function oauthErrorRedirect(provider, reason = 'Sign-in could not be completed.') {
  const params = new URLSearchParams({ oauth: 'error', provider, reason });
  return `${APP_ORIGIN}/?${params}`;
}

function beginOauth(req, res, url, provider) {
  if (!socialAuthConfigured(provider)) return redirect(res, oauthErrorRedirect(provider, 'Google sign-in has not been configured yet.'));
  const role = ['buyer', 'seller', 'both'].includes(url.searchParams.get('role')) ? url.searchParams.get('role') : 'buyer';
  const state = randomBytes(32).toString('base64url');
  const nonce = randomBytes(24).toString('base64url');
  const codeVerifier = randomBytes(48).toString('base64url');
  db.prepare('DELETE FROM oauth_states WHERE expires_at<=?').run(nowIso());
  db.prepare('INSERT INTO oauth_states(state_hash,provider,role,code_verifier,nonce,expires_at,created_at) VALUES(?,?,?,?,?,?,?)').run(sha256(state), provider, role, codeVerifier, nonce, new Date(Date.now() + 10 * 60 * 1000).toISOString(), nowIso());
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: oauthRedirectUri('google'),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    nonce,
    code_challenge: createHash('sha256').update(codeVerifier).digest('base64url'),
    code_challenge_method: 'S256',
    prompt: 'select_account'
  });
  const authorizationUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  return redirect(res, authorizationUrl, [oauthCookie(state)]);
}

function consumeOauthState(req, provider, state) {
  const cookieState = String(parseCookies(req)[OAUTH_COOKIE] || '');
  if (!state || !cookieState || state.length !== cookieState.length || !timingSafeEqual(Buffer.from(state), Buffer.from(cookieState))) throw new Error('The sign-in session is invalid or has expired.');
  const row = db.prepare('SELECT * FROM oauth_states WHERE state_hash=? AND provider=? AND expires_at>?').get(sha256(state), provider, nowIso());
  db.prepare('DELETE FROM oauth_states WHERE state_hash=?').run(sha256(state));
  if (!row) throw new Error('The sign-in session is invalid or has expired.');
  return row;
}

function socialUserSession({ email, name, role }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('A valid email address was not received from the provider.');
  let user = db.prepare('SELECT * FROM users WHERE email=?').get(normalizedEmail);
  if (user && user.status !== 'active') throw new Error('This account has been disabled.');
  const created = !user;
  if (!user) {
    const id = randomUUID();
    const createdAt = nowIso();
    db.prepare(`INSERT INTO users(id,email,password_hash,name,role,status,is_admin,email_verified,is_verified,buyer_connections,seller_free_listings,seller_listing_credits,seller_vip_credits,created_at,last_seen_at) VALUES(?,?,NULL,?,?, 'active',0,1,0,2,1,0,0,?,?)`).run(id, normalizedEmail, cleanText(name || normalizedEmail.split('@')[0], 80), role, createdAt, createdAt);
    user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
    sendEmail({ to: normalizedEmail, subject: 'Your Searya account is ready', text: `Hi ${user.name}, your Searya account was created with social sign-in.`, idempotencyKey: `social-welcome-${id}` }).catch(console.error);
  } else if (!user.email_verified) {
    db.prepare('UPDATE users SET email_verified=1,last_seen_at=? WHERE id=?').run(nowIso(), user.id);
    user = db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
  }
  return { user, token: createSession(user.id), created };
}

async function completeOauth(req, res, url, provider) {
  try {
    const input = req.method === 'POST' ? await readForm(req) : Object.fromEntries(url.searchParams);
    if (input.error) throw new Error('Sign-in was cancelled.');
    const oauthState = consumeOauthState(req, provider, String(input.state || ''));
    if (!input.code) throw new Error('Authorization code was not received.');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code: input.code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: oauthRedirectUri('google'), grant_type: 'authorization_code', code_verifier: oauthState.code_verifier })
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.access_token) throw new Error('Google sign-in could not be verified.');
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    const profile = await profileResponse.json();
    if (!profileResponse.ok || profile.email_verified !== true) throw new Error('The Google email address could not be verified.');
    const identity = { email: profile.email, name: profile.name };
    const session = socialUserSession({ ...identity, role: oauthState.role });
    if (session.created) recordAnalyticsEvent(req, 'signup_completed', { method: provider, role: oauthState.role });
    return redirect(res, `${APP_ORIGIN}/?oauth=success&provider=${provider}`, [sessionCookie(session.token), oauthCookie('', true)]);
  } catch (error) {
    return redirect(res, oauthErrorRedirect(provider, error.message || 'Sign-in could not be completed.'), [oauthCookie('', true)]);
  }
}

async function sendDueProjectAlerts() {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return;
  const currentTime = Date.now();
  const alertRows = db.prepare(`SELECT a.*,u.email,u.name FROM alerts a JOIN users u ON u.id=a.user_id WHERE u.status='active' AND u.email_verified=1`).all();
  for (const alert of alertRows) {
    const lastSentAt = alert.last_sent_at || alert.created_at;
    const intervalMs = alert.frequency === 'weekly' ? 7 * 86400000 : alert.frequency === 'daily' ? 86400000 : 0;
    if (currentTime - new Date(lastSentAt).getTime() < intervalMs) continue;
    const query = String(alert.query || '').toLocaleLowerCase('tr-TR');
    const matches = db.prepare(`SELECT slug,title,price_cents FROM listings WHERE status='approved' AND type='sale' AND updated_at>? AND price_cents BETWEEN ? AND ? AND (?='all' OR category=?) AND (?='' OR lower(title || ' ' || content_json) LIKE ?) ORDER BY updated_at DESC LIMIT 10`).all(lastSentAt, alert.min_price * 100, alert.max_price * 100, alert.category, alert.category, query, `%${query}%`);
    if (matches.length) {
      const lines = matches.map(item => `• ${item.title} — $${(item.price_cents / 100).toLocaleString('en-US')}\n  ${PUBLIC_ORIGIN}/projects/${encodeURIComponent(item.slug)}`).join('\n');
      try {
        await sendEmail({ to: alert.email, subject: `${matches.length} new project matches on Searya`, text: `Hi ${alert.name},\n\nNew listings match your project alert:\n\n${lines}\n\nYou can manage this alert from your Searya account.`, idempotencyKey: `alert-${alert.id}-${sha256(lastSentAt).slice(0, 16)}` });
      } catch (error) {
        console.error('Project alert email error:', error?.message || error);
        continue;
      }
    }
    db.prepare('UPDATE alerts SET last_sent_at=? WHERE id=?').run(nowIso(), alert.id);
  }
}

async function createDatabaseBackup() {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = nowIso().replace(/[:.]/g, '-');
  const destination = resolve(BACKUP_DIR, `searya-${stamp}.sqlite`);
  if (!destination.startsWith(`${BACKUP_DIR}/`)) throw new Error('Invalid backup path.');
  await backup(db, destination);
  const backups = readdirSync(BACKUP_DIR).filter(name => /^searya-.*\.sqlite$/.test(name)).sort().reverse();
  for (const filename of backups.slice(7)) {
    const oldBackup = resolve(BACKUP_DIR, filename);
    if (oldBackup.startsWith(`${BACKUP_DIR}/`)) unlinkSync(oldBackup);
  }
  console.log(`Database backup created: ${destination}`);
}

function grantPackage(userId, packageKey) {
  const pack = packages[packageKey];
  if (!pack) return false;
  db.prepare(`UPDATE users SET buyer_connections=buyer_connections+?, seller_listing_credits=seller_listing_credits+?, seller_vip_credits=seller_vip_credits+?, boost_credits=boost_credits+? WHERE id=?`).run(pack.buyerConnections || 0, pack.sellerListingCredits || 0, pack.sellerVipCredits || 0, pack.boostCredits || 0, userId);
  return true;
}

function polarProductId(packageKey) {
  const environmentName = polarProductEnvironments[packageKey];
  return environmentName ? String(process.env[environmentName] || '').trim() : '';
}

function polarPaymentConfigured() {
  return Boolean(
    process.env.POLAR_ACCESS_TOKEN &&
    process.env.POLAR_WEBHOOK_SECRET &&
    Object.keys(packages).every(packageKey => polarProductId(packageKey))
  );
}

function polarServer() {
  return POLAR_SERVER;
}

function polarErrorDiagnostic(error) {
  const statusCode = Number(error?.statusCode || error?.rawResponse?.status || 0) || null;
  const rawBody = typeof error?.body === 'string' ? error.body : '';
  let detail = cleanText(error?.message || 'Polar request failed.', 600);
  if (rawBody) {
    try {
      const parsed = JSON.parse(rawBody);
      detail = cleanText(parsed?.detail || parsed?.error || parsed?.message || detail, 600);
    } catch {
      detail = cleanText(rawBody, 600);
    }
  }
  return { provider: 'polar', statusCode, type: cleanText(error?.name || 'Error', 80), detail };
}

function polarCheckoutErrorMessage(error) {
  const diagnostic = polarErrorDiagnostic(error);
  if (diagnostic.statusCode === 401) return 'The Polar access token is invalid or belongs to a different environment. Check the payment settings.';
  if (diagnostic.statusCode === 403) return 'The Polar token does not have permission to create a checkout session.';
  if (diagnostic.statusCode === 404) return 'The selected plan was not found in Polar. Check the product ID.';
  if (diagnostic.type === 'OrganizationNotReadyForPayments') return 'The Polar account is not ready to accept payments yet.';
  if (diagnostic.statusCode === 422) return 'Polar could not validate the plan settings. Check the product and price details.';
  return 'The checkout session could not be created. Please try again.';
}

function fulfillPolarOrder(order) {
  const metadata = order?.metadata || {};
  const purchaseId = String(metadata.purchase_id || '');
  const userId = String(metadata.user_id || '');
  const packageKey = String(metadata.package_key || '');
  const purchase = purchaseId ? db.prepare('SELECT * FROM purchases WHERE id=?').get(purchaseId) : null;
  const pack = packages[packageKey];
  if (!order?.paid || !purchase || !pack) return { fulfilled: false, reason: 'invalid_order' };
  if (purchase.user_id !== userId || purchase.package_key !== packageKey) return { fulfilled: false, reason: 'metadata_mismatch' };
  if (order.productId !== polarProductId(packageKey)) return { fulfilled: false, reason: 'product_mismatch' };
  if (String(order.currency || '').toLowerCase() !== 'usd' || Number(order.subtotalAmount) !== pack.amountCents) return { fulfilled: false, reason: 'amount_mismatch' };
  let granted = false;
  db.exec('BEGIN IMMEDIATE');
  try {
    const update = db.prepare(`UPDATE purchases SET status='paid',provider_ref=?,updated_at=? WHERE id=? AND status<>'paid'`).run(order.id || null, nowIso(), purchase.id);
    if (update.changes === 1) {
      grantPackage(purchase.user_id, purchase.package_key);
      granted = true;
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return { fulfilled: true, granted, purchaseId: purchase.id, userId: purchase.user_id, packageKey: purchase.package_key };
}

function seedData() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM listings').get().count;
  if (count > 0) return;
  const insertUser = db.prepare(`INSERT OR IGNORE INTO users(id,email,password_hash,name,role,status,is_admin,is_verified,buyer_connections,seller_free_listings,seller_listing_credits,seller_vip_credits,created_at,last_seen_at) VALUES(?,?,?,?,?,'active',0,?,2,1,0,0,?,?)`);
  const insertListing = db.prepare(`INSERT INTO listings(id,user_id,type,title,slug,category,price_cents,content_json,status,is_verified,priority_review,views,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const all = [...initialForSaleListings.filter(item => !item.isAnonymous), ...initialWtbListings.filter(item => !item.isAnonymous)];
  db.exec('BEGIN');
  try {
    for (const item of all) {
      const person = item.seller || item.buyer || { name: 'Searya User' };
      const userId = `seed-${slugify(person.name)}`;
      const createdAt = item.createdAtIso || new Date(Date.now() - Math.max(1, Number(item.id?.match(/\d+/)?.[0] || 1)) * 3600000).toISOString();
      insertUser.run(userId, null, null, person.name, item.type === 'wtb' ? 'buyer' : 'seller', person.githubVerified ? 1 : 0, createdAt, createdAt);
      insertListing.run(item.id, userId, item.type === 'wtb' ? 'wtb' : 'sale', item.title, uniqueSlug(item.slug || item.title), item.category || 'saas', Math.round(Number(item.askingPrice || item.budget || 1) * 100), JSON.stringify(item), 'approved', item.status === 'Doğrulanmış' || item.statusEn === 'Verified' || item.isVerified ? 1 : 0, 0, Number(item.views || 0), createdAt, createdAt);
    }
    db.exec('UPDATE users SET email_verified=1 WHERE email IS NULL;');
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function syncSeedContent() {
  const update = db.prepare(`UPDATE listings SET type=?,title=?,slug=?,category=?,price_cents=?,content_json=?,is_verified=?,created_at=? WHERE id=? AND user_id LIKE 'seed-%'`);
  const findSeedListing = db.prepare(`SELECT user_id FROM listings WHERE id=? AND user_id LIKE 'seed-%'`);
  const insertUser = db.prepare(`INSERT OR IGNORE INTO users(id,email,password_hash,name,role,status,is_admin,is_verified,buyer_connections,seller_free_listings,seller_listing_credits,seller_vip_credits,created_at,last_seen_at,email_verified) VALUES(?,?,?,?,?,'active',0,?,2,1,0,0,?,?,1)`);
  const insertListing = db.prepare(`INSERT INTO listings(id,user_id,type,title,slug,category,price_cents,content_json,status,is_verified,priority_review,views,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const updateSeedUser = db.prepare(`UPDATE users SET name=? WHERE id=? AND email IS NULL`);
  const all = [...initialForSaleListings.filter(item => !item.isAnonymous), ...initialWtbListings.filter(item => !item.isAnonymous)];
  db.exec('BEGIN');
  try {
    for (const item of all) {
      const person = item.seller || item.buyer || { name: 'Searya Member' };
      let seedListing = findSeedListing.get(item.id);
      if (!seedListing) {
        const userId = `seed-${slugify(person.name)}`;
        const createdAt = item.createdAtIso || new Date(Date.now() - Math.max(1, Number(item.id?.match(/\d+/)?.[0] || 1)) * 3600000).toISOString();
        insertUser.run(userId, null, null, person.name, item.type === 'wtb' ? 'buyer' : 'seller', person.githubVerified ? 1 : 0, createdAt, createdAt);
        insertListing.run(item.id, userId, item.type === 'wtb' ? 'wtb' : 'sale', item.title, uniqueSlug(item.slug || item.title), item.category || 'saas', Math.round(Number(item.askingPrice || item.budget || 1) * 100), JSON.stringify(item), 'approved', item.status === 'Doğrulanmış' || item.statusEn === 'Verified' || item.isVerified ? 1 : 0, 0, Number(item.views || 0), createdAt, createdAt);
        seedListing = { user_id: userId };
      }
      update.run(
        item.type === 'wtb' ? 'wtb' : 'sale',
        item.title,
        uniqueSlug(item.slug || item.title, item.id),
        item.category || 'saas',
        Math.round(Number(item.askingPrice || item.budget || 1) * 100),
        JSON.stringify(item),
        item.status === 'Doğrulanmış' || item.statusEn === 'Verified' || item.isVerified ? 1 : 0,
        item.createdAtIso || nowIso(),
        item.id
      );
      updateSeedUser.run(person.name, seedListing.user_id);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function bootstrapAdmin() {
  const email = String(process.env.SEARYA_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.SEARYA_ADMIN_PASSWORD || '');
  if (!email || password.length < 8) return;
  const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if (existing) {
    db.prepare('UPDATE users SET is_admin=1,email_verified=1,status=\'active\' WHERE id=?').run(existing.id);
    db.prepare(`UPDATE users SET is_admin=0 WHERE email='admin@searya.local' AND id<>?`).run(existing.id);
    return;
  }
  const now = nowIso();
  const adminId = randomUUID();
  db.prepare(`INSERT INTO users(id,email,password_hash,name,role,status,is_admin,email_verified,is_verified,buyer_connections,seller_free_listings,seller_listing_credits,seller_vip_credits,created_at,last_seen_at) VALUES(?,?,?,?,?,'active',1,1,1,100,100,100,100,?,?)`).run(adminId, email, hashPassword(password), cleanText(process.env.SEARYA_ADMIN_NAME || 'Searya Admin', 80), 'both', now, now);
  db.prepare(`UPDATE users SET is_admin=0 WHERE email='admin@searya.local' AND id<>?`).run(adminId);
}

function primaryAdmin() {
  return db.prepare("SELECT * FROM users WHERE is_admin=1 AND status='active' ORDER BY CASE WHEN email=? THEN 0 ELSE 1 END,created_at LIMIT 1").get(String(process.env.SEARYA_ADMIN_EMAIL || '').trim().toLowerCase());
}

function routeSeedListingThreadsToAdmin() {
  const admin = primaryAdmin();
  if (!admin) return;
  const rows = db.prepare(`SELECT t.*,l.user_id AS seed_owner_id FROM threads t JOIN listings l ON l.id=t.listing_id WHERE l.user_id LIKE 'seed-%' AND t.user_a<>? AND t.user_b<>?`).all(admin.id, admin.id);
  db.exec('BEGIN');
  try {
    for (const thread of rows) {
      const visitorId = thread.user_a === thread.seed_owner_id ? thread.user_b : thread.user_a;
      const pair = [visitorId, admin.id].sort();
      const existing = db.prepare('SELECT id FROM threads WHERE listing_id=? AND user_a=? AND user_b=?').get(thread.listing_id, pair[0], pair[1]);
      if (existing) {
        db.prepare('UPDATE messages SET thread_id=? WHERE thread_id=?').run(existing.id, thread.id);
        db.prepare('UPDATE threads SET updated_at=? WHERE id=?').run(thread.updated_at, existing.id);
        db.prepare('DELETE FROM threads WHERE id=?').run(thread.id);
      } else {
        db.prepare('UPDATE threads SET user_a=?,user_b=? WHERE id=?').run(pair[0], pair[1], thread.id);
      }
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

seedData();
syncSeedContent();
bootstrapAdmin();
routeSeedListingThreadsToAdmin();

async function handleApi(req, res, url) {
  const method = req.method || 'GET';
  const pathname = url.pathname;
  const oauthStartMatch = pathname.match(/^\/api\/auth\/oauth\/(google)\/start$/);
  const oauthCallbackMatch = pathname.match(/^\/api\/auth\/oauth\/(google)\/callback$/);
  if (method === 'GET' && oauthStartMatch) return beginOauth(req, res, url, oauthStartMatch[1]);
  if (oauthCallbackMatch && method === 'GET') return completeOauth(req, res, url, oauthCallbackMatch[1]);
  const mutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  if (mutation) {
    const origin = req.headers.origin;
    const requestHost = String(req.headers.host || '');
    const sameHostOrigins = new Set([APP_ORIGIN, `http://${requestHost}`, `https://${requestHost}`]);
    if (origin && !sameHostOrigins.has(origin)) return fail(res, 403, 'BAD_ORIGIN', 'The request origin could not be verified.');
  }

  if (method === 'GET' && pathname === '/api/health') {
    return json(res, 200, { ok: true, service: 'searya-api', environment: NODE_ENV, paymentMode: PAYMENT_MODE, launchFree: LAUNCH_FREE_MODE, launchLimits: { activeListings: LAUNCH_FREE_LISTING_LIMIT, newConnections: LAUNCH_FREE_CONNECTION_LIMIT, connectionWindowDays: LAUNCH_FREE_CONNECTION_WINDOW_DAYS }, paymentServer: PAYMENT_MODE === 'polar' ? polarServer() : null, paymentConfigured: PAYMENT_MODE === 'polar' ? polarPaymentConfigured() : PAYMENT_MODE === 'demo' && NODE_ENV !== 'production', emailConfigured: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM), socialAuth: { google: socialAuthConfigured('google') }, time: nowIso() });
  }

  if (method === 'POST' && pathname === '/api/analytics/pageview') {
    if (rateLimited(req, 'pageview', 240, 60 * 60 * 1000)) return json(res, 202, { ok: true });
    const body = await readJson(req);
    const cookies = parseCookies(req);
    const existingId = String(cookies[VISITOR_COOKIE] || '');
    const visitorId = /^[a-f0-9-]{20,50}$/i.test(existingId) ? existingId : randomUUID();
    const path = cleanText(body.path || '/', 500);
    const attribution = analyticsAttribution(path, body.referrer || req.headers.referer || '');
    db.prepare('INSERT INTO page_views(id,visitor_id,path,source,medium,campaign,content,term,referrer,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run(randomUUID(), visitorId, path, attribution.source, attribution.medium, attribution.campaign, attribution.content, attribution.term, attribution.referrer, nowIso());
    return json(res, 201, { ok: true }, existingId ? {} : { 'Set-Cookie': visitorCookie(visitorId) });
  }

  if (method === 'POST' && pathname === '/api/analytics/event') {
    if (rateLimited(req, 'behavior-event', 1200, 60 * 60 * 1000)) return json(res, 202, { ok: true, tracked: false });
    const body = await readJson(req);
    const eventName = cleanText(body.eventName, 60);
    const tracked = recordBehaviorEvent(req, eventName, body.metadata);
    return json(res, tracked ? 201 : 202, { ok: true, tracked });
  }

  if (method === 'POST' && pathname === '/api/analytics/presence') {
    if (rateLimited(req, 'presence', 6000, 60 * 60 * 1000)) return json(res, 202, { ok: true });
    const visitorId = analyticsVisitorId(req);
    if (!visitorId) return json(res, 202, { ok: true, tracked: false });
    const body = await readJson(req);
    const sessionId = String(body.sessionId || '');
    if (!/^[a-f0-9-]{20,50}$/i.test(sessionId)) return fail(res, 422, 'INVALID_PRESENCE_SESSION', 'The visitor session could not be verified.');
    const action = ['enter', 'heartbeat', 'leave'].includes(body.action) ? body.action : 'heartbeat';
    const path = cleanText(body.path || '/', 500);
    const device = ['mobile', 'tablet', 'desktop'].includes(body.device) ? body.device : 'unknown';
    const user = getUser(req);
    const now = nowIso();
    if (action === 'leave') {
      db.prepare(`UPDATE visitor_sessions SET user_id=COALESCE(?,user_id),path=?,device=?,last_seen_at=?,ended_at=?,end_reason='leave' WHERE session_id=? AND visitor_id=?`).run(user?.id || null, path, device, now, now, sessionId, visitorId);
    } else {
      db.prepare(`INSERT INTO visitor_sessions(session_id,visitor_id,user_id,path,device,started_at,last_seen_at,ended_at,end_reason)
        VALUES(?,?,?,?,?,?,?,NULL,'')
        ON CONFLICT(session_id) DO UPDATE SET user_id=COALESCE(excluded.user_id,visitor_sessions.user_id),path=excluded.path,device=excluded.device,last_seen_at=excluded.last_seen_at,ended_at=NULL,end_reason=''
        WHERE visitor_sessions.visitor_id=excluded.visitor_id`).run(sessionId, visitorId, user?.id || null, path, device, now, now);
    }
    return json(res, action === 'enter' ? 201 : 200, { ok: true, tracked: true });
  }

  if (method === 'DELETE' && pathname === '/api/analytics/consent') {
    const visitorId = String(parseCookies(req)[VISITOR_COOKIE] || '');
    if (visitorId) {
      db.prepare('DELETE FROM page_views WHERE visitor_id=?').run(visitorId);
      db.prepare('DELETE FROM analytics_events WHERE visitor_id=?').run(visitorId);
      db.prepare('DELETE FROM visitor_sessions WHERE visitor_id=?').run(visitorId);
    }
    return json(res, 200, { ok: true }, { 'Set-Cookie': visitorCookie('', true) });
  }

  if (method === 'POST' && pathname === '/api/polar/webhook') {
    if (!process.env.POLAR_WEBHOOK_SECRET) return fail(res, 503, 'PAYMENT_NOT_CONFIGURED', 'The payment webhook secret is not configured.');
    const raw = await readBody(req, 2 * 1024 * 1024);
    let event;
    try {
      event = validateEvent(raw, req.headers, process.env.POLAR_WEBHOOK_SECRET);
    } catch (error) {
      if (error instanceof WebhookVerificationError) return fail(res, 403, 'INVALID_SIGNATURE', 'The webhook signature is invalid.');
      throw error;
    }
    if (event.type === 'order.paid') {
      const result = fulfillPolarOrder(event.data);
      if (!result.fulfilled) {
        console.warn(`Polar order ignored: ${result.reason}`);
      } else if (result.granted) {
        const recipient = db.prepare('SELECT email FROM users WHERE id=?').get(result.userId);
        const pack = packages[result.packageKey];
        if (recipient?.email) sendEmail({ to: recipient.email, subject: 'Your Searya plan is active', text: `${pack.name} has been added to your account.`, idempotencyKey: `purchase-${result.purchaseId}` }).catch(console.error);
      }
    }
    return json(res, 202, { received: true });
  }

  if (method === 'POST' && pathname === '/api/auth/register') {
    if (rateLimited(req, 'register', 8, 60 * 60 * 1000)) return fail(res, 429, 'RATE_LIMIT', 'Too many registration attempts. Please try again later.');
    if (NODE_ENV === 'production' && (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)) return fail(res, 503, 'EMAIL_NOT_CONFIGURED', 'The registration email service is not configured.');
    const body = await readJson(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const name = cleanText(body.name, 80);
    const role = ['buyer', 'seller', 'both'].includes(body.role) ? body.role : 'buyer';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || name.length < 2) return fail(res, 422, 'INVALID_INPUT', 'A name, valid email and password of at least 8 characters are required.');
    if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email)) return fail(res, 409, 'EMAIL_EXISTS', 'An account already exists with this email address.');
    const id = randomUUID();
    const now = nowIso();
    const verificationRequired = NODE_ENV === 'production';
    db.prepare(`INSERT INTO users(id,email,password_hash,name,role,status,is_admin,email_verified,is_verified,buyer_connections,seller_free_listings,seller_listing_credits,seller_vip_credits,created_at,last_seen_at) VALUES(?,?,?,?,?,'active',0,?,0,2,1,0,0,?,?)`).run(id, email, hashPassword(password), name, role, verificationRequired ? 0 : 1, now, now);
    if (verificationRequired) {
      try {
        await sendVerificationEmail({ id, email, name });
      } catch (error) {
        db.prepare('DELETE FROM email_verifications WHERE user_id=?').run(id);
        db.prepare('DELETE FROM users WHERE id=?').run(id);
        throw error;
      }
      recordAnalyticsEvent(req, 'signup_completed', { method: 'email', role });
      return json(res, 201, { user: null, verificationRequired: true });
    }
    const token = createSession(id);
    recordAnalyticsEvent(req, 'signup_completed', { method: 'email', role });
    sendEmail({ to: email, subject: 'Your Searya account is ready', text: `Hi ${name}, your Searya account has been created.`, idempotencyKey: `welcome-${id}` }).catch(console.error);
    return json(res, 201, { user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(id)), verificationRequired: false }, { 'Set-Cookie': sessionCookie(token) });
  }

  if (method === 'POST' && pathname === '/api/auth/login') {
    if (rateLimited(req, 'login', 20, 15 * 60 * 1000)) return fail(res, 429, 'RATE_LIMIT', 'Too many sign-in attempts. Please try again later.');
    const body = await readJson(req);
    const email = String(body.email || '').trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    if (!user || !verifyPassword(body.password, user.password_hash) || user.status !== 'active') return fail(res, 401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');
    if (!user.email_verified) return fail(res, 403, 'EMAIL_NOT_VERIFIED', 'Verify your email address before signing in.');
    const token = createSession(user.id);
    return json(res, 200, { user: publicUser(user) }, { 'Set-Cookie': sessionCookie(token) });
  }

  if (method === 'POST' && pathname === '/api/auth/logout') {
    const token = parseCookies(req)[SESSION_COOKIE];
    if (token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(sha256(token));
    return json(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', true) });
  }

  if (method === 'GET' && pathname === '/api/auth/me') {
    return json(res, 200, { user: publicUser(getUser(req)) });
  }

  if (method === 'GET' && pathname === '/api/me/listings') {
    const user = requireUser(req, res); if (!user) return;
    const rows = db.prepare('SELECT * FROM listings WHERE user_id=? ORDER BY created_at DESC').all(user.id);
    return json(res, 200, { listings: rows.map(listingFromRow) });
  }

  if (method === 'POST' && pathname === '/api/account/change-password') {
    const user = requireUser(req, res); if (!user) return;
    const body = await readJson(req);
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');
    if (!verifyPassword(currentPassword, user.password_hash)) return fail(res, 422, 'INVALID_PASSWORD', 'The current password is incorrect.');
    if (newPassword.length < 8) return fail(res, 422, 'WEAK_PASSWORD', 'The new password must be at least 8 characters.');
    db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hashPassword(newPassword), user.id);
    const currentTokenHash = sha256(parseCookies(req)[SESSION_COOKIE] || '');
    db.prepare('DELETE FROM sessions WHERE user_id=? AND token_hash<>?').run(user.id, currentTokenHash);
    return json(res, 200, { ok: true });
  }

  if (method === 'GET' && pathname === '/api/account/export') {
    const user = requireUser(req, res); if (!user) return;
    const listings = db.prepare('SELECT * FROM listings WHERE user_id=? ORDER BY created_at DESC').all(user.id).map(listingFromRow);
    const purchases = db.prepare('SELECT id,package_key AS packageKey,amount_cents AS amountCents,currency,status,created_at AS createdAt FROM purchases WHERE user_id=? ORDER BY created_at DESC').all(user.id);
    const alerts = db.prepare('SELECT id,query,category,min_price AS minPrice,max_price AS maxPrice,frequency,created_at AS createdAt FROM alerts WHERE user_id=? ORDER BY created_at DESC').all(user.id);
    const threads = db.prepare('SELECT id,listing_id AS listingId,created_at AS createdAt,updated_at AS updatedAt FROM threads WHERE user_a=? OR user_b=? ORDER BY updated_at DESC').all(user.id, user.id).map(thread => ({ ...thread, messages: db.prepare('SELECT sender_id AS senderId,body,created_at AS createdAt FROM messages WHERE thread_id=? ORDER BY created_at').all(thread.id) }));
    return json(res, 200, { exportedAt: nowIso(), account: publicUser(user), listings, purchases, alerts, threads });
  }

  if (method === 'DELETE' && pathname === '/api/account') {
    const user = requireUser(req, res); if (!user) return;
    const body = await readJson(req);
    if (user.is_admin) return fail(res, 422, 'ADMIN_ACCOUNT', 'The primary administrator account cannot be deleted here.');
    if (!verifyPassword(String(body.password || ''), user.password_hash) || !['DELETE MY ACCOUNT', 'HESABIMI SİL'].includes(body.confirmation)) return fail(res, 422, 'INVALID_CONFIRMATION', 'The password or deletion confirmation is incorrect.');
    db.exec('BEGIN');
    try {
      db.prepare(`DELETE FROM reports WHERE target_type='user' AND target_id=?`).run(user.id);
      db.prepare('DELETE FROM listings WHERE user_id=?').run(user.id);
      db.prepare('DELETE FROM users WHERE id=?').run(user.id);
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
    return json(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', true) });
  }

  if (method === 'POST' && pathname === '/api/auth/forgot-password') {
    if (rateLimited(req, 'forgot', 6, 60 * 60 * 1000)) return fail(res, 429, 'RATE_LIMIT', 'Please try again later.');
    const body = await readJson(req);
    const email = String(body.email || '').trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    let previewToken = null;
    if (user) {
      const token = randomBytes(32).toString('base64url');
      const createdAt = nowIso();
      db.prepare('INSERT INTO password_resets(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').run(sha256(token), user.id, new Date(Date.now() + 30 * 60 * 1000).toISOString(), createdAt);
      const resetUrl = `${APP_ORIGIN}/?reset_token=${encodeURIComponent(token)}`;
      const mail = await sendEmail({ to: email, subject: 'Reset your Searya password', text: `Reset your password within 30 minutes: ${resetUrl}`, idempotencyKey: `reset-${sha256(token).slice(0, 24)}` }).catch(() => ({ configured: false }));
      if (!mail.configured && NODE_ENV !== 'production') previewToken = token;
    }
    return json(res, 200, { ok: true, message: 'If the account exists, reset instructions have been sent.', ...(previewToken ? { previewToken } : {}) });
  }

  if (method === 'POST' && pathname === '/api/auth/resend-verification') {
    if (rateLimited(req, 'resend-verification', 5, 60 * 60 * 1000)) return fail(res, 429, 'RATE_LIMIT', 'Please try again later.');
    if (NODE_ENV === 'production' && (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)) return fail(res, 503, 'EMAIL_NOT_CONFIGURED', 'The email service is not configured.');
    const body = await readJson(req);
    const email = String(body.email || '').trim().toLowerCase();
    const user = db.prepare(`SELECT id,email,name,email_verified FROM users WHERE email=? AND status='active'`).get(email);
    if (user && !user.email_verified) await sendVerificationEmail(user);
    return json(res, 200, { ok: true, message: 'If the account is unverified, a new link has been sent.' });
  }

  if (method === 'POST' && pathname === '/api/auth/reset-password') {
    const body = await readJson(req);
    const password = String(body.password || '');
    const tokenHash = sha256(String(body.token || ''));
    const reset = db.prepare('SELECT * FROM password_resets WHERE token_hash=? AND expires_at>? AND used_at IS NULL').get(tokenHash, nowIso());
    if (!reset || password.length < 8) return fail(res, 422, 'INVALID_RESET', 'The link is invalid or has expired.');
    db.exec('BEGIN');
    try {
      db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hashPassword(password), reset.user_id);
      db.prepare('UPDATE password_resets SET used_at=? WHERE token_hash=?').run(nowIso(), tokenHash);
      db.prepare('DELETE FROM sessions WHERE user_id=?').run(reset.user_id);
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
    return json(res, 200, { ok: true });
  }

  if (method === 'POST' && pathname === '/api/auth/verify-email') {
    const body = await readJson(req);
    const tokenHash = sha256(String(body.token || ''));
    const verification = db.prepare('SELECT * FROM email_verifications WHERE token_hash=? AND expires_at>? AND used_at IS NULL').get(tokenHash, nowIso());
    if (!verification) return fail(res, 422, 'INVALID_VERIFICATION', 'The verification link is invalid or has expired.');
    db.exec('BEGIN');
    try {
      db.prepare('UPDATE users SET email_verified=1 WHERE id=?').run(verification.user_id);
      db.prepare('UPDATE email_verifications SET used_at=? WHERE token_hash=?').run(nowIso(), tokenHash);
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
    const token = createSession(verification.user_id);
    return json(res, 200, { user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(verification.user_id)) }, { 'Set-Cookie': sessionCookie(token) });
  }

  if (method === 'GET' && pathname === '/api/listings') {
    const type = url.searchParams.get('type');
    const clauses = [`status='approved'`];
    const params = [];
    if (type === 'sale' || type === 'wtb') { clauses.push('type=?'); params.push(type); }
    const viewer = getUser(req);
    let rows = db.prepare(`SELECT * FROM listings WHERE ${clauses.join(' AND ')} ORDER BY (boosted_until IS NOT NULL AND boosted_until>?) DESC, boosted_until DESC, created_at DESC`).all(...params, nowIso());
    if (viewer) {
      const blocked = new Set(db.prepare('SELECT blocked_id AS id FROM blocks WHERE blocker_id=? UNION SELECT blocker_id AS id FROM blocks WHERE blocked_id=?').all(viewer.id, viewer.id).map(item => item.id));
      rows = rows.filter(row => !blocked.has(row.user_id));
    }
    return json(res, 200, { listings: rows.map(listingFromRow) });
  }

  const listingMatch = pathname.match(/^\/api\/listings\/([^/]+)$/);
  const listingViewMatch = pathname.match(/^\/api\/listings\/([^/]+)\/view$/);
  if (method === 'POST' && listingViewMatch) {
    const id = decodeURIComponent(listingViewMatch[1]);
    const row = db.prepare(`SELECT id,views FROM listings WHERE (id=? OR slug=?) AND status='approved'`).get(id, id);
    if (!row) return fail(res, 404, 'NOT_FOUND', 'Listing not found.');
    if (!rateLimited(req, `listing-view:${row.id}`, 1, 10 * 60 * 1000)) db.prepare('UPDATE listings SET views=views+1 WHERE id=?').run(row.id);
    return json(res, 200, { views: db.prepare('SELECT views FROM listings WHERE id=?').get(row.id).views });
  }

  if (method === 'GET' && listingMatch) {
    const slug = decodeURIComponent(listingMatch[1]);
    const row = db.prepare(`SELECT * FROM listings WHERE (slug=? OR id=?) AND status='approved'`).get(slug, slug);
    if (!row) return fail(res, 404, 'NOT_FOUND', 'Listing not found.');
    return json(res, 200, { listing: listingFromRow(row) });
  }

  if (method === 'POST' && pathname === '/api/listings') {
    const user = requireUser(req, res); if (!user) return;
    if (rateLimited(req, `listing:${user.id}`, 10, 60 * 60 * 1000)) return fail(res, 429, 'RATE_LIMIT', 'You have reached the hourly listing limit.');
    const input = mapListingInput(await readJson(req), user);
    const priorityReview = 0;
    const id = randomUUID();
    const createdAt = nowIso();
    const status = user.is_admin ? 'approved' : 'pending';
    db.exec('BEGIN IMMEDIATE');
    try {
      if (LAUNCH_FREE_MODE && !user.is_admin) {
        const activeListingCount = Number(db.prepare("SELECT COUNT(*) AS count FROM listings WHERE user_id=? AND status IN ('pending','approved')").get(user.id)?.count || 0);
        if (activeListingCount >= LAUNCH_FREE_LISTING_LIMIT) throw Object.assign(new Error(`You can publish up to ${LAUNCH_FREE_LISTING_LIMIT} active listings during the free launch.`), { status: 422, code: 'FREE_LAUNCH_LISTING_LIMIT' });
      } else if (input.type === 'sale') {
        const freeCredit = db.prepare('UPDATE users SET seller_free_listings=seller_free_listings-1 WHERE id=? AND seller_free_listings>0').run(user.id);
        if (!freeCredit.changes) {
          const paidCredit = db.prepare('UPDATE users SET seller_listing_credits=seller_listing_credits-1 WHERE id=? AND seller_listing_credits>0').run(user.id);
          if (!paidCredit.changes) throw Object.assign(new Error('A new seller listing pack is required.'), { status: 402, code: 'LISTING_CREDIT_REQUIRED' });
        }
      }
      db.prepare(`INSERT INTO listings(id,user_id,type,title,slug,category,price_cents,content_json,status,is_verified,priority_review,views,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,0,?,0,?,?)`).run(id, user.id, input.type, input.title, uniqueSlug(input.title), input.category, Math.round(input.price * 100), JSON.stringify(input.content), status, priorityReview, createdAt, createdAt);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      if (error.code === 'LISTING_CREDIT_REQUIRED') return fail(res, 402, error.code, error.message);
      if (error.code === 'FREE_LAUNCH_LISTING_LIMIT') return fail(res, 422, error.code, error.message);
      throw error;
    }
    const row = db.prepare('SELECT * FROM listings WHERE id=?').get(id);
    recordAnalyticsEvent(req, 'listing_created', { type: input.type });
    if (row.status === 'approved') notifySearchEngines([`/projects/${encodeURIComponent(row.slug)}`, '/sitemap.xml']);
    if (user.email) sendEmail({ to: user.email, subject: 'We received your Searya listing', text: `Your ${input.title} listing ${status === 'pending' ? 'is under security review' : 'has been published'}.`, idempotencyKey: `listing-${id}` }).catch(console.error);
    return json(res, 201, { listing: listingFromRow(row), moderation: status === 'pending' ? 'pending' : 'approved', user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(user.id)) });
  }

  const listingAddonMatch = pathname.match(/^\/api\/listings\/([^/]+)\/addon$/);
  if (method === 'POST' && listingAddonMatch) {
    const user = requireUser(req, res); if (!user) return;
    const id = decodeURIComponent(listingAddonMatch[1]);
    const row = db.prepare('SELECT * FROM listings WHERE id=?').get(id);
    if (!row) return fail(res, 404, 'NOT_FOUND', 'Listing not found.');
    if (row.user_id !== user.id && !user.is_admin) return fail(res, 403, 'FORBIDDEN', 'You cannot apply this credit to the listing.');
    if (row.type !== 'sale') return fail(res, 422, 'SALE_LISTING_REQUIRED', 'This credit can only be used on projects for sale.');
    const body = await readJson(req);
    if (body.addon === 'verification') {
      if (row.is_verified) return fail(res, 422, 'ALREADY_VERIFIED', 'This listing is already verified.');
      const freshUser = db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
      if (freshUser.seller_vip_credits <= 0) return fail(res, 402, 'VERIFICATION_CREDIT_REQUIRED', 'You do not have a verification review credit.');
      db.exec('BEGIN');
      try {
        db.prepare('UPDATE users SET seller_vip_credits=seller_vip_credits-1 WHERE id=?').run(user.id);
        db.prepare(`UPDATE listings SET priority_review=1,status='pending',is_verified=0,updated_at=? WHERE id=?`).run(nowIso(), id);
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    } else if (body.addon === 'boost') {
      if (row.status !== 'approved') return fail(res, 422, 'APPROVED_LISTING_REQUIRED', 'Only published listings can be boosted.');
      const freshUser = db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
      if (freshUser.boost_credits <= 0) return fail(res, 402, 'BOOST_CREDIT_REQUIRED', 'You do not have a listing boost credit.');
      const currentEnd = row.boosted_until && new Date(row.boosted_until).getTime() > Date.now() ? new Date(row.boosted_until).getTime() : Date.now();
      const boostedUntil = new Date(currentEnd + 7 * 24 * 60 * 60 * 1000).toISOString();
      db.exec('BEGIN');
      try {
        db.prepare('UPDATE users SET boost_credits=boost_credits-1 WHERE id=?').run(user.id);
        db.prepare('UPDATE listings SET boosted_until=?,updated_at=? WHERE id=?').run(boostedUntil, nowIso(), id);
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    } else return fail(res, 422, 'INVALID_ADDON', 'Invalid listing credit.');
    return json(res, 200, {
      listing: listingFromRow(db.prepare('SELECT * FROM listings WHERE id=?').get(id)),
      user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(user.id))
    });
  }

  if ((method === 'PATCH' || method === 'DELETE') && listingMatch) {
    const user = requireUser(req, res); if (!user) return;
    const id = decodeURIComponent(listingMatch[1]);
    const row = db.prepare('SELECT * FROM listings WHERE id=?').get(id);
    if (!row) return fail(res, 404, 'NOT_FOUND', 'Listing not found.');
    if (row.user_id !== user.id && !user.is_admin) return fail(res, 403, 'FORBIDDEN', 'You cannot edit this listing.');
    if (method === 'DELETE') { db.prepare('DELETE FROM listings WHERE id=?').run(id); return json(res, 200, { ok: true }); }
    const input = mapListingInput(await readJson(req), user);
    db.prepare(`UPDATE listings SET type=?,title=?,slug=?,category=?,price_cents=?,content_json=?,status=?,is_verified=0,updated_at=? WHERE id=?`).run(input.type, input.title, uniqueSlug(input.title, id), input.category, Math.round(input.price * 100), JSON.stringify(input.content), user.is_admin ? row.status : 'pending', nowIso(), id);
    const updated = db.prepare('SELECT * FROM listings WHERE id=?').get(id);
    return json(res, 200, { listing: listingFromRow(updated), moderation: updated.status, user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(user.id)) });
  }

  if (method === 'GET' && pathname === '/api/threads/unread-count') {
    const user = requireUser(req, res); if (!user) return;
    return json(res, 200, { unreadCount: unreadMessageCount(user.id) });
  }

  if (method === 'GET' && pathname === '/api/threads') {
    const user = requireUser(req, res); if (!user) return;
    const rows = db.prepare(`SELECT t.*,l.title,l.price_cents,l.type,u1.name AS a_name,u2.name AS b_name FROM threads t JOIN listings l ON l.id=t.listing_id JOIN users u1 ON u1.id=t.user_a JOIN users u2 ON u2.id=t.user_b WHERE t.user_a=? OR t.user_b=? ORDER BY t.updated_at DESC`).all(user.id, user.id);
    const result = rows.map(thread => {
      const managedBySearya = String(thread.user_a === user.id ? thread.user_b : thread.user_a).startsWith('seed-') || Boolean(db.prepare(`SELECT 1 FROM listings WHERE id=? AND user_id LIKE 'seed-%'`).get(thread.listing_id));
      const partnerName = managedBySearya ? 'Searya Showcase Desk' : (thread.user_a === user.id ? thread.b_name : thread.a_name);
      const messages = db.prepare('SELECT * FROM messages WHERE thread_id=? ORDER BY created_at').all(thread.id).map(message => ({ id: message.id, sender: message.sender_id === user.id ? 'me' : 'them', text: message.body, textEn: message.body, time: new Date(message.created_at).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }));
      const unreadCount = db.prepare('SELECT COUNT(*) AS count FROM messages WHERE thread_id=? AND sender_id<>? AND read_at IS NULL').get(thread.id, user.id).count;
      return { id: thread.id, listingId: thread.listing_id, partnerName, partnerAvatar: '', projectTitle: thread.title, askingPrice: `$${(thread.price_cents / 100).toLocaleString('en-US')}`, unread: unreadCount > 0, unreadCount, messages, managedBySearya };
    });
    return json(res, 200, { threads: result, user: publicUser(user) });
  }

  if (method === 'POST' && pathname === '/api/threads') {
    const user = requireUser(req, res); if (!user) return;
    const body = await readJson(req);
    const listing = db.prepare(`SELECT l.*,u.name AS owner_name FROM listings l JOIN users u ON u.id=l.user_id WHERE l.id=? AND l.status='approved'`).get(String(body.listingId || ''));
    if (!listing) return fail(res, 404, 'NOT_FOUND', 'Listing not found.');
    const seedListing = String(listing.user_id).startsWith('seed-');
    const managedRecipient = seedListing ? primaryAdmin() : null;
    if (seedListing && !managedRecipient) return fail(res, 503, 'ADMIN_UNAVAILABLE', 'Searya support is temporarily unavailable for this showcase listing.');
    const recipientId = managedRecipient?.id || listing.user_id;
    if (recipientId === user.id) return fail(res, 422, 'OWN_LISTING', 'You cannot message your own listing.');
    const pair = [user.id, recipientId].sort();
    if (db.prepare('SELECT 1 FROM blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?)').get(user.id, recipientId, recipientId, user.id)) return fail(res, 403, 'USER_BLOCKED', 'A new conversation cannot be started with this user.');
    let thread = db.prepare('SELECT * FROM threads WHERE listing_id=? AND user_a=? AND user_b=?').get(listing.id, pair[0], pair[1]);
    let createdThread = false;
    let initialMessageId = '';
    if (!thread) {
      db.exec('BEGIN IMMEDIATE');
      try {
        thread = db.prepare('SELECT * FROM threads WHERE listing_id=? AND user_a=? AND user_b=?').get(listing.id, pair[0], pair[1]);
        if (!thread) {
          if (listing.type === 'sale') {
            const contacted = db.prepare('SELECT 1 FROM contacted_projects WHERE user_id=? AND listing_id=?').get(user.id, listing.id);
            if (!contacted) {
              if (LAUNCH_FREE_MODE && !user.is_admin) {
                if (launchFreeConnectionsRemaining(user.id) <= 0) throw Object.assign(new Error(`You have reached the limit of ${LAUNCH_FREE_CONNECTION_LIMIT} new seller connections in ${LAUNCH_FREE_CONNECTION_WINDOW_DAYS} days. You can keep messaging in existing conversations.`), { status: 422, code: 'FREE_LAUNCH_CONNECTION_LIMIT' });
              } else {
                const credit = db.prepare('UPDATE users SET buyer_connections=buyer_connections-1 WHERE id=? AND buyer_connections>0').run(user.id);
                if (!credit.changes) throw Object.assign(new Error('A connection pack is required to contact a new seller.'), { status: 402, code: 'CONNECTION_CREDIT_REQUIRED' });
              }
              db.prepare('INSERT INTO contacted_projects(user_id,listing_id,created_at) VALUES(?,?,?)').run(user.id, listing.id, nowIso());
            }
          }
          const id = randomUUID();
          const createdAt = nowIso();
          db.prepare('INSERT INTO threads(id,listing_id,user_a,user_b,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(id, listing.id, pair[0], pair[1], createdAt, createdAt);
          initialMessageId = randomUUID();
          db.prepare('INSERT INTO messages(id,thread_id,sender_id,body,created_at) VALUES(?,?,?,?,?)').run(initialMessageId, id, user.id, cleanText(body.message || `I'd like to discuss the ${listing.title} listing.`, 1000), createdAt);
          thread = db.prepare('SELECT * FROM threads WHERE id=?').get(id);
          createdThread = true;
        }
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        if (error.code === 'CONNECTION_CREDIT_REQUIRED') return fail(res, 402, error.code, error.message);
        if (error.code === 'FREE_LAUNCH_CONNECTION_LIMIT') return fail(res, 422, error.code, error.message);
        throw error;
      }
    }
    if (createdThread) {
      recordAnalyticsEvent(req, 'conversation_started');
      const recipient = db.prepare('SELECT email FROM users WHERE id=?').get(recipientId);
      if (recipient?.email) sendEmail({ to: recipient.email, subject: seedListing ? 'New message about a Searya showcase listing' : 'A new conversation started on Searya', text: `${user.name} contacted you about ${listing.title}. ${seedListing ? 'This is a Searya-managed showcase listing; reply from the admin message queue.' : ''}`, idempotencyKey: `thread-${initialMessageId}` }).catch(console.error);
    }
    return json(res, 201, { threadId: thread.id, user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(user.id)) });
  }

  const messageMatch = pathname.match(/^\/api\/threads\/([^/]+)\/messages$/);
  const threadReadMatch = pathname.match(/^\/api\/threads\/([^/]+)\/read$/);
  if (method === 'POST' && threadReadMatch) {
    const user = requireUser(req, res); if (!user) return;
    const thread = db.prepare('SELECT id FROM threads WHERE id=? AND (user_a=? OR user_b=?)').get(decodeURIComponent(threadReadMatch[1]), user.id, user.id);
    if (!thread) return fail(res, 404, 'NOT_FOUND', 'Conversation not found.');
    db.prepare('UPDATE messages SET read_at=? WHERE thread_id=? AND sender_id<>? AND read_at IS NULL').run(nowIso(), thread.id, user.id);
    return json(res, 200, { ok: true, unreadCount: unreadMessageCount(user.id) });
  }

  if (method === 'POST' && messageMatch) {
    const user = requireUser(req, res); if (!user) return;
    if (rateLimited(req, `message:${user.id}`, 60, 60 * 1000)) return fail(res, 429, 'RATE_LIMIT', 'You are sending messages too quickly.');
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND (user_a=? OR user_b=?)').get(decodeURIComponent(messageMatch[1]), user.id, user.id);
    if (!thread) return fail(res, 404, 'NOT_FOUND', 'Conversation not found.');
    const partnerId = thread.user_a === user.id ? thread.user_b : thread.user_a;
    if (db.prepare('SELECT 1 FROM blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?)').get(user.id, partnerId, partnerId, user.id)) return fail(res, 403, 'USER_BLOCKED', 'You cannot message a blocked user.');
    const body = await readJson(req);
    const text = cleanText(body.message, 1000);
    if (!text) return fail(res, 422, 'EMPTY_MESSAGE', 'Message cannot be empty.');
    const count = db.prepare('SELECT COUNT(*) AS count FROM messages WHERE thread_id=?').get(thread.id).count;
    if (count < CONTACT_UNLOCK_MESSAGE_COUNT && contactInfoDetected(text)) return fail(res, 422, 'CONTACT_INFO_LOCKED', `Contact details can be shared after the first ${CONTACT_UNLOCK_MESSAGE_COUNT} messages.`);
    const recipientId = partnerId;
    const alreadyUnread = Boolean(db.prepare('SELECT 1 FROM messages WHERE thread_id=? AND sender_id<>? AND read_at IS NULL LIMIT 1').get(thread.id, recipientId));
    const createdAt = nowIso();
    const id = randomUUID();
    db.prepare('INSERT INTO messages(id,thread_id,sender_id,body,created_at) VALUES(?,?,?,?,?)').run(id, thread.id, user.id, text, createdAt);
    db.prepare('UPDATE threads SET updated_at=? WHERE id=?').run(createdAt, thread.id);
    const recipient = db.prepare('SELECT email,name FROM users WHERE id=?').get(recipientId);
    if (!alreadyUnread && recipient?.email) sendEmail({ to: recipient.email, subject: 'You have a new message on Searya', text: `${user.name} sent you a new message: ${text.slice(0, 180)}`, idempotencyKey: `message-${id}` }).catch(console.error);
    return json(res, 201, { message: { id, sender: 'me', text, textEn: text, time: 'Now' } });
  }

  if (method === 'GET' && pathname === '/api/packages') return json(res, 200, { packages: LAUNCH_FREE_MODE ? [] : Object.values(packages), mode: PAYMENT_MODE, launchFree: LAUNCH_FREE_MODE });

  if (method === 'POST' && pathname === '/api/packages/checkout') {
    const user = requireUser(req, res); if (!user) return;
    if (LAUNCH_FREE_MODE) return fail(res, 409, 'FREE_LAUNCH_ACTIVE', 'Searya is free during launch; no payment or plan purchase is required.');
    const body = await readJson(req);
    const pack = packages[body.packageKey];
    if (!pack) return fail(res, 404, 'PACKAGE_NOT_FOUND', 'Plan not found.');
    const purchaseId = randomUUID();
    const createdAt = nowIso();
    db.prepare('INSERT INTO purchases(id,user_id,package_key,amount_cents,currency,status,created_at,updated_at) VALUES(?,?,?,?,\'usd\',\'pending\',?,?)').run(purchaseId, user.id, pack.key, pack.amountCents, createdAt, createdAt);
    if (PAYMENT_MODE === 'demo' && NODE_ENV !== 'production') {
      db.exec('BEGIN');
      try {
        db.prepare('UPDATE purchases SET status=\'paid\',provider_ref=\'demo\',updated_at=? WHERE id=?').run(nowIso(), purchaseId);
        grantPackage(user.id, pack.key);
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
      if (user.email) sendEmail({ to: user.email, subject: 'Your Searya plan is active', text: `${pack.name} has been added to your account.`, idempotencyKey: `purchase-${purchaseId}` }).catch(console.error);
      return json(res, 200, { mode: 'demo', paid: true, packageKey: pack.key, amountCents: pack.amountCents, user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(user.id)) });
    }
    const productId = polarProductId(pack.key);
    if (PAYMENT_MODE !== 'polar' || !process.env.POLAR_ACCESS_TOKEN || !productId) return fail(res, 503, 'PAYMENT_NOT_CONFIGURED', 'The live payment provider has not been configured yet.');
    const polar = new Polar({ accessToken: process.env.POLAR_ACCESS_TOKEN, server: polarServer() });
    try {
      const checkout = await polar.checkouts.create({
        products: [productId],
        customerName: user.name,
        customerEmail: user.email,
        customerIpAddress: requestIpAddress(req),
        externalCustomerId: user.id,
        allowDiscountCodes: false,
        successUrl: `${APP_ORIGIN}/?payment=success&checkout_id={CHECKOUT_ID}`,
        returnUrl: `${APP_ORIGIN}/?payment=cancelled`,
        metadata: { purchase_id: purchaseId, user_id: user.id, package_key: pack.key }
      });
      db.prepare('UPDATE purchases SET provider_ref=?,updated_at=? WHERE id=?').run(checkout.id, nowIso(), purchaseId);
      return json(res, 200, { mode: 'polar', checkoutUrl: checkout.url });
    } catch (error) {
      console.error('Polar checkout error:', error?.message || error);
      db.prepare(`UPDATE purchases SET status='failed',updated_at=? WHERE id=?`).run(nowIso(), purchaseId);
      const paymentError = { code: 'PAYMENT_PROVIDER_ERROR', message: polarCheckoutErrorMessage(error) };
      if (user.is_admin) paymentError.diagnostic = polarErrorDiagnostic(error);
      return json(res, 502, { error: paymentError });
    }
  }

  if (method === 'POST' && pathname === '/api/reports') {
    const user = requireUser(req, res); if (!user) return;
    const body = await readJson(req);
    const targetType = ['listing', 'user', 'message'].includes(body.targetType) ? body.targetType : 'listing';
    const targetId = cleanText(body.targetId, 100);
    const reason = cleanText(body.reason, 500);
    if (!targetId || reason.length < 10) return fail(res, 422, 'INVALID_REPORT', 'Please explain the reason for your report.');
    db.prepare('INSERT INTO reports(id,reporter_id,target_type,target_id,reason,created_at) VALUES(?,?,?,?,?,?)').run(randomUUID(), user.id, targetType, targetId, reason, nowIso());
    return json(res, 201, { ok: true });
  }

  if (method === 'POST' && pathname === '/api/blocks') {
    const user = requireUser(req, res); if (!user) return;
    const body = await readJson(req);
    const blockedId = cleanText(body.userId, 100);
    if (!blockedId || blockedId === user.id || !db.prepare('SELECT 1 FROM users WHERE id=?').get(blockedId)) return fail(res, 422, 'INVALID_USER', 'User not found.');
    db.prepare('INSERT OR IGNORE INTO blocks(blocker_id,blocked_id,created_at) VALUES(?,?,?)').run(user.id, blockedId, nowIso());
    return json(res, 201, { ok: true });
  }

  if (method === 'POST' && pathname === '/api/alerts') {
    const user = requireUser(req, res); if (!user) return;
    const body = await readJson(req);
    const id = randomUUID();
    db.prepare('INSERT INTO alerts(id,user_id,query,category,min_price,max_price,frequency,created_at) VALUES(?,?,?,?,?,?,?,?)').run(id, user.id, cleanText(body.query, 100), cleanText(body.category || 'all', 30), Math.max(0, Number(body.minPrice || 0)), Math.max(1, Number(body.maxPrice || 10000000)), ['instant', 'daily', 'weekly'].includes(body.frequency) ? body.frequency : 'daily', nowIso());
    return json(res, 201, { id });
  }

  if (method === 'GET' && pathname === '/api/alerts') {
    const user = requireUser(req, res); if (!user) return;
    return json(res, 200, { alerts: db.prepare('SELECT id,query,category,min_price AS minPrice,max_price AS maxPrice,frequency,created_at AS createdAt FROM alerts WHERE user_id=? ORDER BY created_at DESC').all(user.id) });
  }

  const alertMatch = pathname.match(/^\/api\/alerts\/([^/]+)$/);
  if (method === 'DELETE' && alertMatch) {
    const user = requireUser(req, res); if (!user) return;
    db.prepare('DELETE FROM alerts WHERE id=? AND user_id=?').run(decodeURIComponent(alertMatch[1]), user.id);
    return json(res, 200, { ok: true });
  }

  if (method === 'GET' && pathname === '/api/admin/overview') {
    const user = requireUser(req, res, true); if (!user) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();
    const sevenDaysIso = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000); sevenDaysIso.setHours(0, 0, 0, 0);
    const thirtyDaysIso = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000); thirtyDaysIso.setHours(0, 0, 0, 0);
    const presenceCutoff = new Date(Date.now() - PRESENCE_ACTIVE_WINDOW_SECONDS * 1000).toISOString();
    db.prepare(`UPDATE visitor_sessions SET ended_at=last_seen_at,end_reason='timeout' WHERE ended_at IS NULL AND last_seen_at<?`).run(presenceCutoff);
    db.prepare('DELETE FROM visitor_sessions WHERE started_at<?').run(new Date(Date.now() - 90 * 86400000).toISOString());
    db.prepare('DELETE FROM analytics_events WHERE created_at<?').run(new Date(Date.now() - 180 * 86400000).toISOString());
    const dailyRows = db.prepare(`SELECT substr(created_at,1,10) AS day,COUNT(*) AS views,COUNT(DISTINCT visitor_id) AS visitors FROM page_views WHERE created_at>=? GROUP BY day`).all(sevenDaysIso.toISOString());
    const signupRows = db.prepare(`SELECT substr(created_at,1,10) AS day,COUNT(*) AS signups FROM users WHERE created_at>=? AND email IS NOT NULL AND is_admin=0 GROUP BY day`).all(sevenDaysIso.toISOString());
    const dailyMap = new Map(dailyRows.map(row => [row.day, row]));
    const signupMap = new Map(signupRows.map(row => [row.day, row.signups]));
    const daily = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(sevenDaysIso.getTime() + index * 86400000);
      const day = date.toISOString().slice(0, 10);
      return { day, views: dailyMap.get(day)?.views || 0, visitors: dailyMap.get(day)?.visitors || 0, signups: signupMap.get(day) || 0 };
    });
    const campaignVisits = db.prepare(`WITH ranked AS (
      SELECT visitor_id,source,medium,campaign,ROW_NUMBER() OVER(PARTITION BY visitor_id ORDER BY CASE WHEN source='direct' THEN 1 ELSE 0 END,created_at DESC) AS rank
      FROM page_views WHERE created_at>=?
    ) SELECT source,medium,campaign,COUNT(*) AS visitors FROM ranked WHERE rank=1 GROUP BY source,medium,campaign`).all(thirtyDaysIso.toISOString());
    const campaignEvents = db.prepare(`SELECT source,medium,campaign,event_name AS eventName,COUNT(DISTINCT visitor_id) AS total FROM analytics_events WHERE created_at>=? GROUP BY source,medium,campaign,event_name`).all(thirtyDaysIso.toISOString());
    const campaignMap = new Map();
    const campaignKey = row => `${row.source}\u0000${row.medium}\u0000${row.campaign}`;
    for (const row of campaignVisits) campaignMap.set(campaignKey(row), { source: row.source, medium: row.medium, campaign: row.campaign, visitors: row.visitors, signups: 0, listings: 0, conversations: 0 });
    for (const row of campaignEvents) {
      const key = campaignKey(row);
      const item = campaignMap.get(key) || { source: row.source, medium: row.medium, campaign: row.campaign, visitors: 0, signups: 0, listings: 0, conversations: 0 };
      if (row.eventName === 'signup_completed') item.signups = row.total;
      if (row.eventName === 'listing_created') item.listings = row.total;
      if (row.eventName === 'conversation_started') item.conversations = row.total;
      campaignMap.set(key, item);
    }
    const campaigns = [...campaignMap.values()].sort((a, b) => b.visitors - a.visitors || b.signups - a.signups).slice(0, 30);
    const measuredEventCount = eventName => db.prepare('SELECT COUNT(DISTINCT visitor_id) AS count FROM analytics_events WHERE event_name=? AND created_at>=?').get(eventName, thirtyDaysIso.toISOString()).count;
    const behavior = behaviorAnalytics(thirtyDaysIso.toISOString(), presenceCutoff);
    return json(res, 200, {
      counts: {
        pendingListings: db.prepare(`SELECT COUNT(*) AS count FROM listings WHERE status='pending'`).get().count,
        openReports: db.prepare(`SELECT COUNT(*) AS count FROM reports WHERE status='open'`).get().count,
        seedMessageThreads: db.prepare(`SELECT COUNT(*) AS count FROM threads t JOIN listings l ON l.id=t.listing_id WHERE l.user_id LIKE 'seed-%' AND (t.user_a=? OR t.user_b=?)`).get(user.id, user.id).count,
        users: db.prepare('SELECT COUNT(*) AS count FROM users WHERE email IS NOT NULL AND is_admin=0').get().count,
        usersToday: db.prepare('SELECT COUNT(*) AS count FROM users WHERE created_at>=? AND email IS NOT NULL AND is_admin=0').get(todayIso).count,
        visitorsToday: db.prepare('SELECT COUNT(DISTINCT visitor_id) AS count FROM page_views WHERE created_at>=?').get(todayIso).count,
        visitors7d: db.prepare('SELECT COUNT(DISTINCT visitor_id) AS count FROM page_views WHERE created_at>=?').get(sevenDaysIso.toISOString()).count,
        pageViews7d: db.prepare('SELECT COUNT(*) AS count FROM page_views WHERE created_at>=?').get(sevenDaysIso.toISOString()).count,
        listings: db.prepare(`SELECT COUNT(*) AS count FROM listings WHERE user_id NOT LIKE 'seed-%'`).get().count,
        paidPurchases: db.prepare(`SELECT COUNT(*) AS count FROM purchases WHERE status='paid'`).get().count,
        revenueCents: db.prepare(`SELECT COALESCE(SUM(amount_cents),0) AS total FROM purchases WHERE status='paid'`).get().total
      },
      daily,
      analytics: {
        windowDays: 30,
        presence: {
          activeNow: db.prepare('SELECT COUNT(DISTINCT visitor_id) AS count FROM visitor_sessions WHERE ended_at IS NULL AND last_seen_at>=?').get(presenceCutoff).count,
          enteredToday: db.prepare('SELECT COUNT(DISTINCT visitor_id) AS count FROM visitor_sessions WHERE started_at>=?').get(todayIso).count,
          exitedToday: db.prepare('SELECT COUNT(DISTINCT visitor_id) AS count FROM visitor_sessions WHERE ended_at>=?').get(todayIso).count,
          activeWindowSeconds: PRESENCE_ACTIVE_WINDOW_SECONDS,
          updatedAt: nowIso()
        },
        funnel: {
          visitors: db.prepare('SELECT COUNT(DISTINCT visitor_id) AS count FROM page_views WHERE created_at>=?').get(thirtyDaysIso.toISOString()).count,
          signups: measuredEventCount('signup_completed'),
          listings: measuredEventCount('listing_created'),
          conversations: measuredEventCount('conversation_started')
        },
        campaigns,
        behavior
      },
      pendingListings: db.prepare(`SELECT * FROM listings WHERE status='pending' ORDER BY priority_review DESC,created_at`).all().map(listingFromRow),
      recentListings: db.prepare(`SELECT l.*,u.name AS owner_name,u.email AS owner_email FROM listings l JOIN users u ON u.id=l.user_id WHERE l.user_id NOT LIKE 'seed-%' ORDER BY l.created_at DESC LIMIT 50`).all().map(row => ({ ...listingFromRow(row), ownerName: row.owner_name, ownerEmail: row.owner_email })),
      users: db.prepare(`SELECT id,email,name,role,status,is_admin AS isAdmin,is_verified AS isVerified,buyer_connections AS buyerConnections,seller_listing_credits AS sellerListingCredits,seller_vip_credits AS sellerVipCredits,boost_credits AS boostCredits,created_at AS createdAt,last_seen_at AS lastSeenAt FROM users WHERE email IS NOT NULL ORDER BY created_at DESC LIMIT 100`).all(),
      purchases: db.prepare(`SELECT p.id,p.package_key AS packageKey,p.amount_cents AS amountCents,p.currency,p.status,p.created_at AS createdAt,u.name AS userName,u.email AS userEmail FROM purchases p JOIN users u ON u.id=p.user_id ORDER BY p.created_at DESC LIMIT 100`).all(),
      reports: db.prepare(`SELECT r.id,r.target_type AS targetType,r.target_id AS targetId,r.reason,r.status,r.created_at AS createdAt,reporter.name AS reporterName,reporter.email AS reporterEmail,COALESCE(l.title,target.name,r.target_id) AS targetLabel FROM reports r JOIN users reporter ON reporter.id=r.reporter_id LEFT JOIN listings l ON r.target_type='listing' AND l.id=r.target_id LEFT JOIN users target ON r.target_type='user' AND target.id=r.target_id ORDER BY r.created_at DESC LIMIT 100`).all(),
      seedMessageThreads: db.prepare(`SELECT t.id,t.listing_id AS listingId,t.updated_at AS updatedAt,l.title,u.name AS visitorName,u.email AS visitorEmail FROM threads t JOIN listings l ON l.id=t.listing_id JOIN users u ON u.id=CASE WHEN t.user_a=? THEN t.user_b ELSE t.user_a END WHERE l.user_id LIKE 'seed-%' AND (t.user_a=? OR t.user_b=?) ORDER BY t.updated_at DESC LIMIT 100`).all(user.id, user.id, user.id).map(thread => ({
        ...thread,
        unreadCount: db.prepare('SELECT COUNT(*) AS count FROM messages WHERE thread_id=? AND sender_id<>? AND read_at IS NULL').get(thread.id, user.id).count,
        messages: db.prepare('SELECT id,sender_id AS senderId,body,created_at AS createdAt FROM messages WHERE thread_id=? ORDER BY created_at').all(thread.id).map(message => ({ ...message, mine: message.senderId === user.id }))
      }))
    });
  }

  const adminUserMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/status$/);
  if (method === 'POST' && adminUserMatch) {
    const user = requireUser(req, res, true); if (!user) return;
    const targetId = decodeURIComponent(adminUserMatch[1]);
    const body = await readJson(req);
    const status = ['active', 'suspended'].includes(body.status) ? body.status : '';
    const target = db.prepare('SELECT id,is_admin FROM users WHERE id=?').get(targetId);
    if (!target) return fail(res, 404, 'NOT_FOUND', 'User not found.');
    if (!status || target.id === user.id || target.is_admin) return fail(res, 422, 'INVALID_ACTION', 'This user status cannot be changed.');
    db.prepare('UPDATE users SET status=? WHERE id=?').run(status, targetId);
    if (status === 'suspended') db.prepare('DELETE FROM sessions WHERE user_id=?').run(targetId);
    return json(res, 200, { ok: true, status });
  }

  const adminReportMatch = pathname.match(/^\/api\/admin\/reports\/([^/]+)$/);
  if (method === 'POST' && adminReportMatch) {
    const user = requireUser(req, res, true); if (!user) return;
    const body = await readJson(req);
    const status = ['resolved', 'dismissed', 'open'].includes(body.status) ? body.status : '';
    if (!status) return fail(res, 422, 'INVALID_ACTION', 'Invalid report action.');
    const result = db.prepare('UPDATE reports SET status=? WHERE id=?').run(status, decodeURIComponent(adminReportMatch[1]));
    if (!result.changes) return fail(res, 404, 'NOT_FOUND', 'Report not found.');
    return json(res, 200, { ok: true, status });
  }

  const moderateMatch = pathname.match(/^\/api\/admin\/listings\/([^/]+)\/moderate$/);
  if (method === 'POST' && moderateMatch) {
    const user = requireUser(req, res, true); if (!user) return;
    const body = await readJson(req);
    const action = ['approve', 'reject', 'verify'].includes(body.action) ? body.action : '';
    if (!action) return fail(res, 422, 'INVALID_ACTION', 'Invalid moderation action.');
    const id = decodeURIComponent(moderateMatch[1]);
    if (!db.prepare('SELECT 1 FROM listings WHERE id=?').get(id)) return fail(res, 404, 'NOT_FOUND', 'Listing not found.');
    if (action === 'reject') db.prepare(`UPDATE listings SET status='rejected',is_verified=0,priority_review=0,updated_at=? WHERE id=?`).run(nowIso(), id);
    else db.prepare(`UPDATE listings SET status='approved',is_verified=?,priority_review=0,updated_at=? WHERE id=?`).run(action === 'verify' ? 1 : 0, nowIso(), id);
    const updatedListing = db.prepare('SELECT * FROM listings WHERE id=?').get(id);
    if (updatedListing.status === 'approved') notifySearchEngines([`/projects/${encodeURIComponent(updatedListing.slug)}`, '/sitemap.xml']);
    const owner = db.prepare('SELECT email,name FROM users WHERE id=?').get(updatedListing.user_id);
    let notificationSent = false;
    if (owner?.email) {
      try {
        const notification = await sendEmail({ to: owner.email, subject: 'Your Searya listing review result', text: `Hi ${owner.name},\n\nYour “${updatedListing.title}” listing was ${action === 'reject' ? 'rejected after review' : action === 'verify' ? 'verified and published' : 'approved and published'}.\n\nYou can review its current status in My Account on Searya.`, idempotencyKey: `moderation-${id}-${updatedListing.updated_at}` });
        notificationSent = Boolean(notification.configured);
      } catch (error) {
        console.error('Moderation email error:', error);
      }
    }
    return json(res, 200, { listing: listingFromRow(updatedListing), notificationSent });
  }

  return fail(res, 404, 'API_NOT_FOUND', 'API route not found.');
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8'
};

const SEO_TITLE = 'Searya — Buy & Sell Digital Projects | 0% Commission & Direct Messaging';
const SEO_DESCRIPTION = 'Discover SaaS apps, Notion templates, and source code. Connect directly with founders with 0% platform fees, zero commissions, and direct messaging.';
const SEO_CATEGORIES = Object.freeze({
  saas: 'SaaS Projects',
  mobile: 'Mobile Apps',
  ai: 'AI Tools',
  extension: 'Chrome Extensions',
  notion: 'Notion Templates',
  'ui-kit': 'UI Kits',
  api: 'Developer APIs'
});
const SEO_LANDING_PATHS = Object.freeze([
  '/saas-for-sale', '/micro-saas-for-sale', '/mobile-apps-for-sale', '/ai-tools-for-sale', '/chrome-extensions-for-sale', '/websites-for-sale',
  '/sell-your-saas', '/sell-your-app', '/sell-your-digital-project'
]);
const GUIDE_PATHS = Object.freeze(Object.keys(GUIDES));
const DISCOVERY_SLUGS = Object.freeze(Object.keys(DISCOVERY_PAGES));
const generatedBlogPosts = GENERATED_BLOG_POSTS.map(post => Object.freeze({
  ...post,
  slug: String(post.url || `/blog/${post.slug}`).replace(/\/$/, ''),
  category: post.category || 'Editorial',
  keywords: post.keywords || post.tags || [],
  publishedDate: post.publishedDate || post.publishedAt,
  content: post.content || (post.sections || []).map(section => `## ${section.heading}\n\n${section.paragraphs.join('\n\n')}\n\n${section.subsections.map(subsection => `### ${subsection.heading}\n\n${subsection.paragraphs.join('\n\n')}`).join('\n\n')}`).join('\n\n')
}));
const BLOG_POSTS = Object.freeze([...CORE_BLOG_POSTS, ...generatedBlogPosts.filter(post => !CORE_BLOG_POSTS.some(core => core.slug === post.slug))]);
const blogPath = post => String(post.slug || post.url || '').startsWith('/blog/') ? String(post.slug || post.url) : `/blog/${String(post.slug || '').replace(/^\/+/, '')}`;
const blogSlug = post => blogPath(post).replace(/^\/blog\//, '');
const blogExcerpt = post => post.excerpt || post.metaDescription;
const BLOG_BY_SLUG = new Map(BLOG_POSTS.map(post => [blogSlug(post), post]));
const SEO_LANDING_PAGES = Object.freeze({
  '/saas-for-sale': {
    title: 'SaaS Projects for Sale | Discover SaaS Opportunities | Searya',
    description: 'Browse SaaS projects listed on Searya. Discover software opportunities and connect directly with project owners.',
    h1: 'Discover SaaS Projects for Sale',
    intro: 'Browse SaaS projects listed by their owners and connect directly with founders when you find an opportunity that interests you.',
    kicker: 'SaaS opportunities', category: 'saas', listingTitle: 'Current SaaS projects',
    explanation: 'SaaS listings can range from focused software tools and early MVPs to established subscription products. Review each project’s product scope, technology, ownership and evidence directly with its owner.',
    related: ['/micro-saas-for-sale', '/ai-tools-for-sale', '/sell-your-saas'],
    faqs: [
      ['Can I buy a SaaS directly through Searya?', 'No. Searya helps potential buyers discover SaaS projects and contact their owners. Negotiation, due diligence and any transaction take place outside Searya.'],
      ['What should I review before pursuing a SaaS project?', 'Inspect the product, source code, ownership, infrastructure, customer obligations, operating costs and any claimed revenue directly with the owner.'],
      ['Can owners list SaaS products built specifically to sell?', 'Yes. Searya is open to eligible SaaS projects intentionally built for sale as well as products whose owners are ready to move on.'],
      ['Does Searya take a commission from a SaaS sale?', 'Searya does not process the transaction between buyer and seller and does not take a marketplace commission from that transaction.']
    ]
  },
  '/micro-saas-for-sale': {
    title: 'Micro SaaS for Sale | Discover Small SaaS Projects | Searya',
    description: 'Discover micro SaaS and small software projects listed by their owners. Browse opportunities and connect directly on Searya.',
    h1: 'Discover Micro SaaS Projects for Sale',
    intro: 'Explore focused software products built for specific audiences, then speak directly with the owners behind the projects that fit your interests.',
    kicker: 'Focused software products', category: 'saas', micro: true, listingTitle: 'Current micro SaaS projects',
    explanation: 'Micro SaaS projects usually solve one focused problem for a defined audience. Evaluate the workflow, codebase, maintenance needs, distribution channels and evidence behind any business claims before moving forward.',
    related: ['/saas-for-sale', '/ai-tools-for-sale', '/sell-your-saas'],
    faqs: [
      ['What counts as a micro SaaS project?', 'A micro SaaS is generally a focused software product serving a narrow use case or audience, often operated by a small team or solo founder.'],
      ['Are all listed micro SaaS projects generating revenue?', 'No. Project stages vary. Use only the information shown in each listing and ask the owner to substantiate any revenue or customer claims.'],
      ['How do I contact a micro SaaS owner?', 'Open the project details and start a conversation through Searya. The owner can then answer product-specific questions directly.'],
      ['Does Searya handle the project transfer?', 'No. Searya facilitates discovery and contact. The parties independently arrange due diligence, agreements, payment and transfer.']
    ]
  },
  '/mobile-apps-for-sale': {
    title: 'Mobile Apps for Sale | Discover App Projects | Searya',
    description: 'Explore iOS, Android and cross-platform app projects listed by owners, then connect directly to discuss the product and transfer scope.',
    h1: 'Discover Mobile App Projects for Sale',
    intro: 'Explore iOS, Android and cross-platform app projects, review what each listing includes and connect directly with the project owner.',
    kicker: 'iOS and Android projects', category: 'mobile', listingTitle: 'Current mobile app projects',
    explanation: 'A mobile app opportunity may include source code, designs, store listings, back-end services or related accounts. Confirm exactly what is owned and transferable before making any commitment.',
    related: ['/ai-tools-for-sale', '/websites-for-sale', '/sell-your-app'],
    faqs: [
      ['Does Searya sell mobile apps?', 'No. Owners publish app listings and interested people can contact them. Searya does not process the purchase or transfer.'],
      ['Should I check App Store and Play Store ownership?', 'Yes. Confirm developer-account constraints, app ownership, signing keys, privacy obligations, third-party SDKs and which assets can legally be transferred.'],
      ['Can unpublished mobile app projects be listed?', 'Yes, provided the listing clearly explains the current stage and the owner has the rights required to offer the project.'],
      ['Can I post what kind of app I am looking for?', 'Yes. A Looking to Buy request can describe your preferred platform, category, technology, requirements and budget.']
    ]
  },
  '/ai-tools-for-sale': {
    title: 'AI Tools for Sale | Discover AI Projects | Searya',
    description: 'Discover AI tools, AI SaaS and software projects listed by their owners. Review opportunities and connect directly on Searya.',
    h1: 'Discover AI Tools & Projects for Sale',
    intro: 'Explore AI tools and AI-enabled software projects, understand how they work and contact their owners directly when there is a potential fit.',
    kicker: 'AI software opportunities', category: 'ai', listingTitle: 'Current AI tools and projects',
    explanation: 'AI projects may depend on model providers, data sources and usage-based infrastructure. Review prompts, workflows, data rights, API costs, reliability and technical documentation with the owner.',
    related: ['/saas-for-sale', '/micro-saas-for-sale', '/sell-your-digital-project'],
    faqs: [
      ['Are the AI models included with a listed project?', 'Not necessarily. Many tools rely on third-party APIs or open-source models. Ask the owner which accounts, licenses, data and model access can be transferred.'],
      ['Does Searya verify AI project performance?', 'Searya does not guarantee model quality, accuracy or business claims. Buyers should test the working product and review the implementation themselves.'],
      ['Can I discover an early-stage AI prototype?', 'Yes. Listings may cover different stages, provided their descriptions accurately explain what currently works and what remains to be built.'],
      ['Where does the transaction happen?', 'Outside Searya. The platform helps you discover the project and start a direct conversation with its owner.']
    ]
  },
  '/chrome-extensions-for-sale': {
    title: 'Chrome Extensions for Sale | Discover Projects | Searya',
    description: 'Discover Chrome and browser extension projects listed by their owners. View details and connect directly through Searya.',
    h1: 'Discover Chrome Extension Projects for Sale',
    intro: 'Explore browser extension projects, compare their use cases and technology, and speak directly with project owners.',
    kicker: 'Browser extension projects', category: 'extension', listingTitle: 'Current Chrome extension projects',
    explanation: 'Before pursuing an extension, review its Manifest version, permissions, store status, privacy disclosures, code ownership and any dependencies on external services.',
    related: ['/saas-for-sale', '/websites-for-sale', '/sell-your-digital-project'],
    faqs: [
      ['Can Chrome Web Store listings be transferred?', 'Store and developer-account rules can change. Confirm the current platform requirements and the exact transfer process before agreeing to anything.'],
      ['Are Firefox or other browser extensions eligible?', 'Yes. Owners can describe supported browsers in the listing, even though this page primarily helps people discover Chrome extension opportunities.'],
      ['What permissions should I review?', 'Inspect every requested browser permission, the privacy policy, data handling, remote services and whether the current implementation follows store policies.'],
      ['Does Searya provide checkout for extensions?', 'No. Searya supports discovery and owner contact only; it does not process a purchase or project transfer.']
    ]
  },
  '/websites-for-sale': {
    title: 'Websites for Sale | Discover Web Projects | Searya',
    description: 'Explore websites and web projects listed by owners. Discover online project opportunities and connect directly on Searya.',
    h1: 'Discover Websites & Web Projects for Sale',
    intro: 'Discover websites and web-based projects from their owners, review what is included and start a direct conversation when a project interests you.',
    kicker: 'Web project discovery', category: 'website', listingTitle: 'Current websites and web projects',
    explanation: 'Website projects can involve code, content, domains, hosting, analytics and third-party accounts. Verify ownership and document every asset included in a proposed transfer.',
    related: ['/saas-for-sale', '/mobile-apps-for-sale', '/sell-your-digital-project'],
    faqs: [
      ['What kinds of websites can appear here?', 'Eligible listings may include content sites, web applications, online tools and other web projects whose owners are prepared to discuss a transfer.'],
      ['Will the domain always be included?', 'No. The owner must state what is included. Confirm the domain, code, content, brand, hosting and connected accounts individually.'],
      ['Can I contact an owner without completing a purchase?', 'Yes. Searya is designed to help interested people ask questions and assess potential fit before making independent decisions.'],
      ['Does Searya guarantee website traffic?', 'No. Ask for verifiable analytics access and independently assess traffic quality, ownership and historical performance.']
    ]
  },
  '/sell-your-saas': {
    title: 'Sell Your SaaS | Find Potential SaaS Buyers | Searya',
    description: 'List your SaaS project on Searya and become discoverable to people exploring software opportunities. Connect directly with interested buyers.',
    h1: 'Looking to Sell Your SaaS? Get Discovered by Potential Buyers',
    intro: 'Create a clear SaaS listing, explain what you built and become discoverable to people actively exploring digital projects.',
    kicker: 'For SaaS owners', category: 'saas', seller: true, listingTitle: 'People looking for SaaS projects', cta: 'List Your SaaS',
    explanation: 'A useful listing sets expectations: describe the problem, current product stage, technology, included assets and the evidence you can share privately. Searya helps potential buyers find and contact you; it does not promise a sale.',
    related: ['/saas-for-sale', '/micro-saas-for-sale', '/sell-your-digital-project'],
    faqs: [
      ['Will Searya sell my SaaS for me?', 'No. Searya helps your project become discoverable and gives interested people a way to contact you directly.'],
      ['What should my SaaS listing include?', 'Explain the product, audience, current stage, technology, asking price, included assets and any important limitations accurately.'],
      ['Can I list a SaaS with no revenue?', 'Yes. Clearly state the current stage and avoid implying traction or revenue that you cannot verify.'],
      ['Does Searya take a commission?', 'Searya does not process the transaction and does not take a marketplace commission from a sale arranged between users.']
    ]
  },
  '/sell-your-app': {
    title: 'Sell Your Mobile App | Find Potential App Buyers | Searya',
    description: 'List your mobile app project and connect with people exploring iOS, Android and cross-platform app opportunities on Searya.',
    h1: 'Looking to Sell Your App? Find Potential Buyers',
    intro: 'Present your mobile app clearly and make it discoverable to people searching for iOS, Android and cross-platform projects.',
    kicker: 'For mobile app owners', category: 'mobile', seller: true, listingTitle: 'People looking for mobile app projects', cta: 'List Your App',
    explanation: 'Tell potential buyers whether the app is published, which platforms it supports, what technology it uses and which code, design, back-end and store assets are included.',
    related: ['/mobile-apps-for-sale', '/sell-your-digital-project', '/ai-tools-for-sale'],
    faqs: [
      ['Can I list an app that is not in an app store?', 'Yes. Describe whether it is a prototype, MVP, TestFlight build or production app so interested people understand its actual stage.'],
      ['Should I publish private source code in my listing?', 'No. Explain the technology and product clearly, then share sensitive evidence only through an appropriate due-diligence process.'],
      ['Does listing guarantee buyer interest?', 'No. A listing makes the project discoverable, but Searya cannot promise messages, offers or a completed sale.'],
      ['Who handles the app transfer?', 'You and the interested party arrange the agreement, payment and transfer outside Searya.']
    ]
  },
  '/sell-your-digital-project': {
    title: 'Sell Your Digital Project | Find Potential Buyers | Searya',
    description: 'List your software, website, app, AI tool or side project on Searya and connect directly with potential buyers.',
    h1: 'Find Potential Buyers for Your Digital Project',
    intro: 'List your software, app, website, AI tool or online project and make it easier for interested people to discover what you built.',
    kicker: 'For project owners', category: 'all', seller: true, listingTitle: 'What buyers are currently looking for', cta: 'List Your Project',
    explanation: 'Strong listings are specific and honest. Explain the project’s purpose, stage, technology, included assets and known limitations so potential buyers can decide whether to start a conversation.',
    related: ['/sell-your-saas', '/sell-your-app', '/websites-for-sale'],
    faqs: [
      ['What digital projects can I list?', 'Eligible projects can include SaaS products, mobile apps, AI tools, websites, browser extensions and other software-based projects you are authorized to offer.'],
      ['Is Searya only for unfinished projects?', 'No. Owners can list intentionally built projects, active products, side projects or other eligible digital projects they are ready to discuss.'],
      ['How do potential buyers reach me?', 'Interested users can open your public listing and start a conversation through Searya.'],
      ['Does Searya manage agreements or payments?', 'No. Searya connects users. The parties are responsible for due diligence, contracts, payments and transfers outside the platform.']
    ]
  }
});

function escapeMarkup(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function xmlUrl(pathname = '/') {
  return escapeMarkup(new URL(pathname, `${PUBLIC_ORIGIN}/`).href);
}

function publicListingDescription(row) {
  return `Connect directly with the owner of ${row.title}. 0% platform commission, direct founder messaging, and instant transfer.`;
}

function renderSeoPage({ title = SEO_TITLE, description = SEO_DESCRIPTION, canonical = `${PUBLIC_ORIGIN}/`, type = 'website', image = `${PUBLIC_ORIGIN}/public/searya-social-preview-en.png?v=20260811-1`, robots = 'index, follow, max-image-preview:large', structuredData = null } = {}) {
  let html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const safeTitle = escapeMarkup(title);
  const safeDescription = escapeMarkup(description);
  const safeCanonical = escapeMarkup(canonical);
  const safeImage = escapeMarkup(image);
  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${safeTitle}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${safeDescription}">`)
    .replace(/<meta name="robots" content="[^"]*">/, `<meta name="robots" content="${escapeMarkup(robots)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${safeCanonical}">`)
    .replace(/<meta property="og:type" content="[^"]*">/, `<meta property="og:type" content="${escapeMarkup(type)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${safeCanonical}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${safeTitle}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${safeDescription}">`)
    .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${safeImage}">`)
    .replace(/<meta property="og:image:secure_url" content="[^"]*">/, `<meta property="og:image:secure_url" content="${safeImage}">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${safeTitle}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${safeDescription}">`)
    .replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${safeImage}">`);
  if (structuredData) {
    const json = JSON.stringify(structuredData).replaceAll('<', '\\u003c');
    html = html.replace(/<script id="searya-structured-data" type="application\/ld\+json">[\s\S]*?<\/script>/, `<script id="searya-structured-data" type="application/ld+json">${json}</script>`);
  }
  return html;
}

function htmlResponse(req, res, body, status = 200) {
  const buffer = Buffer.from(body);
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': buffer.length,
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  if (req.method === 'HEAD') res.end(); else res.end(buffer);
}

function landingListingMatches(row, page) {
  if (page.category === 'all') return true;
  if (row.category !== page.category) return false;
  if (!page.micro) return true;
  const content = JSON.parse(row.content_json || '{}');
  return /micro\s*saas/i.test(`${content.categoryEn || ''} ${content.descriptionEn || ''} ${content.shortDescEn || ''} ${row.title}`);
}

function landingProjectCard(row, { discoverySlug = '', showTech = false } = {}) {
  const listing = listingFromRow(row);
  const content = JSON.parse(row.content_json || '{}');
  const description = cleanText(content.shortDescEn || content.descriptionEn || content.description || '', 190);
  const person = content.seller?.name || content.buyer?.name || 'Project owner';
  const label = row.type === 'wtb' ? 'Looking to buy' : (SEO_CATEGORIES[row.category] || cleanText(row.category, 40));
  const rawImage = safeImageData(content.coverImage);
  const image = /^https:\/\//i.test(rawImage) ? rawImage : '';
  const title = listing.titleEn || row.title;
  const tech = showTech ? `<div class="tech-chips">${(Array.isArray(content.techStack) ? content.techStack : []).slice(0, 4).map(value => `<span>${escapeMarkup(cleanText(value, 40))}</span>`).join('')}</div>` : '';
  const analytics = discoverySlug ? ` data-discovery-slug="${escapeMarkup(discoverySlug)}" data-listing-id="${escapeMarkup(row.id)}"` : '';
  return `<article class="project-card">${image ? `<img src="${escapeMarkup(image)}" alt="${escapeMarkup(title)}" loading="lazy" width="640" height="340">` : ''}<div class="project-body"><div class="project-meta"><span>${escapeMarkup(label)}</span><span>${row.type === 'wtb' ? 'Request' : 'Listing'}</span></div><h3>${escapeMarkup(title)}</h3><p>${escapeMarkup(description || 'Open the listing to review the available project information.')}</p>${tech}<p class="owner">Listed by ${escapeMarkup(person)}</p><a class="project-link${discoverySlug ? ' discovery-project-link' : ''}"${analytics} href="/projects/${encodeURIComponent(row.slug)}">View project details →</a></div></article>`;
}

function landingLabel(pathname) {
  return SEO_LANDING_PAGES[pathname]?.h1.replace(/^Discover |^Looking to |^Find /, '') || pathname;
}

function renderLandingPage(pathname) {
  const page = SEO_LANDING_PAGES[pathname];
  const canonical = `${PUBLIC_ORIGIN}${pathname}`;
  const pageTitle = `${page.title.replace(/\s*\|\s*Searya$/, '')} | 0% Commission & Direct Messaging — Searya`;
  const pageDescription = `${page.description} Connect directly with founders with 0% platform commission and direct buyer messaging.`;
  const listingType = page.seller ? 'wtb' : 'sale';
  let rows = [];
  try {
    rows = db.prepare(`SELECT * FROM listings WHERE status='approved' AND type=? ORDER BY (boosted_until IS NOT NULL AND boosted_until>?) DESC, updated_at DESC LIMIT 30`).all(listingType, nowIso()).filter(row => landingListingMatches(row, page)).slice(0, 6);
  } catch (error) { console.error(`SEO landing query failed for ${pathname}:`, error); }
  const listingContent = rows.length
    ? `<div class="cards">${rows.map(landingProjectCard).join('')}</div>`
    : `<div class="empty"><h3>No projects in this category yet.</h3><p>Have one? Be the first to list it and make it discoverable to interested people.</p><a class="button" href="/?create=listing">List your project</a></div>`;
  const faqSchema = page.faqs.map(([name, answer]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text: answer } }));
  const related = page.related.map(path => `<a href="${path}">${escapeMarkup(landingLabel(path))}</a>`).join('');
  const discoveryByCategory = {
    saas: ['nextjs-saas-projects', 'nodejs-saas-projects', 'vue-saas-projects', 'supabase-saas-projects', 'react-saas-projects'],
    mobile: ['flutter-mobile-apps', 'firebase-mobile-apps', 'react-native-mobile-apps'],
    ai: ['nextjs-ai-tools', 'python-ai-tools', 'openai-api-projects'],
    extension: ['chrome-extension-projects']
  };
  const discoveryLinks = (discoveryByCategory[page.category] || []).map(slug => `<a href="/discover/${slug}">${escapeMarkup(DISCOVERY_PAGES[slug].h1)}</a>`).join('');
  const primaryCta = page.seller ? (page.cta || 'List Your Project') : 'Explore All Projects';
  const primaryHref = page.seller ? '/?create=listing' : '/#listings-grid';
  const categoryHeading = page.seller ? 'Create a listing that earns the right conversation' : `Understanding ${page.kicker.toLowerCase()}`;
  const ctaHeading = page.seller ? 'Ready to introduce your project?' : 'Found a project worth exploring?';
  const ctaText = page.seller ? 'Publish an accurate listing and give potential buyers a clear reason to start a conversation.' : 'Review its details, ask the owner direct questions and complete independent due diligence before making decisions.';
  const pageJsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', name: 'The 0% Commission Marketplace for Digital Projects & SaaS', description: pageDescription, url: canonical, isPartOf: { '@type': 'WebSite', name: 'Searya', url: `${PUBLIC_ORIGIN}/` } },
    { '@type': 'FAQPage', mainEntity: faqSchema }
  ] }).replaceAll('<', '\\u003c');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeMarkup(pageTitle)}</title><meta name="description" content="${escapeMarkup(pageDescription)}"><meta name="robots" content="index, follow, max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="Searya"><meta property="og:locale" content="en_US"><meta property="og:url" content="${canonical}"><meta property="og:title" content="${escapeMarkup(pageTitle)}"><meta property="og:description" content="${escapeMarkup(pageDescription)}"><meta property="og:image" content="${PUBLIC_ORIGIN}/public/searya-social-preview-en.png?v=20260811-1"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeMarkup(pageTitle)}"><meta name="twitter:description" content="${escapeMarkup(pageDescription)}"><meta name="twitter:image" content="${PUBLIC_ORIGIN}/public/searya-social-preview-en.png?v=20260811-1"><link rel="icon" href="/favicon.ico?v=20260812-1" sizes="any"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/public/seo-landing.css?v=20260812-1"><script type="application/ld+json">${pageJsonLd}</script></head><body><header class="site-head"><div class="shell"><a class="brand" href="/" aria-label="Searya home"><img src="/src/assets/searya-logo.png?v=20260807-1" alt="Searya" width="1250" height="359"></a><nav class="nav" aria-label="Primary"><a href="/#listings-grid">Discover projects</a><a href="/sell-your-digital-project">For project owners</a><a class="button" href="${primaryHref}">${escapeMarkup(primaryCta)}</a></nav></div></header><main><section class="hero"><div class="shell"><p class="crumbs"><a href="/">Searya</a> / ${escapeMarkup(page.kicker)}</p><p class="eyebrow">${escapeMarkup(page.kicker)} · ${escapeMarkup(page.h1)}</p><h1>The 0% Commission Marketplace for Digital Projects &amp; SaaS</h1><h2 class="intro fee-subheading">Direct Founder-to-Buyer Messaging with Zero Transaction Fees</h2><p class="intro">${escapeMarkup(page.intro)}</p><div class="hero-actions"><a class="button" href="${primaryHref}">${escapeMarkup(primaryCta)}</a><a class="button secondary" href="/#listings-grid">Visit the marketplace</a></div></div></section><section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Live on Searya</p><h2>${escapeMarkup(page.listingTitle)}</h2></div><p>These are public, approved Searya listings. Project information comes from the listing owner; verify important claims independently.</p></div>${listingContent}</div></section><section class="section"><div class="shell split"><article class="panel"><p class="eyebrow">What to know</p><h2>${escapeMarkup(categoryHeading)}</h2><p>${escapeMarkup(page.explanation)}</p></article><article class="panel"><p class="eyebrow">Searya's role</p><h2>Discovery and direct contact</h2><p>Searya helps project owners and potential buyers find one another and start conversations. It does not process transactions or payments and is not a party to agreements between users.</p></article></div></section><section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">A simple process</p><h2>How Searya works</h2></div></div><div class="steps"><article class="step"><h3>Discover</h3><p>Browse relevant public projects or Looking to Buy requests based on your goals.</p></article><article class="step"><h3>Start a conversation</h3><p>Use Searya to contact the owner or potential buyer and ask specific questions.</p></article><article class="step"><h3>Verify independently</h3><p>Review identity, ownership, code and claims, then arrange any agreement outside Searya.</p></article></div></div></section><section class="section"><div class="shell split"><article class="panel"><h2>For potential buyers</h2><p>Compare project scope and technology, request evidence from owners and document exactly what a possible transfer would include.</p><a class="project-link" href="/#listings-grid">Explore the marketplace →</a></article><article class="panel"><h2>For project owners</h2><p>Publish an accurate listing that explains your product’s purpose, stage, technology, assets and known limitations.</p><a class="project-link" href="/sell-your-digital-project">Learn how to list a project →</a></article></div></section><section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Useful answers</p><h2>Frequently asked questions</h2></div></div><div class="faq">${page.faqs.map(([question, answer]) => `<details><summary>${escapeMarkup(question)}</summary><p>${escapeMarkup(answer)}</p></details>`).join('')}</div></div></section><section class="section"><div class="shell"><p class="eyebrow">Related paths</p><h2>Continue exploring</h2><div class="related">${related}<a href="/#listings-grid">All public projects</a></div>${discoveryLinks ? `<p class="eyebrow" style="margin-top:30px">Curated technology collections</p><div class="related">${discoveryLinks}</div>` : ""}</div></section><section class="section"><div class="shell cta"><h2>${escapeMarkup(ctaHeading)}</h2><p>${escapeMarkup(ctaText)}</p><a class="button" href="${primaryHref}">${escapeMarkup(primaryCta)}</a></div></section></main><footer class="site-foot"><div class="shell"><span>© 2026 Searya. Discovery and direct connection for digital projects.</span><nav><a href="/legal/terms.html">Terms</a><a href="/legal/privacy.html">Privacy</a><a href="/legal/transfer-checklist.html">Handover checklist</a></nav></div></footer></body></html>`;
}

function guideLabel(pathname) {
  if (pathname === '/guides') return 'All founder guides';
  return GUIDES[pathname]?.h1 || SEO_LANDING_PAGES[pathname]?.h1 || pathname;
}

function guideHead({ title, description, canonical, type = 'article', robots = 'index, follow, max-image-preview:large', structuredData }) {
  const socialImage = `${PUBLIC_ORIGIN}/public/searya-social-preview-en.png?v=20260811-1`;
  const json = JSON.stringify(structuredData).replaceAll('<', '\\u003c');
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeMarkup(title)}</title><meta name="description" content="${escapeMarkup(description)}"><meta name="robots" content="${escapeMarkup(robots)}"><link rel="canonical" href="${escapeMarkup(canonical)}"><meta property="og:type" content="${type}"><meta property="og:site_name" content="Searya"><meta property="og:locale" content="en_US"><meta property="og:url" content="${escapeMarkup(canonical)}"><meta property="og:title" content="${escapeMarkup(title)}"><meta property="og:description" content="${escapeMarkup(description)}"><meta property="og:image" content="${socialImage}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeMarkup(title)}"><meta name="twitter:description" content="${escapeMarkup(description)}"><meta name="twitter:image" content="${socialImage}"><link rel="icon" href="/favicon.ico?v=20260812-1" sizes="any"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/public/seo-landing.css?v=20260812-1"><link rel="stylesheet" href="/public/guides.css?v=20260812-1"><link rel="stylesheet" href="/public/discovery.css?v=20260812-1"><script type="application/ld+json">${json}</script>`;
}

function guideHeader(primaryHref = '/#listings-grid', primaryLabel = 'Discover projects') {
  return `<header class="site-head"><div class="shell"><a class="brand" href="/" aria-label="Searya home"><img src="/src/assets/searya-logo.png?v=20260807-1" alt="Searya" width="1250" height="359"></a><nav class="nav" aria-label="Primary"><a href="/guides">Guides</a><a href="/sell-your-digital-project">For project owners</a><a class="button" href="${primaryHref}">${escapeMarkup(primaryLabel)}</a></nav></div></header>`;
}

function guideFooter() {
  return `<footer class="site-foot"><div class="shell"><span>© 2026 Searya. Practical resources for digital project owners and buyers.</span><nav><a href="/guides">Guides</a><a href="/legal/terms.html">Terms</a><a href="/legal/privacy.html">Privacy</a><a href="/legal/transfer-checklist.html">Handover checklist</a></nav></div></footer>`;
}

function blogHeader() {
  return `<div class="blog-announcement"><span>NEW</span><strong>Looking to Buy is live.</strong><a href="/?create=listing">Create a listing →</a></div><header class="blog-navbar"><div class="blog-navbar-inner"><a class="blog-brand" href="/" aria-label="Searya home"><img class="blog-logo-full" src="/src/assets/searya-logo.png?v=20260807-1" alt="Searya" width="1250" height="359"><img class="blog-logo-mark" src="/src/assets/searya-mark.png?v=20260807-1" alt="" width="351" height="342"></a><nav aria-label="Primary"><a href="/#listings-grid">Projects for Sale</a><a href="/#listings-grid">Looking to Buy</a><a href="/#pricing-section">Free During Launch</a><a class="active" href="/blog" aria-current="page">Blog</a></nav><div class="blog-actions"><button id="blog-theme-toggle" type="button" aria-label="Change theme"><span class="light-icon" aria-hidden="true">☀</span><span class="dark-icon" aria-hidden="true">☾</span><span class="theme-label">Theme</span></button><a class="blog-list-button" href="/?create=listing">Post a Listing</a></div></div></header>`;
}

function blogFooter() {
  return `<footer class="blog-footer"><div class="shell"><a class="blog-footer-brand" href="/"><img src="/src/assets/searya-logo.png?v=20260807-1" alt="Searya" width="1250" height="359"></a><p>Discover, evaluate and list digital projects with clearer information and direct conversations.</p><nav><a href="/#listings-grid">Marketplace</a><a href="/blog">Blog</a><a href="/legal/terms.html">Terms</a><a href="/legal/privacy.html">Privacy</a><a href="mailto:basakatali71@gmail.com">Feedback</a></nav></div></footer>`;
}

function blogAssets() {
  return `<script>(function(){try{var s=JSON.parse(localStorage.getItem('searya-client-state-v1')||'{}');document.documentElement.classList.toggle('dark',s.theme!=='light')}catch(e){document.documentElement.classList.add('dark')}})()</script><link rel="stylesheet" href="/public/blog.css?v=20260813-3"><script src="/public/blog-theme.js?v=20260813-1" defer></script>`;
}

function renderGuidesHub() {
  const canonical = `${PUBLIC_ORIGIN}/guides`;
  const title = 'Guides for Buying and Selling Digital Projects | Searya';
  const description = 'Practical founder guides for selling SaaS, apps and digital projects, evaluating opportunities, valuation and due diligence.';
  const grouped = GUIDE_CATEGORIES.map(category => {
    const cards = GUIDE_PATHS.filter(path => GUIDES[path].category === category).map(path => {
      const guide = GUIDES[path];
      return `<article class="guide-card"><p class="card-type">${escapeMarkup(category)}</p><h2><a href="${path}">${escapeMarkup(guide.h1)}</a></h2><p>${escapeMarkup(guide.description)}</p><a class="read-link" href="${path}">Read the guide <span aria-hidden="true">→</span></a></article>`;
    }).join('');
    return cards ? `<section class="hub-group" aria-labelledby="${category.toLowerCase().replace(/[^a-z]+/g, '-')}"><div class="group-heading"><p class="eyebrow">Resource collection</p><h2 id="${category.toLowerCase().replace(/[^a-z]+/g, '-')}">${escapeMarkup(category)}</h2></div><div class="guide-grid">${cards}</div></section>` : '';
  }).join('');
  const structuredData = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', name: 'Searya Guides', description, url: canonical, isPartOf: { '@type': 'WebSite', name: 'Searya', url: `${PUBLIC_ORIGIN}/` }, mainEntity: GUIDE_PATHS.map(path => ({ '@type': 'Article', headline: GUIDES[path].h1, url: `${PUBLIC_ORIGIN}${path}` })) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Searya', item: `${PUBLIC_ORIGIN}/` }, { '@type': 'ListItem', position: 2, name: 'Guides', item: canonical }] }
  ] };
  return `<!doctype html><html lang="en"><head>${guideHead({ title, description, canonical, type: 'website', structuredData })}</head><body>${guideHeader()}<main><section class="hero guide-hub-hero"><div class="shell"><p class="crumbs"><a href="/">Searya</a> / Guides</p><p class="eyebrow">Practical founder resources</p><h1>Guides for buying and selling digital projects</h1><p class="intro">Clear, evidence-led resources for founders preparing a project, buyers evaluating an opportunity and anyone trying to understand valuation, due diligence or transfer. No fabricated success stories, guaranteed outcomes or hidden transaction claims.</p><div class="hero-actions"><a class="button" href="#guide-library">Browse the library</a><a class="button secondary" href="/#listings-grid">Discover projects</a></div></div></section><div id="guide-library" class="shell guide-library">${grouped}</div><section class="section"><div class="shell cta"><p class="eyebrow">Searya marketplace</p><h2>Put the guidance into practice</h2><p>Discover public digital projects or create an accurate listing. Searya helps users find one another and communicate directly; transactions happen independently outside the platform.</p><div class="hero-actions centered"><a class="button" href="/#listings-grid">Explore projects</a><a class="button secondary" href="/sell-your-digital-project">List a project</a></div></div></section></main>${guideFooter()}</body></html>`;
}

function renderGuidePage(pathname) {
  const guide = GUIDES[pathname];
  const canonical = `${PUBLIC_ORIGIN}${pathname}`;
  const [ctaHeading, ctaText, ctaHref, ctaLabel] = guide.cta;
  const related = guide.links.map(path => `<a href="${path}">${escapeMarkup(guideLabel(path))}</a>`).join('');
  const sections = guide.sections.map(([heading, paragraphs], index) => `<section class="article-section" id="section-${index + 1}"><h2>${escapeMarkup(heading)}</h2>${paragraphs.map(paragraph => `<p>${escapeMarkup(paragraph)}</p>`).join('')}</section>`).join('');
  const structuredData = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', headline: guide.h1, description: guide.description, url: canonical, datePublished: GUIDE_PUBLISHED_DATE, dateModified: GUIDE_PUBLISHED_DATE, author: { '@type': 'Organization', name: 'Searya', url: `${PUBLIC_ORIGIN}/` }, publisher: { '@type': 'Organization', name: 'Searya', url: `${PUBLIC_ORIGIN}/` }, mainEntityOfPage: canonical },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Searya', item: `${PUBLIC_ORIGIN}/` }, { '@type': 'ListItem', position: 2, name: 'Guides', item: `${PUBLIC_ORIGIN}/guides` }, { '@type': 'ListItem', position: 3, name: guide.h1, item: canonical }] }
  ] };
  return `<!doctype html><html lang="en"><head>${guideHead({ title: guide.title, description: guide.description, canonical, structuredData })}</head><body>${guideHeader(ctaHref, ctaLabel)}<main><article><header class="hero article-hero"><div class="article-shell"><p class="crumbs"><a href="/">Searya</a> / <a href="/guides">Guides</a> / ${escapeMarkup(guide.category)}</p><p class="eyebrow">${escapeMarkup(guide.category)}</p><h1>${escapeMarkup(guide.h1)}</h1><p class="intro">${escapeMarkup(guide.intro)}</p><div class="byline"><span>Published by Searya</span><time datetime="${GUIDE_PUBLISHED_DATE}">August 12, 2026</time></div></div></header><div class="article-shell article-layout"><div class="article-content">${sections}<aside class="role-note" aria-label="Searya's role"><strong>Searya’s role</strong><p>Searya supports project discovery and direct communication. It does not process acquisitions, hold transaction funds, provide escrow or become a party to agreements between users.</p></aside><section class="article-related" aria-labelledby="related-guides"><p class="eyebrow">Continue your research</p><h2 id="related-guides">Related Searya resources</h2><div class="related">${related}</div></section><section class="article-cta"><h2>${escapeMarkup(ctaHeading)}</h2><p>${escapeMarkup(ctaText)}</p><a class="button" href="${ctaHref}">${escapeMarkup(ctaLabel)}</a></section></div><aside class="article-aside"><div class="aside-card"><p class="eyebrow">In this guide</p><ol>${guide.sections.map(([heading], index) => `<li><a href="#section-${index + 1}">${escapeMarkup(heading)}</a></li>`).join('')}</ol></div><div class="aside-card compact"><strong>Independent verification matters</strong><p>Confirm identity, ownership, product claims and transfer terms before making a commitment.</p><a href="/legal/transfer-checklist.html">Open the handover checklist →</a></div></aside></div></article></main>${guideFooter()}</body></html>`;
}

function renderBlogHub() {
  const title = 'Searya Blog | Buying and Selling Digital Projects';
  const description = 'Practical English guides for evaluating, buying, selling and transferring SaaS products, apps, AI tools and other digital projects.';
  const canonical = `${PUBLIC_ORIGIN}/blog`;
  const categories = [...new Set(BLOG_POSTS.map(post => post.category))].sort();
  const cards = [...BLOG_POSTS].sort((a, b) => String(b.publishedDate).localeCompare(String(a.publishedDate))).map(post => `<article class="blog-card" data-blog-card data-title="${escapeMarkup(post.title.toLowerCase())}" data-category="${escapeMarkup(post.category)}" data-keywords="${escapeMarkup(post.keywords.join(' ').toLowerCase())}"><div class="blog-meta"><span>${escapeMarkup(post.category)}</span><span>${escapeMarkup(post.readTime)}</span><time datetime="${escapeMarkup(String(post.publishedDate).slice(0,10))}">${escapeMarkup(String(post.publishedDate).slice(0,10))}</time></div><h2><a href="${blogPath(post)}">${escapeMarkup(post.title)}</a></h2><p>${escapeMarkup(blogExcerpt(post))}</p><div class="blog-tags">${post.keywords.slice(0, 3).map(tag => `<span>${escapeMarkup(tag)}</span>`).join('')}</div></article>`).join('');
  const filters = categories.map(category => `<button type="button" data-blog-filter="${escapeMarkup(category)}">${escapeMarkup(category)}</button>`).join('');
  const structuredData = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Searya Blog', description, url: canonical, mainEntity: BLOG_POSTS.map(post => ({ '@type': 'Article', headline: post.title, url: `${PUBLIC_ORIGIN}${blogPath(post)}` })) };
  return `<!doctype html><html lang="en"><head>${guideHead({ title, description, canonical, type: 'website', structuredData })}${blogAssets()}<script src="/public/blog.js?v=20260813-1" defer></script></head><body class="searya-blog">${blogHeader()}<main><section class="hero blog-hero"><span class="blog-orb blog-orb-one" aria-hidden="true"></span><span class="blog-orb blog-orb-two" aria-hidden="true"></span><div class="shell"><p class="eyebrow">Searya Editorial</p><h1>Practical guidance for digital project buyers and owners</h1><p class="intro">Fifty in-depth, evidence-minded resources for evaluating products, planning transfers, valuing software and having better direct conversations.</p><div class="hero-actions"><a class="button" href="/#listings-grid">Explore projects</a><a class="button secondary" href="/?create=listing">List your project</a></div></div></section><section class="section blog-library"><div class="shell"><div class="blog-tools" role="search"><label for="blog-search">Search the Searya blog</label><input id="blog-search" type="search" placeholder="Search valuation, due diligence, SaaS…" autocomplete="off"><div class="blog-filters" aria-label="Filter articles by category"><button class="active" type="button" data-blog-filter="all">All topics</button>${filters}</div><p id="blog-result-count" aria-live="polite">${BLOG_POSTS.length} articles</p></div><div class="blog-grid">${cards}</div><div class="blog-card blog-empty" id="blog-empty" hidden><h2>No matching articles</h2><p>Try a broader search or select another topic.</p></div></div></section></main>${blogFooter()}</body></html>`;
}

function renderInlineMarkdown(value) {
  return escapeMarkup(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https:\/\/searya\.com\/[^)\s]*|\/[^)\s]*)\)/g, '<a href="$2">$1</a>');
}

function renderMarkdown(markdown) {
  const blocks = [];
  let listType = '';
  let items = [];
  let sectionOpen = false;
  const flushList = () => { if (items.length) blocks.push(`<${listType}>${items.map(item => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</${listType}>`); listType = ''; items = []; };
  for (const rawLine of String(markdown || '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) { flushList(); continue; }
    const bullet = line.match(/^[-*] (.+)$/);
    const ordered = line.match(/^\d+\. (.+)$/);
    if (bullet || ordered) {
      const nextType = bullet ? 'ul' : 'ol';
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      items.push((bullet || ordered)[1]);
      continue;
    }
    flushList();
    if (/^# /.test(line)) continue;
    if (/^## /.test(line)) { const heading = line.slice(3); if (sectionOpen) blocks.push('</section>'); blocks.push(`<section><h2>${renderInlineMarkdown(heading)}</h2>`); sectionOpen = true; continue; }
    if (/^### /.test(line)) { blocks.push(`<h3>${renderInlineMarkdown(line.slice(4))}</h3>`); continue; }
    blocks.push(`<p>${renderInlineMarkdown(line)}</p>`);
  }
  flushList();
  if (sectionOpen) blocks.push('</section>');
  return blocks.join('');
}

function renderBlogPost(post) {
  const canonical = `${PUBLIC_ORIGIN}${blogPath(post)}`;
  const body = renderMarkdown(post.content);
  const structuredData = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', headline: post.title, description: post.metaDescription, articleSection: post.category, keywords: post.keywords.join(', '), wordCount: post.wordCount, author: { '@type': 'Organization', name: post.author, url: `${PUBLIC_ORIGIN}/blog` }, publisher: { '@type': 'Organization', name: 'Searya', url: `${PUBLIC_ORIGIN}/` }, datePublished: post.publishedDate, dateModified: post.updatedAt || post.publishedDate, mainEntityOfPage: canonical },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Searya', item: `${PUBLIC_ORIGIN}/` }, { '@type': 'ListItem', position: 2, name: 'Blog', item: `${PUBLIC_ORIGIN}/blog` }, { '@type': 'ListItem', position: 3, name: post.title, item: canonical }] }
  ] };
  return `<!doctype html><html lang="en"><head>${guideHead({ title: `${post.title} | Searya`, description: post.metaDescription, canonical, structuredData })}${blogAssets()}</head><body class="searya-blog">${blogHeader()}<main><section class="hero blog-hero blog-article-hero"><span class="blog-orb blog-orb-one" aria-hidden="true"></span><div class="shell"><nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> <span>→</span> <a href="/blog">Blog</a> <span>→</span> <span>${escapeMarkup(post.category)}</span></nav><p class="eyebrow">${escapeMarkup(post.author)}</p><h1>${escapeMarkup(post.title)}</h1><p class="intro">${escapeMarkup(blogExcerpt(post))}</p><div class="blog-meta"><span>${escapeMarkup(post.category)}</span><span>${escapeMarkup(post.readTime)}</span><span>Published ${escapeMarkup(String(post.publishedDate).slice(0,10))}</span></div></div></section><section class="section blog-reading"><div class="shell"><article class="blog-article"><div class="blog-tags">${post.keywords.map(tag => `<span>${escapeMarkup(tag)}</span>`).join('')}</div>${body}<aside class="blog-final-cta"><h2>Continue on Searya</h2><p>Explore projects available from their owners or publish an accurate listing for your own digital product.</p><div class="hero-actions"><a class="button" href="/#listings-grid">Explore projects</a><a class="button secondary" href="/?create=listing">List your project</a></div></aside></article></div></section></main>${blogFooter()}</body></html>`;
}

function normalizedTechStack(row) {
  try {
    const content = JSON.parse(row.content_json || '{}');
    return Array.isArray(content.techStack) ? content.techStack.map(value => cleanText(value, 40).toLowerCase()) : [];
  } catch { return []; }
}

function discoveryMatches(row, page) {
  if (row.type !== 'sale' || row.category !== page.category) return false;
  if (!page.tech?.length) return true;
  const stack = normalizedTechStack(row);
  return page.tech.some(approvedTech => stack.includes(approvedTech));
}

function discoveryInventory() {
  const inventory = new Map();
  const publicRows = db.prepare(`SELECT * FROM listings WHERE status='approved' AND type='sale' ORDER BY (boosted_until IS NOT NULL AND boosted_until>?) DESC, boosted_until DESC, created_at DESC`).all(nowIso());
  for (const slug of DISCOVERY_SLUGS) {
    const rows = publicRows.filter(row => discoveryMatches(row, DISCOVERY_PAGES[slug]));
    inventory.set(slug, { rows, count: rows.length, indexable: rows.length >= DISCOVERY_INDEX_THRESHOLD });
  }
  return inventory;
}

function renderDiscoveryCard(row, discoverySlug) {
  return landingProjectCard(row, { discoverySlug, showTech: true });
}

function discoveryPageLinks(slugs, inventory) {
  return slugs.filter(slug => DISCOVERY_PAGES[slug]).sort((a, b) => Number(inventory.get(b)?.indexable) - Number(inventory.get(a)?.indexable)).map(slug => {
    const item = inventory.get(slug);
    return `<a href="/discover/${slug}">${escapeMarkup(DISCOVERY_PAGES[slug].h1)}${item?.count ? ` <span>${item.count}</span>` : ''}</a>`;
  }).join('');
}

function renderDiscoveryPage(slug) {
  const page = DISCOVERY_PAGES[slug];
  const inventory = discoveryInventory();
  const current = inventory.get(slug);
  const canonical = `${PUBLIC_ORIGIN}/discover/${slug}`;
  const robots = current.indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow';
  const projectGrid = current.rows.length ? `<div class="cards discovery-cards">${current.rows.map(row => renderDiscoveryCard(row, slug)).join('')}</div>` : `<div class="empty"><h2>No matching projects are currently listed.</h2><p>Browse all public projects, explore a related category or create an accurate listing if you own a relevant project.</p><div class="hero-actions centered"><a class="button" href="/#listings-grid">Browse all projects</a><a class="button secondary discovery-seller-cta" data-discovery-slug="${escapeMarkup(slug)}" href="/?create=listing">List a relevant project</a></div></div>`;
  const related = discoveryPageLinks(page.related || [], inventory);
  const guides = (page.guides || []).map(path => `<a href="${path}">${escapeMarkup(guideLabel(path))}</a>`).join('');
  const structuredData = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', name: page.h1, description: page.description, url: canonical, isPartOf: { '@type': 'WebSite', name: 'Searya', url: `${PUBLIC_ORIGIN}/` }, numberOfItems: current.count },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${PUBLIC_ORIGIN}/` }, { '@type': 'ListItem', position: 2, name: 'Discover', item: `${PUBLIC_ORIGIN}/#listings-grid` }, { '@type': 'ListItem', position: 3, name: page.h1, item: canonical }] }
  ] };
  return `<!doctype html><html lang="en"><head>${guideHead({ title: page.title, description: page.description, canonical, type: 'website', robots, structuredData })}</head><body data-discovery-slug="${escapeMarkup(slug)}">${guideHeader('/#listings-grid', 'Explore all projects')}<main><section class="hero discovery-hero"><div class="shell"><nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> <span>→</span> <a href="/#listings-grid">Discover</a> <span>→</span> <span>${escapeMarkup(page.h1)}</span></nav><p class="eyebrow">Curated marketplace discovery</p><h1>${escapeMarkup(page.h1)}</h1><p class="intro">${escapeMarkup(page.intro)}</p><div class="inventory-note"><strong>${current.count}</strong> matching public ${current.count === 1 ? 'project' : 'projects'} currently listed${current.indexable ? '' : ` · This page remains noindex until it has at least ${DISCOVERY_INDEX_THRESHOLD} matching listings`}.</div></div></section><section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Real Searya inventory</p><h2>Projects matching this collection</h2></div><p>Only active, approved public sale listings are shown. Classification uses the category and technology stack supplied in each listing.</p></div>${projectGrid}</div></section><section class="section"><div class="shell split"><article class="panel"><p class="eyebrow">Understand the category</p><h2>What this collection means</h2><p>${escapeMarkup(page.explanation)}</p></article><article class="panel"><p class="eyebrow">Buyer guidance</p><h2>Verify beyond the label</h2><p>${escapeMarkup(page.buyerGuidance)}</p></article></div></section><section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Related discovery</p><h2>Explore nearby project collections</h2></div></div><div class="related discovery-related">${related}</div></div></section><section class="section"><div class="shell split"><article class="panel"><p class="eyebrow">For buyers</p><h2>Compare projects, then ask direct questions</h2><p>Use public listings as a starting point. Verify ownership, code, claims, operating costs and transferability independently with the project owner.</p><a class="project-link discovery-buyer-cta" data-discovery-slug="${escapeMarkup(slug)}" href="/#listings-grid">Browse all public projects →</a></article><article class="panel"><p class="eyebrow">For project owners</p><h2>Own a relevant project?</h2><p>Create an accurate listing with the correct category and technology stack. Indexability depends on real approved inventory, never on arbitrary user tags.</p><a class="project-link discovery-seller-cta" data-discovery-slug="${escapeMarkup(slug)}" href="/?create=listing">List your project →</a></article></div></section><section class="section"><div class="shell"><p class="eyebrow">Practical resources</p><h2>Continue with Searya guides</h2><div class="related">${guides}</div></div></section><section class="section"><div class="shell cta"><h2>Discovery and direct contact</h2><p>Searya helps project owners and potential buyers find one another. It does not process acquisitions, payments or escrow and is not a party to user agreements.</p><a class="button discovery-buyer-cta" data-discovery-slug="${escapeMarkup(slug)}" href="/#listings-grid">Discover more projects</a></div></section></main>${guideFooter()}<script src="/public/discovery-analytics.js?v=20260812-1" defer></script></body></html>`;
}

function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  const candidate = normalize(join(ROOT, pathname));
  const rootPrefix = ROOT.endsWith('/') ? ROOT : `${ROOT}/`;
  if (!candidate.startsWith(rootPrefix) || !existsSync(candidate) || !statSync(candidate).isFile()) {
    if ((req.headers.accept || '').includes('text/html')) {
      const notFoundPage = join(ROOT, '404.html');
      const body = readFileSync(notFoundPage);
      res.writeHead(404, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': body.length,
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Frame-Options': 'DENY'
      });
      if (req.method === 'HEAD') res.end(); else res.end(body);
      return;
    }
    return fail(res, 404, 'PAGE_NOT_FOUND', 'Page not found.');
  }
  const body = readFileSync(candidate);
  const immutable = /[?&]v=/.test(req.url || '');
  res.writeHead(200, {
    'Content-Type': mimeTypes[extname(candidate).toLowerCase()] || 'application/octet-stream',
    'Content-Length': body.length,
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  if (req.method === 'HEAD') res.end(); else res.end(body);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', APP_ORIGIN);
    if (req.method === 'OPTIONS') { res.writeHead(204, { Allow: 'GET,HEAD,POST,PATCH,DELETE,OPTIONS' }); return res.end(); }
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    if (url.pathname === indexNowKeyPath()) {
      const body = INDEXNOW_KEY;
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' });
      return res.end(body);
    }
    if (url.pathname === '/robots.txt') {
      const body = `User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /account\nDisallow: /settings\nDisallow: /messages\nDisallow: /login\nDisallow: /register\nDisallow: /dashboard\nDisallow: /api/\n\nSitemap: ${PUBLIC_ORIGIN}/sitemap.xml\n`;
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'public, max-age=3600' });
      return res.end(body);
    }
    if (url.pathname === '/sitemap.xml') {
      let listingRows = [];
      try { listingRows = db.prepare(`SELECT slug,updated_at FROM listings WHERE status='approved' ORDER BY updated_at DESC`).all(); }
      catch (error) { console.error('Sitemap listing query failed:', error); }
      const indexableDiscoveryPaths = [...discoveryInventory()].filter(([, value]) => value.indexable).map(([slug]) => `/discover/${slug}`);
      const pages = ['/', ...SEO_LANDING_PATHS, '/guides', ...GUIDE_PATHS, '/blog', ...indexableDiscoveryPaths, '/legal/privacy.html', '/legal/terms.html', '/legal/cookies.html', '/legal/transfer-checklist.html']
        .map(path => `<url><loc>${xmlUrl(path)}</loc></url>`).join('');
      const blogLastmods = BLOG_POSTS.map(post => `<url><loc>${xmlUrl(blogPath(post))}</loc><lastmod>${escapeMarkup(String(post.updatedAt || post.publishedDate).slice(0,10))}</lastmod></url>`).join('');
      const categories = Object.keys(SEO_CATEGORIES).map(category => `<url><loc>${xmlUrl(`/projects/category/${category}`)}</loc></url>`).join('');
      const listings = listingRows.map(row => `<url><loc>${xmlUrl(`/projects/${encodeURIComponent(row.slug)}`)}</loc><lastmod>${escapeMarkup(String(row.updated_at || '').slice(0, 10))}</lastmod></url>`).join('');
      const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages}${blogLastmods}${categories}${listings}</urlset>`;
      res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'public, max-age=3600' });
      return res.end(body);
    }
    const legacyListingSlug = url.pathname === '/' ? url.searchParams.get('listing') : '';
    if (legacyListingSlug) return redirect(res, `${PUBLIC_ORIGIN}/projects/${encodeURIComponent(legacyListingSlug)}`);
    if ((req.method === 'GET' || req.method === 'HEAD') && url.pathname === '/') {
      return htmlResponse(req, res, renderSeoPage());
    }
    const guideWithoutTrailingSlash = url.pathname.length > 1 && url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : '';
    if ((req.method === 'GET' || req.method === 'HEAD') && (guideWithoutTrailingSlash === '/guides' || GUIDES[guideWithoutTrailingSlash])) {
      return redirect(res, `${PUBLIC_ORIGIN}${guideWithoutTrailingSlash}`);
    }
    if ((req.method === 'GET' || req.method === 'HEAD') && SEO_LANDING_PAGES[url.pathname]) {
      return htmlResponse(req, res, renderLandingPage(url.pathname));
    }
    if ((req.method === 'GET' || req.method === 'HEAD') && url.pathname === '/guides') {
      return htmlResponse(req, res, renderGuidesHub());
    }
    if ((req.method === 'GET' || req.method === 'HEAD') && GUIDES[url.pathname]) {
      return htmlResponse(req, res, renderGuidePage(url.pathname));
    }
    if ((req.method === 'GET' || req.method === 'HEAD') && url.pathname === '/blog') {
      return htmlResponse(req, res, renderBlogHub());
    }
    const blogMatch = url.pathname.match(/^\/blog\/([a-z0-9-]+)\/?$/);
    if ((req.method === 'GET' || req.method === 'HEAD') && blogMatch) {
      const post = BLOG_BY_SLUG.get(blogMatch[1]);
      if (!post) return serveStatic(req, res, new URL('/not-found', APP_ORIGIN));
      if (url.pathname.endsWith('/')) return redirect(res, `${PUBLIC_ORIGIN}${blogPath(post)}`);
      return htmlResponse(req, res, renderBlogPost(post));
    }
    const discoveryMatch = url.pathname.match(/^\/discover\/([a-z0-9-]+)$/);
    if ((req.method === 'GET' || req.method === 'HEAD') && discoveryMatch && DISCOVERY_PAGES[discoveryMatch[1]]) {
      return htmlResponse(req, res, renderDiscoveryPage(discoveryMatch[1]));
    }
    const discoveryTrailingSlash = url.pathname.match(/^\/discover\/([a-z0-9-]+)\/$/);
    if ((req.method === 'GET' || req.method === 'HEAD') && discoveryTrailingSlash && DISCOVERY_PAGES[discoveryTrailingSlash[1]]) {
      return redirect(res, `${PUBLIC_ORIGIN}/discover/${discoveryTrailingSlash[1]}`);
    }
    const projectMatch = url.pathname.match(/^\/projects\/([^/]+)\/?$/);
    if ((req.method === 'GET' || req.method === 'HEAD') && projectMatch) {
      const slug = decodeURIComponent(projectMatch[1]);
      const row = db.prepare(`SELECT * FROM listings WHERE slug=? AND status='approved'`).get(slug);
      if (!row) return serveStatic(req, res, new URL('/not-found', APP_ORIGIN));
      const listing = listingFromRow(row);
      const canonical = `${PUBLIC_ORIGIN}/projects/${encodeURIComponent(row.slug)}`;
      const title = `${row.title} | 0% Commission Marketplace — Searya`;
      const description = publicListingDescription(row);
      const image = /^https:\/\//i.test(listing.coverImage || '') ? listing.coverImage : `${PUBLIC_ORIGIN}/public/searya-social-preview-en.png?v=20260811-1`;
      return htmlResponse(req, res, renderSeoPage({
        title,
        description,
        canonical,
        type: 'article',
        image,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: row.title,
          description,
          url: canonical,
          genre: SEO_CATEGORIES[row.category] || row.category,
          datePublished: row.created_at,
          dateModified: row.updated_at,
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: '0% Commission Marketplace with Direct Buyer Messaging'
          },
          isPartOf: { '@type': 'WebSite', name: 'Searya', url: `${PUBLIC_ORIGIN}/` }
        }
      }));
    }
    const categoryMatch = url.pathname.match(/^\/projects\/category\/([^/]+)\/?$/);
    if ((req.method === 'GET' || req.method === 'HEAD') && categoryMatch) {
      const category = decodeURIComponent(categoryMatch[1]);
      const categoryName = SEO_CATEGORIES[category];
      if (!categoryName) return serveStatic(req, res, new URL('/not-found', APP_ORIGIN));
      const canonical = `${PUBLIC_ORIGIN}/projects/category/${category}`;
      const title = `${categoryName} | 0% Commission & Direct Messaging — Searya`;
      const description = `Discover ${categoryName.toLowerCase()} on Searya. Connect directly with founders with 0% platform commission and direct buyer messaging.`;
      return htmlResponse(req, res, renderSeoPage({ title, description, canonical }));
    }
    return serveStatic(req, res, url);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) return fail(res, error.status || 500, 'SERVER_ERROR', error.status ? error.message : 'An unexpected server error occurred.');
    res.end();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Searya running at ${APP_ORIGIN}`);
  console.log(`Database: ${DB_PATH}`);
  console.log(`Payment mode: ${PAYMENT_MODE}`);
  if (NODE_ENV === 'production') {
    const backupStart = setTimeout(() => createDatabaseBackup().catch(error => console.error('Database backup error:', error)), 60_000);
    const alertStart = setTimeout(() => sendDueProjectAlerts().catch(error => console.error('Project alert job error:', error)), 120_000);
    const backupTimer = setInterval(() => createDatabaseBackup().catch(error => console.error('Database backup error:', error)), 24 * 60 * 60 * 1000);
    const alertTimer = setInterval(() => sendDueProjectAlerts().catch(error => console.error('Project alert job error:', error)), 5 * 60 * 1000);
    backupStart.unref();
    alertStart.unref();
    backupTimer.unref();
    alertTimer.unref();
  }
});

function shutdown() {
  server.close(() => { db.close(); process.exit(0); });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export { server, db, packages, hashPassword, verifyPassword, listingFromRow, fulfillPolarOrder };
