import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { initialForSaleListings, initialWtbListings } from './src/data/mockData.js';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || '127.0.0.1';
const NODE_ENV = process.env.NODE_ENV || 'development';
const APP_ORIGIN = process.env.APP_ORIGIN || `http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`;
const PAYMENT_MODE = process.env.PAYMENT_MODE || (NODE_ENV === 'production' ? 'disabled' : 'demo');
const DB_PATH = resolve(ROOT, process.env.SEARYA_DB_PATH || './data/searya.sqlite');
const SESSION_COOKIE = 'searya_session';
const VISITOR_COOKIE = 'searya_visitor';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const MAX_JSON_BYTES = 6 * 1024 * 1024;
const CONTACT_UNLOCK_MESSAGE_COUNT = 6;

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
    created_at TEXT NOT NULL
  ) STRICT;

  CREATE INDEX IF NOT EXISTS page_views_created ON page_views(created_at DESC);
  CREATE INDEX IF NOT EXISTS page_views_visitor_created ON page_views(visitor_id, created_at DESC);

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

const packages = Object.freeze({
  buyer_connections_10: { key: 'buyer_connections_10', name: '10 Bağlantı Paketi', amountCents: 900, buyerConnections: 10 },
  seller_listings_3: { key: 'seller_listings_3', name: '3 İlan Paketi', amountCents: 900, sellerListingCredits: 3 },
  seller_vip_10: { key: 'seller_vip_10', name: 'Satıcı Pro Lansman Paketi', amountCents: 1999, sellerListingCredits: 10, sellerVipCredits: 1, boostCredits: 1 }
});

function nowIso() {
  return new Date().toISOString();
}

function cleanText(value, max = 500) {
  return String(value ?? '').replace(/<[^>]*>/g, '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
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

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email || null,
    name: row.name,
    role: row.role,
    isAdmin: Boolean(row.is_admin),
    emailVerified: Boolean(row.email_verified),
    isVerified: Boolean(row.is_verified),
    buyerConnections: row.buyer_connections,
    sellerFreeListings: row.seller_free_listings,
    sellerListingCredits: row.seller_listing_credits,
    sellerVipCredits: row.seller_vip_credits,
    boostCredits: row.boost_credits,
    createdAt: row.created_at
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
  if (NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}

function visitorCookie(visitorId, clear = false) {
  const parts = [`${VISITOR_COOKIE}=${clear ? '' : encodeURIComponent(visitorId)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${clear ? 0 : 60 * 60 * 24 * 365}`];
  if (NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}

function createSession(userId) {
  const token = randomBytes(32).toString('base64url');
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').run(sha256(token), userId, expiresAt, createdAt);
  return token;
}

function json(res, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}

function fail(res, status, code, message) {
  return json(res, status, { error: { code, message } });
}

async function readBody(req, maxBytes = MAX_JSON_BYTES) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) throw Object.assign(new Error('İstek çok büyük.'), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJson(req) {
  const raw = await readBody(req);
  if (!raw.length) return {};
  try { return JSON.parse(raw.toString('utf8')); } catch { throw Object.assign(new Error('Geçersiz JSON.'), { status: 400 }); }
}

function requireUser(req, res, admin = false) {
  const user = getUser(req);
  if (!user) { fail(res, 401, 'AUTH_REQUIRED', 'Bu işlem için giriş yapmalısınız.'); return null; }
  if (admin && !user.is_admin) { fail(res, 403, 'ADMIN_REQUIRED', 'Bu işlem için yönetici yetkisi gerekir.'); return null; }
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
    askingPrice: row.price_cents / 100,
    budget: row.price_cents / 100,
    status: row.status === 'approved' ? (row.is_verified ? 'Doğrulanmış' : 'Aktif') : row.status,
    statusEn: row.status === 'approved' ? (row.is_verified ? 'Verified' : 'Active') : row.status,
    isVerified: Boolean(row.is_verified),
    priorityReview: Boolean(row.priority_review),
    boostedUntil: row.boosted_until || null,
    isBoosted: Boolean(row.boosted_until && row.boosted_until > nowIso()),
    views: row.views,
    createdAtIso: row.created_at,
    ownerId: row.user_id
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
  const category = ['ai', 'saas', 'extension', 'mobile'].includes(body.category) ? body.category : 'saas';
  const price = Number(body.price ?? body.askingPrice ?? body.budget);
  const description = cleanText(body.description, 2000);
  const techStack = Array.isArray(body.techStack) ? body.techStack.map(item => cleanText(item, 40)).filter(Boolean).slice(0, 8) : [];
  const coverImage = type === 'sale' ? safeImageData(body.coverImage) : '';
  if (title.length < 3 || !Number.isFinite(price) || price <= 0 || description.length < 20 || !techStack.length) throw Object.assign(new Error('İlan alanlarını eksiksiz ve doğru doldurun.'), { status: 422 });
  if (type === 'sale' && !coverImage) throw Object.assign(new Error('Gerçek bir proje görseli ekleyin.'), { status: 422 });
  const seller = { name: user.name, handle: `@${slugify(user.name).replaceAll('-', '_')}`, avatar: '', githubVerified: Boolean(user.is_verified) };
  return { title, type, category, price, content: { titleEn: title, categoryEn: category.toUpperCase(), shortDesc: description, shortDescEn: description, description, descriptionEn: description, fullDesc: description, fullDescEn: description, coverImage, techStack, techPreference: techStack.join(', '), seller, buyer: { name: user.name, avatar: '' }, mrr: 0, isAnonymous: false } };
}

const rateBuckets = new Map();
function rateLimited(req, key, limit, windowMs) {
  const now = Date.now();
  const ip = req.socket.remoteAddress || 'unknown';
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
  if (!response.ok) throw new Error(`E-posta sağlayıcısı ${response.status} döndürdü.`);
  return { configured: true, data: await response.json() };
}

function grantPackage(userId, packageKey) {
  const pack = packages[packageKey];
  if (!pack) return false;
  db.prepare(`UPDATE users SET buyer_connections=buyer_connections+?, seller_listing_credits=seller_listing_credits+?, seller_vip_credits=seller_vip_credits+?, boost_credits=boost_credits+? WHERE id=?`).run(pack.buyerConnections || 0, pack.sellerListingCredits || 0, pack.sellerVipCredits || 0, pack.boostCredits || 0, userId);
  return true;
}

function verifyStripeSignature(rawBody, signatureHeader) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const entries = Object.fromEntries(signatureHeader.split(',').map(item => item.split('=')));
  const timestamp = Number(entries.t);
  if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > 300 || !entries.v1) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody.toString('utf8')}`).digest('hex');
  const actualBuffer = Buffer.from(entries.v1, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
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
      const person = item.seller || item.buyer || { name: 'Searya Kullanıcısı' };
      const userId = `seed-${slugify(person.name)}`;
      const createdAt = new Date(Date.now() - Math.max(1, Number(item.id?.match(/\d+/)?.[0] || 1)) * 3600000).toISOString();
      insertUser.run(userId, null, null, person.name, item.type === 'wtb' ? 'buyer' : 'seller', person.githubVerified ? 1 : 0, createdAt, createdAt);
      insertListing.run(item.id, userId, item.type === 'wtb' ? 'wtb' : 'sale', item.title, uniqueSlug(item.title), item.category || 'saas', Math.round(Number(item.askingPrice || item.budget || 1) * 100), JSON.stringify(item), 'approved', item.status === 'Doğrulanmış' || item.statusEn === 'Verified' ? 1 : 0, 0, Number(item.views || 0), createdAt, createdAt);
    }
    db.exec('UPDATE users SET email_verified=1 WHERE email IS NULL;');
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

seedData();
bootstrapAdmin();

async function handleApi(req, res, url) {
  const method = req.method || 'GET';
  const pathname = url.pathname;
  const mutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  if (mutation) {
    const origin = req.headers.origin;
    const requestHost = String(req.headers.host || '');
    const sameHostOrigins = new Set([APP_ORIGIN, `http://${requestHost}`, `https://${requestHost}`]);
    if (origin && !sameHostOrigins.has(origin)) return fail(res, 403, 'BAD_ORIGIN', 'İstek kaynağı doğrulanamadı.');
  }

  if (method === 'GET' && pathname === '/api/health') {
    return json(res, 200, { ok: true, service: 'searya-api', environment: NODE_ENV, paymentMode: PAYMENT_MODE, emailConfigured: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM), time: nowIso() });
  }

  if (method === 'POST' && pathname === '/api/analytics/pageview') {
    if (rateLimited(req, 'pageview', 240, 60 * 60 * 1000)) return json(res, 202, { ok: true });
    const body = await readJson(req);
    const cookies = parseCookies(req);
    const existingId = String(cookies[VISITOR_COOKIE] || '');
    const visitorId = /^[a-f0-9-]{20,50}$/i.test(existingId) ? existingId : randomUUID();
    db.prepare('INSERT INTO page_views(id,visitor_id,path,created_at) VALUES(?,?,?,?)').run(randomUUID(), visitorId, cleanText(body.path || '/', 240), nowIso());
    return json(res, 201, { ok: true }, existingId ? {} : { 'Set-Cookie': visitorCookie(visitorId) });
  }

  if (method === 'DELETE' && pathname === '/api/analytics/consent') {
    const visitorId = String(parseCookies(req)[VISITOR_COOKIE] || '');
    if (visitorId) db.prepare('DELETE FROM page_views WHERE visitor_id=?').run(visitorId);
    return json(res, 200, { ok: true }, { 'Set-Cookie': visitorCookie('', true) });
  }

  if (method === 'POST' && pathname === '/api/stripe/webhook') {
    const raw = await readBody(req, 2 * 1024 * 1024);
    if (!verifyStripeSignature(raw, req.headers['stripe-signature'])) return fail(res, 400, 'INVALID_SIGNATURE', 'Webhook imzası geçersiz.');
    const event = JSON.parse(raw.toString('utf8'));
    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object || {};
      const purchaseId = session.metadata?.purchase_id;
      const purchase = purchaseId ? db.prepare('SELECT * FROM purchases WHERE id=?').get(purchaseId) : null;
      if (purchase && purchase.status !== 'paid') {
        db.exec('BEGIN');
        try {
          db.prepare('UPDATE purchases SET status=\'paid\',provider_ref=?,updated_at=? WHERE id=?').run(session.id || null, nowIso(), purchase.id);
          grantPackage(purchase.user_id, purchase.package_key);
          db.exec('COMMIT');
        } catch (error) { db.exec('ROLLBACK'); throw error; }
      }
    }
    return json(res, 200, { received: true });
  }

  if (method === 'POST' && pathname === '/api/auth/register') {
    if (rateLimited(req, 'register', 8, 60 * 60 * 1000)) return fail(res, 429, 'RATE_LIMIT', 'Çok fazla kayıt denemesi.');
    if (NODE_ENV === 'production' && (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)) return fail(res, 503, 'EMAIL_NOT_CONFIGURED', 'Kayıt e-postası servisi yapılandırılmadı.');
    const body = await readJson(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const name = cleanText(body.name, 80);
    const role = ['buyer', 'seller', 'both'].includes(body.role) ? body.role : 'buyer';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || name.length < 2) return fail(res, 422, 'INVALID_INPUT', 'Ad, geçerli e-posta ve en az 8 karakterli şifre gereklidir.');
    if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email)) return fail(res, 409, 'EMAIL_EXISTS', 'Bu e-posta ile kayıtlı bir hesap var.');
    const id = randomUUID();
    const now = nowIso();
    const verificationRequired = NODE_ENV === 'production';
    db.prepare(`INSERT INTO users(id,email,password_hash,name,role,status,is_admin,email_verified,is_verified,buyer_connections,seller_free_listings,seller_listing_credits,seller_vip_credits,created_at,last_seen_at) VALUES(?,?,?,?,?,'active',0,?,0,2,1,0,0,?,?)`).run(id, email, hashPassword(password), name, role, verificationRequired ? 0 : 1, now, now);
    if (verificationRequired) {
      const verificationToken = randomBytes(32).toString('base64url');
      db.prepare('INSERT INTO email_verifications(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').run(sha256(verificationToken), id, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), now);
      const verifyUrl = `${APP_ORIGIN}/?verify_token=${encodeURIComponent(verificationToken)}`;
      await sendEmail({ to: email, subject: 'Searya e-posta doğrulama', text: `Merhaba ${name}, e-posta adresinizi 24 saat içinde doğrulayın: ${verifyUrl}`, idempotencyKey: `verify-${id}` });
      return json(res, 201, { user: null, verificationRequired: true });
    }
    const token = createSession(id);
    sendEmail({ to: email, subject: 'Searya hesabınız hazır', text: `Merhaba ${name}, Searya hesabınız oluşturuldu.`, idempotencyKey: `welcome-${id}` }).catch(console.error);
    return json(res, 201, { user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(id)), verificationRequired: false }, { 'Set-Cookie': sessionCookie(token) });
  }

  if (method === 'POST' && pathname === '/api/auth/login') {
    if (rateLimited(req, 'login', 20, 15 * 60 * 1000)) return fail(res, 429, 'RATE_LIMIT', 'Çok fazla giriş denemesi.');
    const body = await readJson(req);
    const email = String(body.email || '').trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    if (!user || !verifyPassword(body.password, user.password_hash) || user.status !== 'active') return fail(res, 401, 'INVALID_CREDENTIALS', 'E-posta veya şifre hatalı.');
    if (!user.email_verified) return fail(res, 403, 'EMAIL_NOT_VERIFIED', 'Giriş yapmadan önce e-posta adresinizi doğrulayın.');
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
    if (!verifyPassword(currentPassword, user.password_hash)) return fail(res, 422, 'INVALID_PASSWORD', 'Mevcut şifre hatalı.');
    if (newPassword.length < 8) return fail(res, 422, 'WEAK_PASSWORD', 'Yeni şifre en az 8 karakter olmalıdır.');
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
    if (user.is_admin) return fail(res, 422, 'ADMIN_ACCOUNT', 'Birincil yönetici hesabı bu ekrandan silinemez.');
    if (!verifyPassword(String(body.password || ''), user.password_hash) || body.confirmation !== 'HESABIMI SİL') return fail(res, 422, 'INVALID_CONFIRMATION', 'Şifre veya silme onayı hatalı.');
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
    if (rateLimited(req, 'forgot', 6, 60 * 60 * 1000)) return fail(res, 429, 'RATE_LIMIT', 'Bir süre sonra yeniden deneyin.');
    const body = await readJson(req);
    const email = String(body.email || '').trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    let previewToken = null;
    if (user) {
      const token = randomBytes(32).toString('base64url');
      const createdAt = nowIso();
      db.prepare('INSERT INTO password_resets(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').run(sha256(token), user.id, new Date(Date.now() + 30 * 60 * 1000).toISOString(), createdAt);
      const resetUrl = `${APP_ORIGIN}/?reset_token=${encodeURIComponent(token)}`;
      const mail = await sendEmail({ to: email, subject: 'Searya şifre sıfırlama', text: `Şifrenizi 30 dakika içinde sıfırlayın: ${resetUrl}`, idempotencyKey: `reset-${sha256(token).slice(0, 24)}` }).catch(() => ({ configured: false }));
      if (!mail.configured && NODE_ENV !== 'production') previewToken = token;
    }
    return json(res, 200, { ok: true, message: 'Hesap varsa sıfırlama talimatı gönderildi.', ...(previewToken ? { previewToken } : {}) });
  }

  if (method === 'POST' && pathname === '/api/auth/reset-password') {
    const body = await readJson(req);
    const password = String(body.password || '');
    const tokenHash = sha256(String(body.token || ''));
    const reset = db.prepare('SELECT * FROM password_resets WHERE token_hash=? AND expires_at>? AND used_at IS NULL').get(tokenHash, nowIso());
    if (!reset || password.length < 8) return fail(res, 422, 'INVALID_RESET', 'Bağlantı geçersiz veya süresi dolmuş.');
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
    if (!verification) return fail(res, 422, 'INVALID_VERIFICATION', 'Doğrulama bağlantısı geçersiz veya süresi dolmuş.');
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
  if (method === 'GET' && listingMatch) {
    const slug = decodeURIComponent(listingMatch[1]);
    const row = db.prepare(`SELECT * FROM listings WHERE (slug=? OR id=?) AND status='approved'`).get(slug, slug);
    if (!row) return fail(res, 404, 'NOT_FOUND', 'İlan bulunamadı.');
    db.prepare('UPDATE listings SET views=views+1 WHERE id=?').run(row.id);
    row.views += 1;
    return json(res, 200, { listing: listingFromRow(row) });
  }

  if (method === 'POST' && pathname === '/api/listings') {
    const user = requireUser(req, res); if (!user) return;
    if (rateLimited(req, `listing:${user.id}`, 10, 60 * 60 * 1000)) return fail(res, 429, 'RATE_LIMIT', 'Saatlik ilan sınırına ulaştınız.');
    const input = mapListingInput(await readJson(req), user);
    const priorityReview = 0;
    if (input.type === 'sale') {
      if (user.seller_free_listings > 0) db.prepare('UPDATE users SET seller_free_listings=seller_free_listings-1 WHERE id=?').run(user.id);
      else if (user.seller_listing_credits > 0) db.prepare('UPDATE users SET seller_listing_credits=seller_listing_credits-1 WHERE id=?').run(user.id);
      else return fail(res, 402, 'LISTING_CREDIT_REQUIRED', 'Yeni bir satıcı ilan paketi gereklidir.');
    }
    const id = randomUUID();
    const createdAt = nowIso();
    const status = user.is_admin ? 'approved' : 'pending';
    db.prepare(`INSERT INTO listings(id,user_id,type,title,slug,category,price_cents,content_json,status,is_verified,priority_review,views,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,0,?,0,?,?)`).run(id, user.id, input.type, input.title, uniqueSlug(input.title), input.category, Math.round(input.price * 100), JSON.stringify(input.content), status, priorityReview, createdAt, createdAt);
    const row = db.prepare('SELECT * FROM listings WHERE id=?').get(id);
    if (user.email) sendEmail({ to: user.email, subject: 'Searya ilanınız alındı', text: `${input.title} ilanınız ${status === 'pending' ? 'güvenlik incelemesine alındı' : 'yayınlandı'}.`, idempotencyKey: `listing-${id}` }).catch(console.error);
    return json(res, 201, { listing: listingFromRow(row), moderation: status === 'pending' ? 'pending' : 'approved', user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(user.id)) });
  }

  const listingAddonMatch = pathname.match(/^\/api\/listings\/([^/]+)\/addon$/);
  if (method === 'POST' && listingAddonMatch) {
    const user = requireUser(req, res); if (!user) return;
    const id = decodeURIComponent(listingAddonMatch[1]);
    const row = db.prepare('SELECT * FROM listings WHERE id=?').get(id);
    if (!row) return fail(res, 404, 'NOT_FOUND', 'İlan bulunamadı.');
    if (row.user_id !== user.id && !user.is_admin) return fail(res, 403, 'FORBIDDEN', 'Bu ilana hak uygulayamazsınız.');
    if (row.type !== 'sale') return fail(res, 422, 'SALE_LISTING_REQUIRED', 'Bu hak yalnızca satılık proje ilanlarında kullanılabilir.');
    const body = await readJson(req);
    if (body.addon === 'verification') {
      if (row.is_verified) return fail(res, 422, 'ALREADY_VERIFIED', 'Bu ilan zaten doğrulanmış.');
      const freshUser = db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
      if (freshUser.seller_vip_credits <= 0) return fail(res, 402, 'VERIFICATION_CREDIT_REQUIRED', 'Doğrulama inceleme hakkınız bulunmuyor.');
      db.exec('BEGIN');
      try {
        db.prepare('UPDATE users SET seller_vip_credits=seller_vip_credits-1 WHERE id=?').run(user.id);
        db.prepare(`UPDATE listings SET priority_review=1,status='pending',is_verified=0,updated_at=? WHERE id=?`).run(nowIso(), id);
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    } else if (body.addon === 'boost') {
      if (row.status !== 'approved') return fail(res, 422, 'APPROVED_LISTING_REQUIRED', 'Yalnızca yayındaki ilanlar öne çıkarılabilir.');
      const freshUser = db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
      if (freshUser.boost_credits <= 0) return fail(res, 402, 'BOOST_CREDIT_REQUIRED', 'Öne çıkarma hakkınız bulunmuyor.');
      const currentEnd = row.boosted_until && new Date(row.boosted_until).getTime() > Date.now() ? new Date(row.boosted_until).getTime() : Date.now();
      const boostedUntil = new Date(currentEnd + 7 * 24 * 60 * 60 * 1000).toISOString();
      db.exec('BEGIN');
      try {
        db.prepare('UPDATE users SET boost_credits=boost_credits-1 WHERE id=?').run(user.id);
        db.prepare('UPDATE listings SET boosted_until=?,updated_at=? WHERE id=?').run(boostedUntil, nowIso(), id);
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    } else return fail(res, 422, 'INVALID_ADDON', 'Geçersiz ilan hakkı.');
    return json(res, 200, {
      listing: listingFromRow(db.prepare('SELECT * FROM listings WHERE id=?').get(id)),
      user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(user.id))
    });
  }

  if ((method === 'PATCH' || method === 'DELETE') && listingMatch) {
    const user = requireUser(req, res); if (!user) return;
    const id = decodeURIComponent(listingMatch[1]);
    const row = db.prepare('SELECT * FROM listings WHERE id=?').get(id);
    if (!row) return fail(res, 404, 'NOT_FOUND', 'İlan bulunamadı.');
    if (row.user_id !== user.id && !user.is_admin) return fail(res, 403, 'FORBIDDEN', 'Bu ilanı değiştiremezsiniz.');
    if (method === 'DELETE') { db.prepare('DELETE FROM listings WHERE id=?').run(id); return json(res, 200, { ok: true }); }
    const input = mapListingInput(await readJson(req), user);
    db.prepare(`UPDATE listings SET type=?,title=?,slug=?,category=?,price_cents=?,content_json=?,status=?,is_verified=0,updated_at=? WHERE id=?`).run(input.type, input.title, uniqueSlug(input.title, id), input.category, Math.round(input.price * 100), JSON.stringify(input.content), user.is_admin ? row.status : 'pending', nowIso(), id);
    const updated = db.prepare('SELECT * FROM listings WHERE id=?').get(id);
    return json(res, 200, { listing: listingFromRow(updated), moderation: updated.status, user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(user.id)) });
  }

  if (method === 'GET' && pathname === '/api/threads') {
    const user = requireUser(req, res); if (!user) return;
    const rows = db.prepare(`SELECT t.*,l.title,l.price_cents,l.type,u1.name AS a_name,u2.name AS b_name FROM threads t JOIN listings l ON l.id=t.listing_id JOIN users u1 ON u1.id=t.user_a JOIN users u2 ON u2.id=t.user_b WHERE t.user_a=? OR t.user_b=? ORDER BY t.updated_at DESC`).all(user.id, user.id);
    const result = rows.map(thread => {
      const partnerName = thread.user_a === user.id ? thread.b_name : thread.a_name;
      const messages = db.prepare('SELECT * FROM messages WHERE thread_id=? ORDER BY created_at').all(thread.id).map(message => ({ id: message.id, sender: message.sender_id === user.id ? 'me' : 'them', text: message.body, textEn: message.body, time: new Date(message.created_at).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }));
      return { id: thread.id, listingId: thread.listing_id, partnerName, partnerAvatar: '', projectTitle: thread.title, askingPrice: `$${(thread.price_cents / 100).toLocaleString('en-US')}`, unread: false, messages };
    });
    return json(res, 200, { threads: result, user: publicUser(user) });
  }

  if (method === 'POST' && pathname === '/api/threads') {
    const user = requireUser(req, res); if (!user) return;
    const body = await readJson(req);
    const listing = db.prepare(`SELECT l.*,u.name AS owner_name FROM listings l JOIN users u ON u.id=l.user_id WHERE l.id=? AND l.status='approved'`).get(String(body.listingId || ''));
    if (!listing) return fail(res, 404, 'NOT_FOUND', 'İlan bulunamadı.');
    if (listing.user_id === user.id) return fail(res, 422, 'OWN_LISTING', 'Kendi ilanınıza mesaj gönderemezsiniz.');
    const pair = [user.id, listing.user_id].sort();
    if (db.prepare('SELECT 1 FROM blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?)').get(user.id, listing.user_id, listing.user_id, user.id)) return fail(res, 403, 'USER_BLOCKED', 'Bu kullanıcıyla yeni görüşme başlatılamaz.');
    let thread = db.prepare('SELECT * FROM threads WHERE listing_id=? AND user_a=? AND user_b=?').get(listing.id, pair[0], pair[1]);
    if (!thread) {
      if (listing.type === 'sale') {
        const contacted = db.prepare('SELECT 1 FROM contacted_projects WHERE user_id=? AND listing_id=?').get(user.id, listing.id);
        if (!contacted) {
          const freshUser = db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
          if (freshUser.buyer_connections <= 0) return fail(res, 402, 'CONNECTION_CREDIT_REQUIRED', 'Yeni satıcı bağlantısı için bağlantı paketi gereklidir.');
          db.prepare('UPDATE users SET buyer_connections=buyer_connections-1 WHERE id=?').run(user.id);
          db.prepare('INSERT INTO contacted_projects(user_id,listing_id,created_at) VALUES(?,?,?)').run(user.id, listing.id, nowIso());
        }
      }
      const id = randomUUID();
      const createdAt = nowIso();
      db.prepare('INSERT INTO threads(id,listing_id,user_a,user_b,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(id, listing.id, pair[0], pair[1], createdAt, createdAt);
      db.prepare('INSERT INTO messages(id,thread_id,sender_id,body,created_at) VALUES(?,?,?,?,?)').run(randomUUID(), id, user.id, cleanText(body.message || `${listing.title} ilanı hakkında görüşmek istiyorum.`, 1000), createdAt);
      thread = db.prepare('SELECT * FROM threads WHERE id=?').get(id);
    }
    return json(res, 201, { threadId: thread.id, user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(user.id)) });
  }

  const messageMatch = pathname.match(/^\/api\/threads\/([^/]+)\/messages$/);
  if (method === 'POST' && messageMatch) {
    const user = requireUser(req, res); if (!user) return;
    if (rateLimited(req, `message:${user.id}`, 60, 60 * 1000)) return fail(res, 429, 'RATE_LIMIT', 'Çok hızlı mesaj gönderiyorsunuz.');
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND (user_a=? OR user_b=?)').get(decodeURIComponent(messageMatch[1]), user.id, user.id);
    if (!thread) return fail(res, 404, 'NOT_FOUND', 'Görüşme bulunamadı.');
    const body = await readJson(req);
    const text = cleanText(body.message, 1000);
    if (!text) return fail(res, 422, 'EMPTY_MESSAGE', 'Mesaj boş olamaz.');
    const count = db.prepare('SELECT COUNT(*) AS count FROM messages WHERE thread_id=?').get(thread.id).count;
    if (count < CONTACT_UNLOCK_MESSAGE_COUNT && contactInfoDetected(text)) return fail(res, 422, 'CONTACT_INFO_LOCKED', `İletişim bilgileri ilk ${CONTACT_UNLOCK_MESSAGE_COUNT} mesaj tamamlandıktan sonra paylaşılabilir.`);
    const createdAt = nowIso();
    const id = randomUUID();
    db.prepare('INSERT INTO messages(id,thread_id,sender_id,body,created_at) VALUES(?,?,?,?,?)').run(id, thread.id, user.id, text, createdAt);
    db.prepare('UPDATE threads SET updated_at=? WHERE id=?').run(createdAt, thread.id);
    const recipientId = thread.user_a === user.id ? thread.user_b : thread.user_a;
    const recipient = db.prepare('SELECT email,name FROM users WHERE id=?').get(recipientId);
    if (recipient?.email) sendEmail({ to: recipient.email, subject: 'Searya’da yeni mesajınız var', text: `${user.name} size yeni bir mesaj gönderdi: ${text.slice(0, 180)}`, idempotencyKey: `message-${id}` }).catch(console.error);
    return json(res, 201, { message: { id, sender: 'me', text, textEn: text, time: 'Şimdi' } });
  }

  if (method === 'GET' && pathname === '/api/packages') return json(res, 200, { packages: Object.values(packages), mode: PAYMENT_MODE });

  if (method === 'POST' && pathname === '/api/packages/checkout') {
    const user = requireUser(req, res); if (!user) return;
    const body = await readJson(req);
    const pack = packages[body.packageKey];
    if (!pack) return fail(res, 404, 'PACKAGE_NOT_FOUND', 'Paket bulunamadı.');
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
      if (user.email) sendEmail({ to: user.email, subject: 'Searya paketiniz aktifleştirildi', text: `${pack.name} hesabınıza tanımlandı.`, idempotencyKey: `purchase-${purchaseId}` }).catch(console.error);
      return json(res, 200, { mode: 'demo', paid: true, packageKey: pack.key, amountCents: pack.amountCents, user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(user.id)) });
    }
    if (PAYMENT_MODE !== 'stripe' || !process.env.STRIPE_SECRET_KEY) return fail(res, 503, 'PAYMENT_NOT_CONFIGURED', 'Canlı ödeme sağlayıcısı henüz yapılandırılmadı.');
    const form = new URLSearchParams({
      mode: 'payment',
      success_url: `${APP_ORIGIN}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_ORIGIN}/?payment=cancelled`,
      client_reference_id: user.id,
      customer_email: user.email,
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][unit_amount]': String(pack.amountCents),
      'line_items[0][price_data][product_data][name]': pack.name,
      'metadata[purchase_id]': purchaseId,
      'metadata[user_id]': user.id,
      'metadata[package_key]': pack.key
    });
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form });
    const stripe = await response.json();
    if (!response.ok || !stripe.url) return fail(res, 502, 'PAYMENT_PROVIDER_ERROR', stripe.error?.message || 'Ödeme oturumu oluşturulamadı.');
    db.prepare('UPDATE purchases SET provider_ref=?,updated_at=? WHERE id=?').run(stripe.id, nowIso(), purchaseId);
    return json(res, 200, { mode: 'stripe', checkoutUrl: stripe.url });
  }

  if (method === 'POST' && pathname === '/api/reports') {
    const user = requireUser(req, res); if (!user) return;
    const body = await readJson(req);
    const targetType = ['listing', 'user', 'message'].includes(body.targetType) ? body.targetType : 'listing';
    const targetId = cleanText(body.targetId, 100);
    const reason = cleanText(body.reason, 500);
    if (!targetId || reason.length < 10) return fail(res, 422, 'INVALID_REPORT', 'Şikâyet nedenini açıklayın.');
    db.prepare('INSERT INTO reports(id,reporter_id,target_type,target_id,reason,created_at) VALUES(?,?,?,?,?,?)').run(randomUUID(), user.id, targetType, targetId, reason, nowIso());
    return json(res, 201, { ok: true });
  }

  if (method === 'POST' && pathname === '/api/blocks') {
    const user = requireUser(req, res); if (!user) return;
    const body = await readJson(req);
    const blockedId = cleanText(body.userId, 100);
    if (!blockedId || blockedId === user.id || !db.prepare('SELECT 1 FROM users WHERE id=?').get(blockedId)) return fail(res, 422, 'INVALID_USER', 'Kullanıcı bulunamadı.');
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
    const dailyRows = db.prepare(`SELECT substr(created_at,1,10) AS day,COUNT(*) AS views,COUNT(DISTINCT visitor_id) AS visitors FROM page_views WHERE created_at>=? GROUP BY day`).all(sevenDaysIso.toISOString());
    const signupRows = db.prepare(`SELECT substr(created_at,1,10) AS day,COUNT(*) AS signups FROM users WHERE created_at>=? AND email IS NOT NULL AND is_admin=0 GROUP BY day`).all(sevenDaysIso.toISOString());
    const dailyMap = new Map(dailyRows.map(row => [row.day, row]));
    const signupMap = new Map(signupRows.map(row => [row.day, row.signups]));
    const daily = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(sevenDaysIso.getTime() + index * 86400000);
      const day = date.toISOString().slice(0, 10);
      return { day, views: dailyMap.get(day)?.views || 0, visitors: dailyMap.get(day)?.visitors || 0, signups: signupMap.get(day) || 0 };
    });
    return json(res, 200, {
      counts: {
        pendingListings: db.prepare(`SELECT COUNT(*) AS count FROM listings WHERE status='pending'`).get().count,
        openReports: db.prepare(`SELECT COUNT(*) AS count FROM reports WHERE status='open'`).get().count,
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
      pendingListings: db.prepare(`SELECT * FROM listings WHERE status='pending' ORDER BY priority_review DESC,created_at`).all().map(listingFromRow),
      recentListings: db.prepare(`SELECT l.*,u.name AS owner_name,u.email AS owner_email FROM listings l JOIN users u ON u.id=l.user_id WHERE l.user_id NOT LIKE 'seed-%' ORDER BY l.created_at DESC LIMIT 50`).all().map(row => ({ ...listingFromRow(row), ownerName: row.owner_name, ownerEmail: row.owner_email })),
      users: db.prepare(`SELECT id,email,name,role,status,is_admin AS isAdmin,is_verified AS isVerified,buyer_connections AS buyerConnections,seller_listing_credits AS sellerListingCredits,seller_vip_credits AS sellerVipCredits,boost_credits AS boostCredits,created_at AS createdAt,last_seen_at AS lastSeenAt FROM users WHERE email IS NOT NULL ORDER BY created_at DESC LIMIT 100`).all(),
      purchases: db.prepare(`SELECT p.id,p.package_key AS packageKey,p.amount_cents AS amountCents,p.currency,p.status,p.created_at AS createdAt,u.name AS userName,u.email AS userEmail FROM purchases p JOIN users u ON u.id=p.user_id ORDER BY p.created_at DESC LIMIT 100`).all(),
      reports: db.prepare(`SELECT r.id,r.target_type AS targetType,r.target_id AS targetId,r.reason,r.status,r.created_at AS createdAt,reporter.name AS reporterName,reporter.email AS reporterEmail,COALESCE(l.title,target.name,r.target_id) AS targetLabel FROM reports r JOIN users reporter ON reporter.id=r.reporter_id LEFT JOIN listings l ON r.target_type='listing' AND l.id=r.target_id LEFT JOIN users target ON r.target_type='user' AND target.id=r.target_id ORDER BY r.created_at DESC LIMIT 100`).all()
    });
  }

  const adminUserMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/status$/);
  if (method === 'POST' && adminUserMatch) {
    const user = requireUser(req, res, true); if (!user) return;
    const targetId = decodeURIComponent(adminUserMatch[1]);
    const body = await readJson(req);
    const status = ['active', 'suspended'].includes(body.status) ? body.status : '';
    const target = db.prepare('SELECT id,is_admin FROM users WHERE id=?').get(targetId);
    if (!target) return fail(res, 404, 'NOT_FOUND', 'Kullanıcı bulunamadı.');
    if (!status || target.id === user.id || target.is_admin) return fail(res, 422, 'INVALID_ACTION', 'Bu kullanıcı durumu değiştirilemez.');
    db.prepare('UPDATE users SET status=? WHERE id=?').run(status, targetId);
    if (status === 'suspended') db.prepare('DELETE FROM sessions WHERE user_id=?').run(targetId);
    return json(res, 200, { ok: true, status });
  }

  const adminReportMatch = pathname.match(/^\/api\/admin\/reports\/([^/]+)$/);
  if (method === 'POST' && adminReportMatch) {
    const user = requireUser(req, res, true); if (!user) return;
    const body = await readJson(req);
    const status = ['resolved', 'dismissed', 'open'].includes(body.status) ? body.status : '';
    if (!status) return fail(res, 422, 'INVALID_ACTION', 'Geçersiz şikâyet işlemi.');
    const result = db.prepare('UPDATE reports SET status=? WHERE id=?').run(status, decodeURIComponent(adminReportMatch[1]));
    if (!result.changes) return fail(res, 404, 'NOT_FOUND', 'Şikâyet bulunamadı.');
    return json(res, 200, { ok: true, status });
  }

  const moderateMatch = pathname.match(/^\/api\/admin\/listings\/([^/]+)\/moderate$/);
  if (method === 'POST' && moderateMatch) {
    const user = requireUser(req, res, true); if (!user) return;
    const body = await readJson(req);
    const action = ['approve', 'reject', 'verify'].includes(body.action) ? body.action : '';
    if (!action) return fail(res, 422, 'INVALID_ACTION', 'Geçersiz yönetim işlemi.');
    const id = decodeURIComponent(moderateMatch[1]);
    if (!db.prepare('SELECT 1 FROM listings WHERE id=?').get(id)) return fail(res, 404, 'NOT_FOUND', 'İlan bulunamadı.');
    if (action === 'reject') db.prepare(`UPDATE listings SET status='rejected',is_verified=0,priority_review=0,updated_at=? WHERE id=?`).run(nowIso(), id);
    else db.prepare(`UPDATE listings SET status='approved',is_verified=?,priority_review=0,updated_at=? WHERE id=?`).run(action === 'verify' ? 1 : 0, nowIso(), id);
    const updatedListing = db.prepare('SELECT * FROM listings WHERE id=?').get(id);
    const owner = db.prepare('SELECT email,name FROM users WHERE id=?').get(updatedListing.user_id);
    if (owner?.email) sendEmail({ to: owner.email, subject: 'Searya ilan inceleme sonucu', text: `${updatedListing.title} ilanınız ${action === 'reject' ? 'reddedildi' : action === 'verify' ? 'doğrulandı ve yayınlandı' : 'onaylandı ve yayınlandı'}.`, idempotencyKey: `moderation-${id}-${updatedListing.updated_at}` }).catch(console.error);
    return json(res, 200, { listing: listingFromRow(updatedListing) });
  }

  return fail(res, 404, 'API_NOT_FOUND', 'API yolu bulunamadı.');
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8'
};

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
    return fail(res, 404, 'PAGE_NOT_FOUND', 'Sayfa bulunamadı.');
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
    if (url.pathname === '/robots.txt') {
      const body = `User-agent: *\nAllow: /\nSitemap: ${APP_ORIGIN}/sitemap.xml\n`;
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'public, max-age=3600' });
      return res.end(body);
    }
    if (url.pathname === '/sitemap.xml') {
      const listingRows = db.prepare(`SELECT slug,updated_at FROM listings WHERE status='approved' ORDER BY updated_at DESC`).all();
      const pages = ['', 'legal/privacy.html', 'legal/terms.html', 'legal/cookies.html', 'legal/transfer-checklist.html'].map(path => `<url><loc>${APP_ORIGIN}/${path}</loc></url>`).join('');
      const listings = listingRows.map(row => `<url><loc>${APP_ORIGIN}/?listing=${encodeURIComponent(row.slug)}</loc><lastmod>${row.updated_at.slice(0, 10)}</lastmod></url>`).join('');
      const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages}${listings}</urlset>`;
      res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'public, max-age=3600' });
      return res.end(body);
    }
    return serveStatic(req, res, url);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) return fail(res, error.status || 500, 'SERVER_ERROR', error.status ? error.message : 'Beklenmeyen bir sunucu hatası oluştu.');
    res.end();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Searya running at ${APP_ORIGIN}`);
  console.log(`Database: ${DB_PATH}`);
  console.log(`Payment mode: ${PAYMENT_MODE}`);
});

function shutdown() {
  server.close(() => { db.close(); process.exit(0); });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export { server, db, packages, hashPassword, verifyPassword, listingFromRow };
