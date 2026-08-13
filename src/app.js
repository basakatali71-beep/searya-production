import { initialForSaleListings, initialWtbListings } from './data/seedListings.js?v=20260813-1';
import { initialMessages } from './data/mockData.js?v=20260812-7';
import { translations } from './data/translations.js?v=20260813-1';
import { ApiError, SearyaApi } from './api.js?v=20260812-10';

const CLIENT_STATE_KEY = 'searya-client-state-v1';
const COOKIE_CONSENT_KEY = 'searya-cookie-consent-v1';
const AUTH_ATTEMPT_KEY = 'searya-auth-attempts-v1';
const AUTH_ATTEMPT_LIMIT = 5;
const AUTH_ATTEMPT_WINDOW_MS = 60_000;
const PRESENCE_HEARTBEAT_MS = 30_000;
let presenceTimer = null;
let presenceSessionId = '';
let behaviorSessionStartedAt = 0;
let behaviorSearchTimer = null;
let activeBehaviorFlow = null;
let exitFeedbackTimer = null;
const EXIT_FEEDBACK_KEY = 'searya-exit-feedback-v1';

function readClientState() {
  try {
    return JSON.parse(localStorage.getItem(CLIENT_STATE_KEY) || '{}');
  } catch {
    return {};
  }
}

function cleanUserText(value, maxLength = 500) {
  return String(value ?? '').replace(/<[^>]*>/g, '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizeSearch(value) {
  return String(value ?? '')
    .replace(/[İIı]/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeImageUrl(value, fallback = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80') {
  const url = String(value || '').trim();
  if (/^https:\/\//i.test(url) || /^data:image\/(png|jpe?g|webp);base64,/i.test(url)) return url;
  return fallback;
}

async function optimizeListingImage(file) {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowedTypes.includes(file?.type) || file.size > 5 * 1024 * 1024) {
    throw new Error(state.lang === 'en' ? 'Use a PNG, JPG or WebP image under 5 MB.' : '5 MB altında PNG, JPG veya WebP görsel kullanın.');
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const candidate = new Image();
      candidate.onload = () => resolve(candidate);
      candidate.onerror = () => reject(new Error(state.lang === 'en' ? 'The image could not be read.' : 'Görsel okunamadı.'));
      candidate.src = objectUrl;
    });
    const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
    let scale = Math.min(1, 1600 / Math.max(1, longestSide));
    let dataUrl = '';
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      dataUrl = canvas.toDataURL('image/webp', Math.max(0.62, 0.86 - attempt * 0.08));
      if (dataUrl.length <= 2_800_000) return dataUrl;
      scale *= 0.78;
    }
    if (dataUrl.length > 3_500_000) throw new Error(state.lang === 'en' ? 'The image is still too large. Choose a smaller image.' : 'Görsel hâlâ çok büyük. Daha küçük bir görsel seçin.');
    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function recencyInHours(value) {
  const text = String(value || '').toLocaleLowerCase('tr-TR');
  if (text.includes('şimdi') || text.includes('just now')) return 0;
  const amount = Number.parseInt(text.match(/\d+/)?.[0] || '9999', 10);
  if (text.includes('dakika') || text.includes('minute')) return amount / 60;
  if (text.includes('gün') || text.includes('day')) return amount * 24;
  if (text.includes('hafta') || text.includes('week')) return amount * 24 * 7;
  return amount;
}

function listingCreatedAt(listing) {
  const timestamp = Date.parse(listing?.createdAtIso || '');
  if (Number.isFinite(timestamp)) return timestamp;
  const relative = listing?.createdAtEn || listing?.createdAt || '';
  return Date.now() - recencyInHours(relative) * 60 * 60 * 1000;
}

function authAttemptStatus() {
  const now = Date.now();
  try {
    const saved = JSON.parse(localStorage.getItem(AUTH_ATTEMPT_KEY) || '{}');
    if (!Number.isFinite(saved.resetAt) || saved.resetAt <= now) {
      localStorage.removeItem(AUTH_ATTEMPT_KEY);
      return { count: 0, resetAt: now + AUTH_ATTEMPT_WINDOW_MS, waitSeconds: 0 };
    }
    return {
      count: Math.max(0, Number(saved.count || 0)),
      resetAt: saved.resetAt,
      waitSeconds: Math.max(0, Math.ceil((saved.resetAt - now) / 1000))
    };
  } catch {
    return { count: 0, resetAt: now + AUTH_ATTEMPT_WINDOW_MS, waitSeconds: 0 };
  }
}

function consumeAuthAttempt() {
  const current = authAttemptStatus();
  if (current.count >= AUTH_ATTEMPT_LIMIT && current.waitSeconds > 0) return { allowed: false, ...current };
  const next = { count: current.count + 1, resetAt: current.count ? current.resetAt : Date.now() + AUTH_ATTEMPT_WINDOW_MS };
  try { localStorage.setItem(AUTH_ATTEMPT_KEY, JSON.stringify(next)); } catch { /* Keep authentication usable without storage. */ }
  return { allowed: true, ...next, waitSeconds: 0 };
}

function applyAuthCooldown(button, status, cooldown = authAttemptStatus()) {
  if (cooldown.count < AUTH_ATTEMPT_LIMIT || cooldown.waitSeconds <= 0) return false;
  if (button) {
    button.disabled = true;
    button.classList.add('opacity-60', 'cursor-not-allowed');
  }
  if (status) {
    status.textContent = `Too many attempts. Please wait ${cooldown.waitSeconds} seconds before continuing.`;
    status.className = 'rounded-xl px-3 py-2.5 text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200';
  }
  window.setTimeout(() => renderAuthCard(), cooldown.waitSeconds * 1000 + 100);
  return true;
}

function withClientMetrics(items) {
  return items.map((item, index) => ({
    ...item,
    views: item.views ?? Math.max(80, (items.length - index) * 173 + (index % 4) * 41)
  }));
}

const savedClientState = readClientState();

// Application State
let state = {
  activeTab: 'sale', // 'sale' | 'wtb'
  categoryFilter: 'all', // 'all' | 'ai' | 'saas' | 'extension' | 'mobile'
  searchQuery: '',
  sortBy: 'newest',
  forSaleListings: withClientMetrics(initialForSaleListings.filter(item => !item.isAnonymous)),
  wtbListings: withClientMetrics(initialWtbListings.filter(item => !item.isAnonymous)),
  messages: [...initialMessages],
  activeThreadId: 'thread-1',
  theme: savedClientState.theme === 'light' ? 'light' : 'dark',
  lang: 'en',
  pricingTab: 'seller', // 'buyer' | 'seller'
  inboxOpen: false,
  buyerConnections: Number.isInteger(savedClientState.buyerConnections) && savedClientState.buyerConnections >= 0
    ? savedClientState.buyerConnections
    : 10,
  contactedProjects: Array.isArray(savedClientState.contactedProjects)
    ? savedClientState.contactedProjects.filter(item => typeof item === 'string').slice(0, 100)
    : [],
  sellerFreeListings: Number.isInteger(savedClientState.sellerFreeListings) && savedClientState.sellerFreeListings >= 0
    ? savedClientState.sellerFreeListings
    : 3,
  sellerListingCredits: Number.isInteger(savedClientState.sellerListingCredits) && savedClientState.sellerListingCredits >= 0
    ? savedClientState.sellerListingCredits
    : 0,
  sellerVipCredits: Number.isInteger(savedClientState.sellerVipCredits) && savedClientState.sellerVipCredits >= 0
    ? savedClientState.sellerVipCredits
    : 0,
  savedAlerts: Array.isArray(savedClientState.savedAlerts)
    ? savedClientState.savedAlerts.filter(alert => alert && typeof alert.id === 'string').slice(0, 10)
    : [],
  currentUser: null,
  backendReady: false,
  backendMessage: '',
  paymentMode: 'disabled',
  launchFree: true,
  launchLimits: { activeListings: 3, newConnections: 10, connectionWindowDays: 30 },
  socialAuth: { google: false },
  unreadMessageCount: 0,
  openListingSlug: ''
};

function persistClientState() {
  try {
    localStorage.setItem(CLIENT_STATE_KEY, JSON.stringify({
      theme: state.theme,
      buyerConnections: state.buyerConnections,
      contactedProjects: state.contactedProjects,
      sellerFreeListings: state.sellerFreeListings,
      sellerListingCredits: state.sellerListingCredits,
      sellerVipCredits: state.sellerVipCredits,
      savedAlerts: state.savedAlerts
    }));
  } catch {
    // The app remains usable when storage is unavailable.
  }
}

// Safe Dynamic DOM Element Getters (Never null!)
const el = {
  tabForSale: () => document.getElementById('tab-for-sale'),
  tabLookingToBuy: () => document.getElementById('tab-looking-to-buy'),
  forSaleCount: () => document.getElementById('for-sale-count'),
  wtbCount: () => document.getElementById('wtb-count'),
  categoryPills: () => document.getElementById('category-pills'),
  globalSearch: () => document.getElementById('global-search'),
  sortSelect: () => document.getElementById('sort-select'),
  listingsGridContainer: () => document.getElementById('listings-grid-container') || document.getElementById('listings-grid'),
  gridTitle: () => document.getElementById('grid-title'),
  gridSubtitle: () => document.getElementById('grid-subtitle'),
  modalBackdrop: () => document.getElementById('modal-backdrop'),
  modalContent: () => document.getElementById('modal-content'),
  inboxDrawer: () => document.getElementById('inbox-drawer'),
  inboxBtn: () => document.getElementById('inbox-btn'),
  createListingBtn: () => document.getElementById('create-listing-btn'),
  bannerActionBtn: () => document.getElementById('t-banner-action'),
  btnHeroSell: () => document.getElementById('btn-hero-sell'),
  featuredInspectBtn: () => document.getElementById('featured-inspect-btn'),
  themeToggleBtn: () => document.getElementById('theme-toggle-btn'),
  pricingToggleBuyer: () => document.getElementById('pricing-toggle-buyer'),
  pricingToggleSeller: () => document.getElementById('pricing-toggle-seller'),
  toastContainer: () => document.getElementById('toast-container'),
  hero3DCardTarget: () => document.getElementById('hero-3d-card-target')
};

// Get active translation dictionary
function t() {
  return translations.en;
}

// Initialize Application when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  queueMicrotask(startApp);
}

async function startApp() {
  initTheme();
  setupEventListeners();
  setup3DTiltEffect();
  setupStaticSurfaceMotion();
  updateStaticTranslations();
  renderListings();
  renderWeeklyPicks();
  initCookieConsent();
  await hydrateBackendState();
}

window.addEventListener('error', event => {
  if (!event.filename || new URL(event.filename, location.href).origin !== location.origin) return;
  trackBehavior('ui_error', { code: 'runtime_error', source: new URL(event.filename, location.href).pathname.split('/').pop() || 'app' });
});

window.addEventListener('unhandledrejection', () => trackBehavior('ui_error', { code: 'unhandled_request', source: 'app' }));

function initCookieConsent() {
  const banner = document.getElementById('cookie-consent-banner');
  const preference = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (preference === 'analytics') enableAnalyticsTracking();
  else if (!preference) banner?.classList.remove('hidden');
  document.getElementById('cookie-accept-btn')?.addEventListener('click', () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'analytics');
    banner?.classList.add('hidden');
    enableAnalyticsTracking();
    showToast(state.lang === 'en' ? 'Analytics cookies enabled.' : 'Analitik çerezleri etkinleştirildi.');
  });
  document.getElementById('cookie-essential-btn')?.addEventListener('click', () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'essential');
    banner?.classList.add('hidden');
    stopPresenceTracking();
    SearyaApi.revokeAnalytics().catch(() => {});
    showToast(state.lang === 'en' ? 'Only essential cookies will be used.' : 'Yalnızca zorunlu çerezler kullanılacak.');
  });
  document.getElementById('cookie-settings-btn')?.addEventListener('click', () => banner?.classList.remove('hidden'));
  document.getElementById('feedback-email-link')?.addEventListener('click', () => trackBehavior('button_clicked', { action: 'feedback_email' }));
}

async function enableAnalyticsTracking() {
  try {
    await SearyaApi.trackPageView(`${location.pathname}${location.search}`, document.referrer);
    startPresenceTracking();
    setupExitFeedback();
  } catch {
    // Analytics must never interrupt the marketplace experience.
  }
}

function analyticsDevice() {
  const width = Math.min(window.innerWidth || 0, screen.width || 0);
  return width < 640 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
}

function presencePayload(action) {
  return { sessionId: presenceSessionId, action, path: `${location.pathname}${location.search}`, device: analyticsDevice() };
}

function trackBehavior(eventName, metadata = {}) {
  if (!presenceSessionId || localStorage.getItem(COOKIE_CONSENT_KEY) !== 'analytics') return;
  SearyaApi.trackEvent(eventName, {
    sessionId: presenceSessionId,
    path: `${location.pathname}${location.search}`,
    device: analyticsDevice(),
    durationSeconds: behaviorSessionStartedAt ? Math.round((Date.now() - behaviorSessionStartedAt) / 1000) : 0,
    ...metadata
  }).catch(() => {});
}

function startBehaviorFlow(type, metadata = {}) {
  if (activeBehaviorFlow?.type === type) return;
  activeBehaviorFlow = { type, metadata, startedAt: Date.now() };
}

function completeBehaviorFlow(type) {
  if (activeBehaviorFlow?.type === type) activeBehaviorFlow = null;
}

function abandonBehaviorFlow(reason = 'closed') {
  if (!activeBehaviorFlow) return;
  const eventName = activeBehaviorFlow.type === 'auth' ? 'auth_abandoned' : activeBehaviorFlow.type === 'listing' ? 'listing_form_abandoned' : '';
  if (eventName) trackBehavior(eventName, { ...activeBehaviorFlow.metadata, reason });
  activeBehaviorFlow = null;
}

function startPresenceTracking() {
  if (!presenceSessionId) presenceSessionId = crypto.randomUUID();
  behaviorSessionStartedAt = Date.now();
  SearyaApi.trackPresence(presenceSessionId, 'enter', `${location.pathname}${location.search}`, analyticsDevice()).then(() => {
    trackBehavior('session_started', { source: document.referrer ? 'referral' : 'direct' });
  }).catch(() => {});
  if (!presenceTimer) {
    presenceTimer = window.setInterval(() => {
      if (!document.hidden) SearyaApi.trackPresence(presenceSessionId, 'heartbeat', `${location.pathname}${location.search}`, analyticsDevice()).catch(() => {});
    }, PRESENCE_HEARTBEAT_MS);
  }
}

function stopPresenceTracking() {
  if (presenceTimer) window.clearInterval(presenceTimer);
  presenceTimer = null;
  if (exitFeedbackTimer) window.clearTimeout(exitFeedbackTimer);
  exitFeedbackTimer = null;
  presenceSessionId = '';
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && presenceSessionId) SearyaApi.trackPresence(presenceSessionId, 'heartbeat', `${location.pathname}${location.search}`, analyticsDevice()).catch(() => {});
});

window.addEventListener('pagehide', event => {
  if (event.persisted || !presenceSessionId || localStorage.getItem(COOKIE_CONSENT_KEY) !== 'analytics') return;
  const body = new Blob([JSON.stringify(presencePayload('leave'))], { type: 'application/json' });
  navigator.sendBeacon('/api/analytics/presence', body);
  if (activeBehaviorFlow) {
    const eventName = activeBehaviorFlow.type === 'auth' ? 'auth_abandoned' : activeBehaviorFlow.type === 'listing' ? 'listing_form_abandoned' : '';
    if (eventName) navigator.sendBeacon('/api/analytics/event', new Blob([JSON.stringify({ eventName, metadata: { ...presencePayload('leave'), ...activeBehaviorFlow.metadata, reason: 'page_exit' } })], { type: 'application/json' }));
  }
});

function setupExitFeedback() {
  let previous = null;
  try { previous = JSON.parse(localStorage.getItem(EXIT_FEEDBACK_KEY) || 'null'); } catch { previous = null; }
  if (previous?.until && previous.until > Date.now()) return;
  const eligibleAt = Date.now() + 20_000;
  let triggered = false;
  const desktopExitIntent = event => {
    if (!triggered && event.clientY <= 0 && Date.now() >= eligibleAt) {
      triggered = true;
      showExitFeedback();
    }
  };
  document.addEventListener('mouseout', desktopExitIntent);
  exitFeedbackTimer = window.setTimeout(showExitFeedback, analyticsDevice() === 'mobile' ? 75_000 : 120_000);
}

function showExitFeedback() {
  if (document.getElementById('exit-feedback-card') || localStorage.getItem(COOKIE_CONSENT_KEY) !== 'analytics') return;
  const wrapper = document.createElement('aside');
  wrapper.id = 'exit-feedback-card';
  wrapper.className = 'fixed z-[90] bottom-4 left-4 right-4 sm:left-auto sm:w-[390px] rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-5 animate-fade-in';
  wrapper.setAttribute('aria-label', 'Exit feedback');
  wrapper.innerHTML = `
    <button type="button" id="exit-feedback-close" class="absolute right-4 top-4 text-slate-400 hover:text-slate-900 dark:hover:text-white" aria-label="Close"><i class="ph-bold ph-x"></i></button>
    <p class="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">One quick question</p>
    <h2 class="mt-1 pr-8 text-lg font-black text-slate-950 dark:text-white">What kept you from continuing today?</h2>
    <div class="mt-4 grid gap-2">
      ${[
        ['could_not_find_project', 'I could not find the right project'],
        ['trust_concerns', 'I need more trust or verification'],
        ['not_ready', 'I am only browsing for now'],
        ['something_broken', 'Something did not work'],
        ['need_more_information', 'I need more information'],
        ['other', 'Another reason']
      ].map(([value, label]) => `<button type="button" data-exit-reason="${value}" class="text-left rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors">${label}</button>`).join('')}
    </div>`;
  document.body.appendChild(wrapper);
  trackBehavior('exit_feedback_shown');
  wrapper.querySelectorAll('[data-exit-reason]').forEach(button => button.addEventListener('click', () => {
    trackBehavior('exit_feedback_submitted', { reason: button.dataset.exitReason });
    try { localStorage.setItem(EXIT_FEEDBACK_KEY, JSON.stringify({ until: Date.now() + 30 * 86400000 })); } catch { /* Optional storage. */ }
    wrapper.innerHTML = '<div class="py-5 text-center"><i class="ph-fill ph-check-circle text-3xl text-emerald-500"></i><p class="mt-2 font-black text-slate-900 dark:text-white">Thank you — this helps us improve Searya.</p></div>';
    window.setTimeout(() => wrapper.remove(), 1400);
  }));
  document.getElementById('exit-feedback-close')?.addEventListener('click', () => {
    trackBehavior('exit_feedback_dismissed');
    try { localStorage.setItem(EXIT_FEEDBACK_KEY, JSON.stringify({ until: Date.now() + 3 * 86400000 })); } catch { /* Optional storage. */ }
    wrapper.remove();
  });
}

function applyAuthenticatedUser(user) {
  state.currentUser = user || null;
  if (user) {
    state.buyerConnections = Number(user.buyerConnections || 0);
    state.sellerFreeListings = Number(user.sellerFreeListings || 0);
    state.sellerListingCredits = Number(user.sellerListingCredits || 0);
    state.sellerVipCredits = Number(user.sellerVipCredits || 0);
    state.boostCredits = Number(user.boostCredits || 0);
  } else {
    state.buyerConnections = state.launchFree ? Number(state.launchLimits?.newConnections || 10) : 0;
    state.sellerFreeListings = state.launchFree ? Number(state.launchLimits?.activeListings || 3) : 0;
    state.sellerListingCredits = 0;
    state.sellerVipCredits = 0;
    state.boostCredits = 0;
    state.unreadMessageCount = 0;
  }
  updateBuyerCreditBadge();
  updateUnreadMessageBadge();
  const navLabel = document.getElementById('t-nav-register');
  const navButton = document.getElementById('nav-register-btn');
  const navIcon = document.getElementById('nav-account-icon');
  const profileState = document.getElementById('nav-profile-state');
  if (navLabel) navLabel.textContent = user ? (state.lang === 'en' ? 'My account' : 'Profilim') : (state.lang === 'en' ? 'Sign Up' : 'Kayıt Ol');
  if (navIcon) navIcon.className = user ? 'ph-bold ph-user-circle text-base' : 'ph-bold ph-user-plus text-sm';
  profileState?.classList.toggle('hidden', !user);
  if (navButton) {
    const label = user ? (state.lang === 'en' ? 'My profile and listings' : 'Profilim ve ilanlarım') : (state.lang === 'en' ? 'Sign up' : 'Kayıt ol');
    navButton.setAttribute('aria-label', label);
    navButton.setAttribute('title', label);
    navButton.classList.toggle('bg-indigo-500/10', Boolean(user));
    navButton.classList.toggle('border-indigo-500/30', Boolean(user));
  }
}

async function hydrateBackendState() {
  try {
    const [health, session, salePayload, wtbPayload] = await Promise.all([
      SearyaApi.health(),
      SearyaApi.me(),
      SearyaApi.listings('sale'),
      SearyaApi.listings('wtb')
    ]);
    state.backendReady = Boolean(health?.ok);
    state.paymentMode = health?.paymentMode || 'disabled';
    state.launchFree = Boolean(health?.launchFree);
    state.launchLimits = health?.launchLimits || state.launchLimits;
    state.socialAuth = { google: Boolean(health?.socialAuth?.google) };
    state.backendMessage = '';
    updateServiceStatus();
    updatePaymentAvailability();
    updateSocialAuthAvailability();
    state.forSaleListings = withClientMetrics(salePayload?.listings || []);
    state.wtbListings = withClientMetrics(wtbPayload?.listings || []);
    updateFeaturedProjectSpotlight();
    applyAuthenticatedUser(session?.user || null);
    if (session?.user) {
      const [alertsPayload, unreadPayload] = await Promise.all([SearyaApi.alerts(), SearyaApi.unreadMessageCount()]);
      state.savedAlerts = (alertsPayload.alerts || []).map(alert => ({ ...alert, tech: alert.query || '' }));
      state.unreadMessageCount = Number(unreadPayload?.unreadCount || 0);
      updateUnreadMessageBadge();
      updateAlertControls();
    } else {
      state.unreadMessageCount = 0;
      updateUnreadMessageBadge();
    }
    renderListings();
    renderWeeklyPicks();
    await handleUrlState();
  } catch (error) {
    state.backendReady = false;
    state.backendMessage = error?.message || 'Could not connect to the service.';
    updateServiceStatus();
    console.error('Searya API:', error);
  }
}

function updateFeaturedProjectSpotlight() {
  const featured = state.forSaleListings[0];
  if (!featured) return;
  const title = featured.titleEn || featured.title;
  const description = featured.shortDescEn || featured.shortDesc || featured.descriptionEn || featured.description;
  const sellerName = featured.seller?.name || 'Project owner';
  const values = {
    't-featured-card-title': title,
    't-featured-card-category': description,
    't-featured-card-revval': `$${Number(featured.askingPrice || 0).toLocaleString('en-US')}`,
    't-featured-card-usersval': sellerName,
    't-featured-card-price-tag': featured.isVerified ? 'Verified' : 'Available'
  };
  Object.entries(values).forEach(([id, value]) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  });
}

function updateServiceStatus() {
  const banner = document.getElementById('service-status-banner');
  if (!banner) return;
  if (state.backendReady) {
    banner.classList.add('hidden');
    banner.textContent = '';
    return;
  }
  banner.textContent = state.lang === 'en'
    ? 'The service is temporarily unavailable. Listings may be out of date.'
    : 'The service is currently unavailable. Listings may not be up to date.';
  banner.classList.remove('hidden');
}

function updatePaymentAvailability() {
  const disabled = state.paymentMode === 'disabled' || state.launchFree;
  const labels = {
    'simple-buyer-pack-btn': state.lang === 'en' ? 'Payments coming soon' : 'Ödeme yakında',
    'simple-standard-btn': state.lang === 'en' ? 'Payments coming soon' : 'Ödeme yakında',
    'simple-verified-btn': state.lang === 'en' ? 'Payments coming soon' : 'Ödeme yakında'
  };
  Object.entries(labels).forEach(([id, label]) => {
    const button = document.getElementById(id);
    if (!button) return;
    button.dataset.paymentUnavailable = disabled ? 'true' : 'false';
    if (disabled) button.textContent = label;
  });
  const note = document.getElementById('t-simple-pricing-note');
  if (state.launchFree && note) note.textContent = state.lang === 'en' ? 'Free during launch · No card required · No sales commission' : 'Lansman döneminde ücretsiz · Kart gerekmez · Satış komisyonu yok';
  else if (disabled && note) note.textContent = state.lang === 'en' ? 'Payment infrastructure is being prepared · Free access remains available' : 'Ödeme altyapısı hazırlanıyor · Ücretsiz kullanım devam ediyor';
}

function updateSocialAuthAvailability() {
  const isEn = state.lang === 'en';
  document.querySelectorAll('.social-auth-btn').forEach(button => {
    const provider = button.dataset.provider;
    const configured = Boolean(state.socialAuth?.[provider]);
    const providerName = provider === 'google' ? 'Google' : 'Apple';
    const label = button.querySelector('[data-social-label]');
    if (label) label.textContent = configured
      ? (isEn ? `Continue with ${providerName}` : `${providerName} ile devam et`)
      : (isEn ? `${providerName} setup required` : `${providerName} kurulumu gerekli`);
    button.setAttribute('aria-disabled', String(!configured));
    button.classList.toggle('opacity-55', !configured);
    button.classList.toggle('cursor-not-allowed', !configured);
    button.classList.toggle('cursor-pointer', configured);
  });
  const status = document.getElementById('social-auth-status');
  if (status) {
    const anyConfigured = Boolean(state.socialAuth?.google);
    status.textContent = anyConfigured ? '' : (isEn ? 'Social sign-in becomes active after secure provider keys are added.' : 'Sosyal giriş, güvenli sağlayıcı anahtarları eklendiğinde otomatik açılır.');
    status.classList.toggle('hidden', anyConfigured);
  }
}

function requireAuthenticated() {
  if (state.currentUser) return true;
  showToast(state.lang === 'en' ? 'Please sign in to continue.' : 'Devam etmek için giriş yapmalısınız.');
  showOnboardingPage('login');
  return false;
}

function apiErrorMessage(error) {
  if (error instanceof ApiError) return error.message;
  return state.lang === 'en' ? 'The operation could not be completed.' : 'İşlem tamamlanamadı.';
}

async function handleUrlState() {
  const url = new URL(window.location.href);
  const categoryMatch = url.pathname.match(/^\/projects\/category\/([^/]+)\/?$/);
  const resetToken = url.searchParams.get('reset_token');
  const verifyToken = url.searchParams.get('verify_token');
  const payment = url.searchParams.get('payment');
  const createListing = url.searchParams.get('create') === 'listing';
  const oauth = url.searchParams.get('oauth');
  const oauthProvider = url.searchParams.get('provider');
  if (resetToken) return openResetPasswordModal(resetToken);
  if (verifyToken) {
    try {
      const result = await SearyaApi.verifyEmail(verifyToken);
      applyAuthenticatedUser(result.user);
      openVerificationResultModal(true);
    } catch (error) { openVerificationResultModal(false, apiErrorMessage(error)); }
    url.searchParams.delete('verify_token');
    history.replaceState({}, '', url);
  }
  if (payment === 'success') {
    showToast(state.lang === 'en' ? 'Payment received. Your credits are being confirmed.' : 'Ödeme alındı. Paket haklarınız doğrulanıyor.');
    url.searchParams.delete('payment');
    url.searchParams.delete('session_id');
    history.replaceState({}, '', url);
  } else if (payment === 'cancelled') {
    showToast(state.lang === 'en' ? 'Checkout was cancelled.' : 'Ödeme işlemi iptal edildi.');
    url.searchParams.delete('payment');
    history.replaceState({}, '', url);
  }
  if (oauth === 'success') {
    const providerName = 'Google';
    showToast(state.lang === 'en' ? `${providerName} sign-in successful.` : `${providerName} ile giriş başarılı.`);
    url.searchParams.delete('oauth');
    url.searchParams.delete('provider');
    history.replaceState({}, '', url);
    if (state.currentUser) await openAccountModal();
  } else if (oauth === 'error') {
    openSocialAuthErrorModal(url.searchParams.get('reason') || (state.lang === 'en' ? 'Social sign-in could not be completed.' : 'Sosyal giriş tamamlanamadı.'));
    url.searchParams.delete('oauth');
    url.searchParams.delete('provider');
    url.searchParams.delete('reason');
    history.replaceState({}, '', url);
  }
  if (categoryMatch) selectCategory(decodeURIComponent(categoryMatch[1]));
  await openListingFromUrl();
  if (createListing) openCreateListingModal();
}

function openSocialAuthErrorModal(message) {
  const isEn = state.lang === 'en';
  const content = el.modalContent();
  const backdrop = el.modalBackdrop();
  if (!content || !backdrop) return;
  content.innerHTML = `<div class="p-7 sm:p-10 text-center space-y-5"><div class="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><i class="ph-bold ph-warning-circle text-3xl"></i></div><div><h3 class="text-xl font-black text-slate-900 dark:text-white">${isEn ? 'Social sign-in unavailable' : 'Sosyal giriş kullanılamıyor'}</h3><p class="mt-2 text-sm leading-6 text-slate-500">${escapeHtml(message)}</p></div><button id="social-auth-error-login" class="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 text-white text-sm font-bold">${isEn ? 'Use email sign-in' : 'E-posta ile giriş yap'}</button></div>`;
  backdrop.classList.remove('hidden');
  document.getElementById('social-auth-error-login')?.addEventListener('click', () => showOnboardingPage('login'));
}

function openVerificationPendingModal(email) {
  const isEn = state.lang === 'en';
  const content = el.modalContent();
  const backdrop = el.modalBackdrop();
  if (!content || !backdrop) return;
  content.innerHTML = `
    <div class="p-6 sm:p-9 text-center space-y-6">
      <div class="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><i class="ph-bold ph-envelope-simple-open text-3xl"></i></div>
      <div><p class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">${isEn ? 'One last step' : 'Son bir adım'}</p><h3 class="mt-2 text-2xl font-black text-slate-900 dark:text-white">${isEn ? 'Verify your email' : 'Lütfen e-postanızı doğrulayın'}</h3><p class="mt-2 text-sm leading-6 text-slate-500">${isEn ? 'We sent a verification link to' : 'Doğrulama bağlantısını şu adrese gönderdik:'}<br><strong class="text-slate-800 dark:text-slate-200">${escapeHtml(email)}</strong></p></div>
      <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left text-xs text-slate-500"><i class="ph-bold ph-info text-indigo-500 mr-1"></i>${isEn ? 'Open the email and click the link. Check spam if it does not arrive within a few minutes.' : 'E-postayı açıp doğrulama bağlantısına tıklayın. Birkaç dakika içinde gelmezse spam klasörünü kontrol edin.'}</div>
      <p id="verification-pending-status" class="hidden rounded-xl px-3 py-2.5 text-xs font-bold"></p>
      <div class="grid sm:grid-cols-2 gap-3"><button id="verification-resend-btn" class="py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold">${isEn ? 'Send again' : 'Tekrar gönder'}</button><button id="verification-login-btn" class="py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 text-white text-sm font-bold">${isEn ? 'Go to sign in' : 'Giriş ekranına dön'}</button></div>
    </div>`;
  backdrop.classList.remove('hidden');
  document.getElementById('verification-login-btn')?.addEventListener('click', () => showOnboardingPage('login'));
  document.getElementById('verification-resend-btn')?.addEventListener('click', async event => {
    const status = document.getElementById('verification-pending-status');
    event.currentTarget.disabled = true;
    try {
      await SearyaApi.resendVerification(email);
      if (status) {
        status.textContent = isEn ? 'A new verification link was sent.' : 'Yeni doğrulama bağlantısı gönderildi.';
        status.className = 'rounded-xl px-3 py-2.5 text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300';
      }
    } catch (error) {
      if (status) {
        status.textContent = apiErrorMessage(error);
        status.className = 'rounded-xl px-3 py-2.5 text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300';
      }
    } finally { event.currentTarget.disabled = false; }
  });
}

function openVerificationResultModal(success, errorMessage = '') {
  const isEn = state.lang === 'en';
  const content = el.modalContent();
  const backdrop = el.modalBackdrop();
  if (!content || !backdrop) return;
  content.innerHTML = `
    <div class="p-7 sm:p-10 text-center space-y-6">
      <div class="w-20 h-20 mx-auto rounded-3xl ${success ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'} flex items-center justify-center"><i class="ph-bold ${success ? 'ph-check-circle' : 'ph-warning-circle'} text-4xl"></i></div>
      <div><h3 class="text-2xl font-black text-slate-900 dark:text-white">${success ? (isEn ? 'Verification successful' : 'Doğrulama başarılı') : (isEn ? 'Verification failed' : 'Doğrulama tamamlanamadı')}</h3><p class="mt-3 text-sm leading-6 text-slate-500">${success ? (isEn ? 'Your email is verified. You can now sign in and use your account.' : 'E-posta adresiniz doğrulandı. Artık giriş yapabilir ve hesabınızı kullanabilirsiniz.') : escapeHtml(errorMessage)}</p></div>
      <button id="verification-result-btn" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 text-white text-sm font-bold">${success ? (isEn ? 'Continue to my account' : 'Hesabıma devam et') : (isEn ? 'Back to sign in' : 'Giriş ekranına dön')}</button>
    </div>`;
  backdrop.classList.remove('hidden');
  document.getElementById('verification-result-btn')?.addEventListener('click', () => success ? openAccountModal() : showOnboardingPage('login'));
}

function openResetPasswordModal(token) {
  const isEn = state.lang === 'en';
  const backdrop = el.modalBackdrop();
  const content = el.modalContent();
  if (!backdrop || !content) return;
  content.innerHTML = `
    <form id="reset-password-form" class="p-6 sm:p-8 space-y-5">
      <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4"><div><h3 class="text-xl font-black text-slate-900 dark:text-white">${isEn ? 'Set a new password' : 'Yeni şifre belirleyin'}</h3><p class="text-xs text-slate-500 mt-1">${isEn ? 'Use at least 8 characters.' : 'En az 8 karakter kullanın.'}</p></div><button type="button" id="close-reset-modal" aria-label="Close" class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"><i class="ph-bold ph-x"></i></button></div>
      <input id="reset-password-input" type="password" minlength="8" required autocomplete="new-password" class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800" placeholder="${isEn ? 'New password' : 'Yeni şifre'}">
      <button type="submit" class="w-full py-3 rounded-xl bg-blue-600 text-white font-bold">${isEn ? 'Update password' : 'Şifreyi güncelle'}</button>
    </form>`;
  backdrop.classList.remove('hidden');
  const clearResetUrl = () => { const url = new URL(window.location.href); url.searchParams.delete('reset_token'); history.replaceState({}, '', url); };
  document.getElementById('close-reset-modal')?.addEventListener('click', () => { clearResetUrl(); closeModal(); });
  document.getElementById('reset-password-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      await SearyaApi.resetPassword(token, document.getElementById('reset-password-input')?.value || '');
      clearResetUrl();
      closeModal();
      showToast(isEn ? 'Password updated. You can now sign in.' : 'Şifreniz güncellendi. Şimdi giriş yapabilirsiniz.');
      showOnboardingPage('login');
    } catch (error) { showToast(apiErrorMessage(error)); }
  });
}

// Theme Setup (Seamless & Reliable Light/Dark mode switching)
function initTheme() {
  if (state.theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  persistClientState();
  initTheme();
  updateStaticTranslations();
  showToast(state.theme === 'dark' ? t().toastThemeDark : t().toastThemeLight);
}

function bindPointerTilt(surface, maxRotateX = 2.5, maxRotateY = 3.5) {
  if (!surface || surface.dataset.tiltBound === 'true') return;
  if (!window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  surface.dataset.tiltBound = 'true';
  surface.addEventListener('pointermove', (event) => {
    const bounds = surface.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    surface.style.transform = `perspective(950px) rotateX(${-y * maxRotateX}deg) rotateY(${x * maxRotateY}deg) translateY(-4px)`;
  });
  surface.addEventListener('pointerleave', () => {
    surface.style.transform = '';
  });
}

function setupStaticSurfaceMotion() {
  document.querySelectorAll('.pricing-plan-card').forEach((card) => bindPointerTilt(card, 1.8, 2.4));
}

// Hero Featured Card Click & Interactivity Handler
function setup3DTiltEffect() {
  const card = el.hero3DCardTarget();
  if (!card) return;

  bindPointerTilt(card, 3, 4.5);

  card.addEventListener('click', () => {
    const featured = state.forSaleListings[0];
    if (featured) openProjectDetailModal(featured);
  });
}

function updateStaticTranslations() {
  const dict = t();
  const isEn = true;
  document.documentElement.lang = 'en';
  const isSeoRoute = /^\/projects\/(?:category\/)?[^/]+\/?$/.test(window.location.pathname);
  if (!isSeoRoute) {
    document.title = 'Searya — Discover Digital Projects, SaaS, Apps & AI Tools';
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = 'Discover SaaS products, mobile apps, AI tools, websites and digital projects. List your project or connect directly with owners on Searya.';
  }
  
  // Navigation & Theme Toggle Bar
  const navListings = document.getElementById('t-nav-listings');
  const navWtb = document.getElementById('t-nav-wtb');
  const navPricing = document.getElementById('t-nav-pricing');
  const themeLightLabel = document.getElementById('t-theme-light-label');
  const themeDarkLabel = document.getElementById('t-theme-dark-label');

  if (navListings) navListings.textContent = dict.navListings;
  if (navWtb) navWtb.textContent = dict.navWtb;
  if (navPricing) navPricing.textContent = dict.navPricing;
  if (themeLightLabel) themeLightLabel.textContent = dict.themeLight;
  if (themeDarkLabel) themeDarkLabel.textContent = dict.themeDark;
  document.querySelectorAll('[data-home-link]').forEach(link => link.setAttribute('aria-label', 'Searya home page'));
  el.themeToggleBtn()?.setAttribute('aria-label', isEn ? 'Change theme' : 'Temayı değiştir');
  document.getElementById('ob-card-theme-btn')?.setAttribute('aria-label', isEn ? 'Change theme' : 'Temayı değiştir');
  document.getElementById('ob-close-btn')?.setAttribute('aria-label', isEn ? 'Close' : 'Kapat');

  // Search Input Placeholder
  const search = el.globalSearch();
  if (search) search.placeholder = dict.searchPlaceholder;

  // Banner & Hero
  const bNew = document.getElementById('t-banner-new');
  const bFeature = document.getElementById('t-banner-feature');
  const bText = document.getElementById('t-banner-text');
  const bAction = document.getElementById('t-banner-action');
  const vPill = document.getElementById('t-vision-pill');
  const hLine1 = document.getElementById('t-hero-line1');
  const hLine2 = document.getElementById('t-hero-line2');
  const hSub = document.getElementById('t-hero-subtitle');
  
  if (bNew) bNew.textContent = dict.bannerNew;
  if (bFeature) bFeature.textContent = isEn ? '"Looking to Buy"' : '"Looking to Buy" (Proje Arıyorum)';
  if (bText) bText.textContent = dict.bannerText;
  if (bAction) bAction.textContent = dict.bannerAction;
  if (vPill) vPill.textContent = dict.visionPill;
  if (hLine1) hLine1.textContent = dict.heroTitleLine1;
  if (hLine2) hLine2.textContent = dict.heroTitleLine2;
  if (hSub) hSub.textContent = dict.heroSubtitle;

  const sListings = document.getElementById('t-stat-listings');
  const sListingsVal = document.getElementById('t-stat-listings-value');
  const sDeals = document.getElementById('t-stat-deals');
  const sDealsVal = document.getElementById('t-stat-deals-value');
  const sResp = document.getElementById('t-stat-response');
  const sRespVal = document.getElementById('t-stat-response-val');
  const btnExp = document.getElementById('t-btn-explore');
  const btnSell = document.getElementById('t-btn-sell-project');
  const sellerLaunchNote = document.getElementById('t-seller-launch-note');

  if (sListings) sListings.textContent = dict.statListings;
  if (sListingsVal) sListingsVal.textContent = dict.statListingsVal;
  if (sDeals) sDeals.textContent = dict.statDeals;
  if (sDealsVal) sDealsVal.textContent = dict.statDealsVal;
  if (sResp) sResp.textContent = dict.statResponse;
  if (sRespVal) sRespVal.textContent = dict.statResponseVal;
  if (btnExp) btnExp.textContent = dict.btnExplore;
  if (btnSell) btnSell.textContent = dict.btnSellProject;
  if (sellerLaunchNote) sellerLaunchNote.textContent = dict.sellerLaunchNote;

  // Featured 3D Hero Card
  const fcBadge = document.getElementById('t-featured-card-badge');
  const fcTitle = document.getElementById('t-featured-card-title');
  const fcCat = document.getElementById('t-featured-card-category');
  const fcRev = document.getElementById('t-featured-card-revenue');
  const fcRevVal = document.getElementById('t-featured-card-revval');
  const fcUsers = document.getElementById('t-featured-card-users');
  const fcUsersVal = document.getElementById('t-featured-card-usersval');
  const fcBtn = document.getElementById('t-featured-card-btn');

  if (fcBadge) fcBadge.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>${dict.featuredCardBadge}`;
  if (fcTitle) fcTitle.textContent = dict.featuredCardTitle;
  if (fcCat) fcCat.textContent = dict.featuredCardCategory;
  if (fcRev) fcRev.textContent = dict.featuredCardRevenue;
  if (fcRevVal) fcRevVal.textContent = dict.featuredCardRevVal;
  if (fcUsers) fcUsers.textContent = dict.featuredCardUsers;
  if (fcUsersVal) fcUsersVal.textContent = dict.featuredCardUsersVal;
  if (fcBtn) fcBtn.textContent = dict.featuredCardBtn;
  const featuredTag = document.getElementById('t-featured-card-price-tag');
  if (featuredTag) featuredTag.textContent = 'Available';
  const previewTranslations = {
    't-preview-live': isEn ? 'Live' : 'Canlı',
    't-preview-overview': isEn ? 'Overview' : 'Genel bakış',
    't-preview-content': isEn ? 'Content' : 'İçerikler',
    't-preview-users': isEn ? 'Users' : 'Kullanıcılar',
    't-preview-visits': isEn ? 'Listing view' : 'İlan görünümü',
    't-preview-conversion': isEn ? 'Data status' : 'Veri durumu',
    't-preview-view-value': isEn ? 'Preview' : 'Önizleme',
    't-preview-data-value': 'Live',
    't-launch-chat-period': isEn ? 'during launch' : 'lansman boyunca'
  };
  Object.entries(previewTranslations).forEach(([id, value]) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  });
  document.getElementById('featured-preview')?.setAttribute('aria-label', 'AI Writer Pro product interface');

  // Pricing Main Section Titles
  const pMainTitle = document.getElementById('t-pricing-main-title');
  const pSub = document.getElementById('t-pricing-subtitle');
  const pBBtn = el.pricingToggleBuyer();
  const pSBtn = el.pricingToggleSeller();

  if (pMainTitle) pMainTitle.innerHTML = `${dict.pricingTitleLine1}<span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 dark:from-purple-400 dark:via-indigo-400 dark:to-emerald-400">${dict.pricingTitleHighlight}</span>${dict.pricingTitleLine2}`;
  if (pSub) pSub.textContent = dict.pricingSubtitle;
  if (pBBtn) pBBtn.textContent = dict.pricingToggleBuyer;
  if (pSBtn) pSBtn.textContent = dict.pricingToggleSeller;

  // Simplified three-option pricing
  const simplePricing = dict.simplePricing;
  if (simplePricing) {
    const setText = (id, value) => {
      const node = document.getElementById(id);
      if (node) node.textContent = value;
    };
    const setFeatureList = (id, features, colorClass) => {
      const node = document.getElementById(id);
      if (node) node.innerHTML = features.map(feature => `<li class="flex items-start gap-2"><i class="ph-bold ph-check-circle ${colorClass} mt-0.5 flex-shrink-0"></i><span>${feature}</span></li>`).join('');
    };

    setText('t-simple-pricing-kicker', simplePricing.kicker);
    setText('t-simple-pricing-title', simplePricing.title);
    setText('t-simple-pricing-subtitle', simplePricing.subtitle);
    setText('t-simple-buyer-tab', simplePricing.buyerTab);
    setText('t-simple-seller-tab', simplePricing.sellerTab);
    setText('t-simple-free-role', simplePricing.buyerRole);
    setText('t-simple-buyer-pack-role', simplePricing.buyerRole);
    setText('t-simple-seller-free-role', simplePricing.sellerRole);
    setText('t-simple-standard-role', simplePricing.sellerRole);
    setText('t-simple-verified-role', simplePricing.sellerRole);
    setText('t-simple-free-title', simplePricing.freeTitle);
    setText('t-simple-free-desc', simplePricing.freeDesc);
    setText('t-simple-free-period', simplePricing.freePeriod);
    setText('simple-buyer-btn', simplePricing.freeButton);
    setText('t-simple-buyer-pack-title', simplePricing.buyerPackTitle);
    setText('t-simple-buyer-pack-desc', simplePricing.buyerPackDesc);
    setText('t-simple-buyer-pack-period', simplePricing.buyerPackPeriod);
    setText('simple-buyer-pack-btn', simplePricing.buyerPackButton);
    setText('t-simple-seller-free-title', simplePricing.sellerFreeTitle);
    setText('t-simple-seller-free-desc', simplePricing.sellerFreeDesc);
    setText('t-simple-seller-free-period', simplePricing.sellerFreePeriod);
    setText('simple-seller-free-btn', simplePricing.sellerFreeButton);
    setText('t-simple-standard-title', simplePricing.standardTitle);
    setText('t-simple-standard-desc', simplePricing.standardDesc);
    setText('t-simple-standard-period', simplePricing.standardPeriod);
    setText('simple-standard-btn', simplePricing.standardButton);
    setText('t-simple-verified-badge', simplePricing.verifiedBadge);
    setText('t-simple-verified-title', simplePricing.verifiedTitle);
    setText('t-simple-verified-desc', simplePricing.verifiedDesc);
    setText('t-simple-verified-period', simplePricing.verifiedPeriod);
    setText('simple-verified-btn', simplePricing.verifiedButton);
    setText('t-simple-verification-note', simplePricing.verificationNote);
    setText('t-simple-pricing-note', simplePricing.note);
    setText('t-launch-chat-title', simplePricing.chatTitle);
    setText('t-launch-chat-desc', simplePricing.chatDesc);
    setText('launch-explore-btn', simplePricing.exploreButton);
    setFeatureList('t-simple-free-list', simplePricing.freeFeatures, 'text-emerald-500');
    setFeatureList('t-simple-buyer-pack-list', simplePricing.buyerPackFeatures, 'text-emerald-500');
    setFeatureList('t-simple-seller-free-list', simplePricing.sellerFreeFeatures, 'text-purple-500');
    setFeatureList('t-simple-standard-list', simplePricing.standardFeatures, 'text-purple-500');
    setFeatureList('t-simple-verified-list', simplePricing.verifiedFeatures, 'text-emerald-400');
    setFeatureList('t-launch-chat-list', simplePricing.chatFeatures, 'text-indigo-500');
  }
  updateBuyerCreditBadge();
  updateUnreadMessageBadge();
  updatePaymentAvailability();
  updateAlertControls();
  renderWeeklyPicks();

  // Buyer Section Headers & Cards
  const bSecT = document.getElementById('t-buyer-sec-title');
  const bSecSub = document.getElementById('t-buyer-sec-subtitle');
  if (bSecT) bSecT.textContent = dict.buyerSectionTitle;
  if (bSecSub) bSecSub.textContent = dict.buyerSectionSubtitle;

  const bFTitle = document.getElementById('t-buyer-free-title');
  const bFDesc = document.getElementById('t-buyer-free-desc');
  const bFConn = document.getElementById('t-buyer-free-conn');
  const bFSub = document.getElementById('t-buyer-free-sub');
  const bFBtn = document.getElementById('t-buyer-free-btn');
  const bFList = document.getElementById('t-buyer-free-list');

  if (bFTitle) bFTitle.textContent = dict.buyerFreeTitle;
  if (bFDesc) bFDesc.textContent = dict.buyerFreeDesc;
  if (bFConn) bFConn.textContent = dict.buyerFreeConnections;
  if (bFSub) bFSub.textContent = dict.buyerFreeSub;
  if (bFBtn) bFBtn.textContent = dict.buyerFreeBtn;
  if (bFList) bFList.innerHTML = dict.buyerFreeFeatures.map(f => `<li class="flex items-start gap-2"><i class="ph-bold ph-check text-emerald-500 text-sm flex-shrink-0 mt-0.5"></i> <span>${f}</span></li>`).join('');

  const bPBadge = document.getElementById('t-buyer-pack-badge');
  const bPTitle = document.getElementById('t-buyer-pack-title');
  const bPDesc = document.getElementById('t-buyer-pack-desc');
  const bPPrice = document.getElementById('t-buyer-pack-price');
  const bPConn = document.getElementById('t-buyer-pack-conn');
  const bPSub = document.getElementById('t-buyer-pack-sub');
  const bPBtn = document.getElementById('t-buyer-pack-btn');
  const bPList = document.getElementById('t-buyer-pack-list');

  if (bPBadge) bPBadge.innerHTML = `🔥 ${dict.buyerPackBadge}`;
  if (bPTitle) bPTitle.textContent = dict.buyerPackTitle;
  if (bPDesc) bPDesc.textContent = dict.buyerPackDesc;
  if (bPPrice) bPPrice.textContent = dict.buyerPackPrice;
  if (bPConn) bPConn.textContent = dict.buyerPackConn;
  if (bPSub) bPSub.textContent = dict.buyerPackSub;
  if (bPBtn) bPBtn.textContent = dict.buyerPackBtn;
  if (bPList) bPList.innerHTML = dict.buyerPackFeatures.map(f => `<li class="flex items-start gap-2"><i class="ph-bold ph-check text-emerald-500 text-sm flex-shrink-0 mt-0.5"></i> <span>${f}</span></li>`).join('');

  // Seller Section Headers & Cards
  const sSecT = document.getElementById('t-seller-sec-title');
  const sSecSub = document.getElementById('t-seller-sec-subtitle');
  if (sSecT) sSecT.textContent = dict.sellerSectionTitle;
  if (sSecSub) sSecSub.textContent = dict.sellerSectionSubtitle;

  const sFTitle = document.getElementById('t-seller-free-title');
  const sFDesc = document.getElementById('t-seller-free-desc');
  const sFCount = document.getElementById('t-seller-free-count');
  const sFSub = document.getElementById('t-seller-free-sub');
  const sFBtn = document.getElementById('t-seller-free-btn');
  const sFList = document.getElementById('t-seller-free-list');

  if (sFTitle) sFTitle.textContent = dict.sellerFreeTitle;
  if (sFDesc) sFDesc.textContent = dict.sellerFreeDesc;
  if (sFCount) sFCount.textContent = dict.sellerFreeCount;
  if (sFSub) sFSub.textContent = dict.sellerFreeSub;
  if (sFBtn) sFBtn.textContent = dict.sellerFreeBtn;
  if (sFList) sFList.innerHTML = dict.sellerFreeFeatures.map(f => `<li class="flex items-start gap-1.5"><i class="ph-bold ph-check text-purple-500 text-xs flex-shrink-0 mt-0.5"></i> <span>${f}</span></li>`).join('');

  const sETitle = document.getElementById('t-seller-extra-title');
  const sEDesc = document.getElementById('t-seller-extra-desc');
  const sEPrice = document.getElementById('t-seller-extra-price');
  const sEUnit = document.getElementById('t-seller-extra-unit');
  const sESub = document.getElementById('t-seller-extra-sub');
  const sEBtn = document.getElementById('t-seller-extra-btn');
  const sEList = document.getElementById('t-seller-extra-list');

  if (sETitle) sETitle.textContent = dict.sellerExtraTitle;
  if (sEDesc) sEDesc.textContent = dict.sellerExtraDesc;
  if (sEPrice) sEPrice.textContent = dict.sellerExtraPrice;
  if (sEUnit) sEUnit.textContent = dict.sellerExtraPriceUnit;
  if (sESub) sESub.textContent = dict.sellerExtraSub;
  if (sEBtn) sEBtn.textContent = dict.sellerExtraBtn;
  if (sEList) sEList.innerHTML = dict.sellerExtraFeatures.map(f => `<li class="flex items-start gap-1.5"><i class="ph-bold ph-check text-purple-500 text-xs flex-shrink-0 mt-0.5"></i> <span>${f}</span></li>`).join('');

  const sFeatTitle = document.getElementById('t-seller-feat-title');
  const sFeatDesc = document.getElementById('t-seller-feat-desc');
  const sFeatPrice = document.getElementById('t-seller-feat-price');
  const sFeatUnit = document.getElementById('t-seller-feat-unit');
  const sFeatSub = document.getElementById('t-seller-feat-sub');
  const sFeatBtn = document.getElementById('t-seller-feat-btn');
  const sFeatList = document.getElementById('t-seller-feat-list');

  if (sFeatTitle) sFeatTitle.textContent = dict.sellerFeaturedTitle;
  if (sFeatDesc) sFeatDesc.textContent = dict.sellerFeaturedDesc;
  if (sFeatPrice) sFeatPrice.textContent = dict.sellerFeaturedPrice;
  if (sFeatUnit) sFeatUnit.textContent = dict.sellerFeaturedPriceUnit;
  if (sFeatSub) sFeatSub.textContent = dict.sellerFeaturedSub;
  if (sFeatBtn) sFeatBtn.textContent = dict.sellerFeaturedBtn;
  if (sFeatList) sFeatList.innerHTML = dict.sellerFeaturedFeatures.map(f => `<li class="flex items-start gap-1.5"><i class="ph-bold ph-check text-purple-500 text-xs flex-shrink-0 mt-0.5"></i> <span>${f}</span></li>`).join('');

  const sProBadge = document.getElementById('t-seller-pro-badge');
  const sProTitle = document.getElementById('t-seller-pro-title');
  const sProDesc = document.getElementById('t-seller-pro-desc');
  const sProPrice = document.getElementById('t-seller-pro-price');
  const sProUnit = document.getElementById('t-seller-pro-unit');
  const sProSub = document.getElementById('t-seller-pro-sub');
  const sProBtn = document.getElementById('t-seller-pro-btn');
  const sProList = document.getElementById('t-seller-pro-list');

  if (sProBadge) sProBadge.innerHTML = `👑 ${dict.sellerProBadge}`;
  if (sProTitle) sProTitle.textContent = dict.sellerProTitle;
  if (sProDesc) sProDesc.textContent = dict.sellerProDesc;
  if (sProPrice) sProPrice.textContent = dict.sellerProPrice;
  if (sProUnit) sProUnit.textContent = dict.sellerProPriceUnit;
  if (sProSub) sProSub.textContent = dict.sellerProSub;
  if (sProBtn) sProBtn.textContent = dict.sellerProBtn;
  if (sProList) sProList.innerHTML = dict.sellerProFeatures.map(f => `<li class="flex items-start gap-1.5"><i class="ph-bold ph-sparkle text-purple-300 text-xs flex-shrink-0 mt-0.5"></i> <span>${f}</span></li>`).join('');

  // Trust Features Banner
  const trTitleSm = document.getElementById('t-trust-title-sm');
  const trSubSm = document.getElementById('t-trust-sub-sm');
  const trLMBtn = document.getElementById('t-trust-learn-btn');
  if (trTitleSm) trTitleSm.textContent = dict.trustTitle;
  if (trSubSm) trSubSm.textContent = dict.trustSubtitle.split('.')[0] + '.';
  if (trLMBtn) trLMBtn.textContent = dict.trustLearnMore;

  const trF1T = document.getElementById('t-trust-f1-title');
  const trF1D = document.getElementById('t-trust-f1-desc');
  const trF2T = document.getElementById('t-trust-f2-title');
  const trF2D = document.getElementById('t-trust-f2-desc');
  const trF3T = document.getElementById('t-trust-f3-title');
  const trF3D = document.getElementById('t-trust-f3-desc');
  const trF4T = document.getElementById('t-trust-f4-title');
  const trF4D = document.getElementById('t-trust-f4-desc');

  if (trF1T) trF1T.textContent = dict.trustFeature1Title;
  if (trF1D) trF1D.textContent = dict.trustFeature1Desc;
  if (trF2T) trF2T.textContent = dict.trustFeature2Title;
  if (trF2D) trF2D.textContent = dict.trustFeature2Desc;
  if (trF3T) trF3T.textContent = dict.trustFeature3Title;
  if (trF3D) trF3D.textContent = dict.trustFeature3Desc;
  if (trF4T) trF4T.textContent = dict.trustFeature4Title;
  if (trF4D) trF4D.textContent = dict.trustFeature4Desc;

  // Tabs & Filters
  const tSale = document.getElementById('t-tab-sale');
  const tWtb = document.getElementById('t-tab-wtb');
  const fLabel = document.getElementById('t-filter-label');
  const cAll = document.getElementById('t-cat-all');
  const cAi = document.getElementById('t-cat-ai');
  const cSaas = document.getElementById('t-cat-saas');
  const cExt = document.getElementById('t-cat-extension');
  const cMob = document.getElementById('t-cat-mobile');

  if (tSale) tSale.textContent = dict.tabForSale;
  if (tWtb) tWtb.textContent = dict.tabWtb;
  if (fLabel) fLabel.textContent = dict.filterLabel;
  if (cAll) cAll.textContent = dict.catAll;
  if (cAi) cAi.innerHTML = `<i class="ph-bold ph-brain text-purple-500 mr-1"></i>${dict.catAi}`;
  if (cSaas) cSaas.innerHTML = `<i class="ph-bold ph-lightning text-amber-500 mr-1"></i>${dict.catSaas}`;
  if (cExt) cExt.innerHTML = `<i class="ph-bold ph-browsers text-blue-500 mr-1"></i>${dict.catExtension}`;
  if (cMob) cMob.innerHTML = `<i class="ph-bold ph-device-mobile text-emerald-500 mr-1"></i>${dict.catMobile}`;

  // Buttons & Controls
  const btnCreate = document.getElementById('t-btn-create-listing');
  const sLabel = document.getElementById('t-sort-label');
  const sNew = document.getElementById('t-sort-newest');
  const sLow = document.getElementById('t-sort-low');
  const sHigh = document.getElementById('t-sort-high');
  const sPop = document.getElementById('t-sort-popular');

  if (btnCreate) btnCreate.textContent = dict.btnCreateListing;
  el.createListingBtn()?.setAttribute('aria-label', dict.btnCreateListing);
  if (sLabel) sLabel.textContent = dict.sortLabel;
  if (sNew) sNew.textContent = dict.sortNewest;
  if (sLow) sLow.textContent = dict.sortPriceLow;
  if (sHigh) sHigh.textContent = dict.sortPriceHigh;
  if (sPop) sPop.textContent = dict.sortPopular;
  const gridTitle = el.gridTitle();
  const gridSubtitle = el.gridSubtitle();
  if (gridTitle) gridTitle.textContent = state.activeTab === 'wtb' ? dict.gridTitleWtb : dict.gridTitleSale;
  if (gridSubtitle) gridSubtitle.textContent = state.activeTab === 'wtb' ? dict.gridSubtitleWtb : dict.gridSubtitleSale;

  // Footer Titles & Links
  const fColMarket = document.getElementById('t-footer-col-marketplace');
  const fLinkSale = document.getElementById('t-footer-link-forsale');
  const fLinkWtb = document.getElementById('t-footer-link-wtb');
  const fColTrust = document.getElementById('t-footer-col-trust');
  const fLinkEscrow = document.getElementById('t-footer-link-escrow');
  const fLinkChecklist = document.getElementById('t-footer-link-checklist');
  const fLinkContract = document.getElementById('t-footer-link-contract');
  const fColSocial = document.getElementById('t-footer-col-social');
  const fCommunitySoon = document.getElementById('t-footer-community-soon');
  const fTagline = document.getElementById('t-footer-tagline');
  const fRights = document.getElementById('t-footer-rights');

  if (fColMarket) fColMarket.textContent = dict.footerColMarketplace;
  if (fLinkSale) fLinkSale.textContent = dict.footerLinkForSale;
  if (fLinkWtb) fLinkWtb.textContent = dict.footerLinkWtb;
  if (fColTrust) fColTrust.textContent = dict.footerColTrust;
  if (fLinkEscrow) fLinkEscrow.textContent = dict.footerLinkEscrow;
  if (fLinkChecklist) fLinkChecklist.textContent = dict.footerLinkChecklist;
  if (fLinkContract) fLinkContract.textContent = dict.footerLinkContract;
  const privacyLink = document.getElementById('footer-privacy-link');
  const termsLink = document.getElementById('footer-terms-link');
  const cookiesLink = document.getElementById('footer-cookies-link');
  if (privacyLink) privacyLink.textContent = state.lang === 'en' ? 'Privacy Policy' : 'Gizlilik Politikası';
  if (termsLink) termsLink.textContent = state.lang === 'en' ? 'Terms of Use' : 'Kullanım Şartları';
  if (cookiesLink) cookiesLink.textContent = isEn ? 'Cookies' : 'Çerezler';
  if (fColSocial) fColSocial.textContent = dict.footerColSocial;
  if (fCommunitySoon) fCommunitySoon.textContent = dict.footerCommunitySoon;
  if (fTagline) fTagline.textContent = dict.footerTagline;
  if (fRights) fRights.textContent = dict.footerRights;
  const cookieTextMap = { 'cookie-settings-btn': 'cookiePreferences', 'cookie-consent-title': 'cookieTitle', 'cookie-consent-text': 'cookieText', 'cookie-details-link': 'cookieDetails', 'cookie-essential-btn': 'cookieEssential', 'cookie-accept-btn': 'cookieAccept' };
  Object.entries(cookieTextMap).forEach(([id, key]) => { const node = document.getElementById(id); if (node) node.textContent = dict[key]; });
  document.getElementById('cookie-consent-banner')?.setAttribute('aria-label', isEn ? 'Cookie preferences' : 'Çerez tercihleri');

  // Onboarding Full-Screen Page Static Translations
  const obVision = document.getElementById('t-ob-vision-pill');
  const obLine1 = document.getElementById('t-ob-hero-line1');
  const obLine2 = document.getElementById('t-ob-hero-line2');
  const obSub = document.getElementById('t-ob-hero-sub');
  const obStat1 = document.getElementById('t-ob-stat1');
  const obStat2 = document.getElementById('t-ob-stat2');
  const obStat3 = document.getElementById('t-ob-stat3');
  const obQuote = document.getElementById('t-ob-quote');
  const obQuoteAuth = document.getElementById('t-ob-quote-author');
  const obSkipBtn = document.getElementById('t-ob-skip-btn');
  const obTL = document.getElementById('t-ob-theme-light-label');
  const obTD = document.getElementById('t-ob-theme-dark-label');

  if (obVision) obVision.textContent = dict.visionPill;
  if (obLine1) obLine1.textContent = dict.obHeroLine1;
  if (obLine2) obLine2.textContent = dict.obHeroLine2;
  if (obSub) obSub.textContent = dict.obHeroSub;
  if (obStat1) obStat1.textContent = dict.obStat1;
  if (obStat2) obStat2.textContent = dict.obStat2;
  if (obStat3) obStat3.textContent = dict.obStat3;
  if (obQuote) obQuote.textContent = dict.obQuote;
  if (obQuoteAuth) obQuoteAuth.textContent = dict.obQuoteAuthor;
  if (obSkipBtn) obSkipBtn.textContent = dict.obSkipBtn;
  if (obTL) obTL.textContent = dict.themeLight;
  if (obTD) obTD.textContent = dict.themeDark;

  applyAuthenticatedUser(state.currentUser);

  // Render auth card in current language
  renderAuthCard();
}

// Event Listeners
function setupEventListeners() {
  const tBtn = el.themeToggleBtn();
  const obTBtn = document.getElementById('ob-theme-toggle-btn');
  const cardTBtn = document.getElementById('ob-card-theme-btn');

  if (tBtn) tBtn.addEventListener('click', toggleTheme);
  if (obTBtn) obTBtn.addEventListener('click', toggleTheme);
  if (cardTBtn) cardTBtn.addEventListener('click', toggleTheme);
  
  // Auth Card Segmented Tabs (Giriş Yap vs Kayıt Ol)
  document.getElementById('ob-tab-login')?.addEventListener('click', () => {
    authMode = 'login';
    renderAuthCard();
  });
  document.getElementById('ob-tab-register')?.addEventListener('click', () => {
    authMode = 'register';
    renderAuthCard();
  });

  // Navbar Links
  document.getElementById('t-nav-pricing')?.addEventListener('click', (e) => {
    e.preventDefault();
    const pSection = document.getElementById('pricing-section');
    if (pSection) {
      pSection.classList.remove('hidden');
      pSection.scrollIntoView({ behavior: 'smooth' });
    }
  });

  document.getElementById('t-nav-listings')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('sale');
    document.getElementById('listings-grid')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('t-nav-wtb')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('wtb');
    document.getElementById('listings-grid')?.scrollIntoView({ behavior: 'smooth' });
  });

  const tabSale = el.tabForSale();
  const tabWtb = el.tabLookingToBuy();
  if (tabSale) tabSale.addEventListener('click', () => switchTab('sale'));
  if (tabWtb) tabWtb.addEventListener('click', () => switchTab('wtb'));

  const search = el.globalSearch();
  if (search) {
    search.addEventListener('input', (e) => {
      state.searchQuery = normalizeSearch(e.target.value).trim();
      renderListings();
      window.clearTimeout(behaviorSearchTimer);
      behaviorSearchTimer = window.setTimeout(() => {
        if (state.searchQuery.length >= 2) trackBehavior('search_performed', { query: state.searchQuery, resultCount: document.querySelectorAll('.project-card').length, tab: state.activeTab });
      }, 700);
    });
  }

  const sort = el.sortSelect();
  if (sort) {
    sort.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderListings();
      trackBehavior('sort_changed', { sort: state.sortBy, tab: state.activeTab });
    });
  }

  document.getElementById('save-search-btn')?.addEventListener('click', () => openProjectAlertModal({ useCurrentSearch: true }));
  document.getElementById('project-alerts-btn')?.addEventListener('click', () => openProjectAlertModal());
  document.getElementById('weekly-alert-btn')?.addEventListener('click', () => openProjectAlertModal({ frequency: 'weekly' }));

  const catPills = el.categoryPills();
  if (catPills) {
    catPills.addEventListener('click', (e) => {
      const chip = e.target.closest('.cat-chip');
      if (!chip) return;
      e.preventDefault();
      selectCategory(chip.dataset.category);
    });
  }

  const backdrop = el.modalBackdrop();
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
  }

  const createBtn = el.createListingBtn();
  const bannerBtn = el.bannerActionBtn();
  const heroSellBtn = el.btnHeroSell();
  const featInspectBtn = el.featuredInspectBtn();
  const inboxTrigger = el.inboxBtn();

  if (createBtn) createBtn.addEventListener('click', openCreateListingModal);
  if (bannerBtn) bannerBtn.addEventListener('click', openCreateListingModal);
  if (heroSellBtn) heroSellBtn.addEventListener('click', openCreateListingModal);
  if (featInspectBtn) {
    featInspectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const featured = state.forSaleListings[0];
      if (featured) openProjectDetailModal(featured);
    });
  }

  if (inboxTrigger) inboxTrigger.addEventListener('click', toggleInboxDrawer);

  const navRegister = document.getElementById('nav-register-btn');
  if (navRegister) navRegister.addEventListener('click', () => state.currentUser ? openAccountModal() : showOnboardingPage('register'));

  const skipBtn = document.getElementById('skip-to-marketplace-btn');
  if (skipBtn) skipBtn.addEventListener('click', () => showMainAppPage(true));

  const onboardingView = document.getElementById('onboarding-fullview');
  document.getElementById('ob-close-btn')?.addEventListener('click', () => showMainAppPage(false));
  onboardingView?.addEventListener('click', (e) => {
    if (e.target === onboardingView) showMainAppPage(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && onboardingView && !onboardingView.classList.contains('hidden')) {
      showMainAppPage(false);
    } else if (e.key === 'Escape' && !el.modalBackdrop()?.classList.contains('hidden')) {
      closeModal();
    } else if (e.key === 'Escape' && state.inboxOpen) {
      toggleInboxDrawer();
    }
  });

  document.querySelector('#onboarding-fullview .brand-logo-group')?.addEventListener('click', (e) => {
    e.preventDefault();
    showMainAppPage(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const brandLogo = document.getElementById('main-brand-logo');
  if (brandLogo) {
    brandLogo.addEventListener('click', (e) => {
      e.preventDefault();
      showMainAppPage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Pricing View Mode Toggle Buttons (Alıcı / Satıcı / Tüm Paketler)
  const pBBtn = el.pricingToggleBuyer();
  const pSBtn = el.pricingToggleSeller();
  const pABtn = document.getElementById('pricing-toggle-all');

  if (pBBtn) pBBtn.addEventListener('click', () => switchPricingView('buyer'));
  if (pSBtn) pSBtn.addEventListener('click', () => switchPricingView('seller'));
  if (pABtn) pABtn.addEventListener('click', () => switchPricingView('all'));

  // Package Purchase Buttons (Alıcı & Satıcı Paket Butonları)
  document.getElementById('t-buyer-free-btn')?.addEventListener('click', () => showOnboardingPage('register'));
  document.getElementById('t-buyer-pack-btn')?.addEventListener('click', () => openPackagePurchaseModal('10 Buyer Connections', '$9', 'buyer_connections_10'));
  document.getElementById('t-seller-free-btn')?.addEventListener('click', openCreateListingModal);
  document.getElementById('t-seller-extra-btn')?.addEventListener('click', () => openPackagePurchaseModal('3 Seller Listings', '$9', 'seller_listings_3'));
  document.getElementById('t-seller-feat-btn')?.addEventListener('click', () => openPackagePurchaseModal('VIP Verification Review + 10 Listings', '$19.99', 'seller_vip_10'));
  document.getElementById('t-seller-pro-btn')?.addEventListener('click', () => openPackagePurchaseModal('VIP Verification Review + 10 Listings', '$19.99', 'seller_vip_10'));

  // Simplified pricing actions
  document.getElementById('simple-buyer-btn')?.addEventListener('click', () => showOnboardingPage('register'));
  document.getElementById('simple-buyer-pack-btn')?.addEventListener('click', openBuyerConnectionPack);
  document.getElementById('simple-seller-free-btn')?.addEventListener('click', openCreateListingModal);
  document.getElementById('launch-explore-btn')?.addEventListener('click', () => {
    switchTab('sale');
    document.getElementById('listings-grid')?.scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('simple-standard-btn')?.addEventListener('click', () => openPackagePurchaseModal(state.lang === 'en' ? '3 Listing Pack' : '3 İlan Paketi', '$9', 'seller_listings_3'));
  document.getElementById('simple-verified-btn')?.addEventListener('click', () => openPackagePurchaseModal(state.lang === 'en' ? 'Seller Pro Launch Pack' : 'Satıcı Pro Lansman Paketi', '$19.99', 'seller_vip_10'));
  document.getElementById('simple-pricing-buyer-tab')?.addEventListener('click', () => switchSimplePricingAudience('buyer'));
  document.getElementById('simple-pricing-seller-tab')?.addEventListener('click', () => switchSimplePricingAudience('seller'));

  const guideLinks = {
    't-footer-link-escrow': 'escrow',
    't-footer-link-contract': 'contract'
  };
  Object.entries(guideLinks).forEach(([id, guide]) => {
    document.getElementById(id)?.addEventListener('click', (e) => {
      e.preventDefault();
      openGuideModal(guide);
    });
  });

  document.getElementById('t-footer-link-forsale')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('sale');
    document.getElementById('listings-grid')?.scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('t-footer-link-wtb')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('wtb');
    document.getElementById('listings-grid')?.scrollIntoView({ behavior: 'smooth' });
  });
}

async function openAccountModal(options = {}) {
  if (!requireAuthenticated()) return;
  const isEn = state.lang === 'en';
  const user = state.currentUser;
  const backdrop = el.modalBackdrop();
  const content = el.modalContent();
  if (!backdrop || !content) return;
  content.innerHTML = `<div class="p-10 text-center text-slate-500"><i class="ph-bold ph-circle-notch animate-spin text-2xl text-blue-500"></i><p class="mt-3 text-xs">${isEn ? 'Loading your account…' : 'Hesabınız yükleniyor…'}</p></div>`;
  backdrop.classList.remove('hidden');
  let listings = [];
  try { listings = (await SearyaApi.myListings()).listings || []; }
  catch (error) { showToast(apiErrorMessage(error)); }
  const statusLabel = value => ({ pending: 'Pending review', rejected: 'Rejected', Active: 'Active', Verified: 'Verified', Aktif: 'Active', Doğrulanmış: 'Verified' }[value] || value);
  const accountUsageCards = state.launchFree ? `
    <div class="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20"><strong class="block text-xl text-emerald-600">${user.buyerConnections}</strong><span class="text-[10px] text-slate-500">${isEn ? 'New connections left / 30 days' : '30 günlük yeni bağlantı hakkı'}</span></div>
    <div class="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/20"><strong class="block text-xl text-purple-600">${user.sellerFreeListings}</strong><span class="text-[10px] text-slate-500">${isEn ? 'Active listing slots left' : 'Kalan aktif ilan alanı'}</span></div>
  ` : `
    <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><strong class="block text-xl text-blue-600">${user.buyerConnections}</strong><span class="text-[10px] text-slate-500">${isEn ? 'Connections' : 'Bağlantı'}</span></div>
    <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><strong class="block text-xl text-blue-600">${user.sellerFreeListings + user.sellerListingCredits}</strong><span class="text-[10px] text-slate-500">${isEn ? 'Listing credits' : 'İlan hakkı'}</span></div>
    <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><strong class="block text-xl text-purple-500">${user.sellerVipCredits}</strong><span class="text-[10px] text-slate-500">${isEn ? 'Verification' : 'Doğrulama'}</span></div>
    <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><strong class="block text-xl text-amber-500">${user.boostCredits || 0}</strong><span class="text-[10px] text-slate-500">${isEn ? 'Boost' : 'Öne çıkarma'}</span></div>
  `;
  content.innerHTML = `
    <div class="p-5 sm:p-8 space-y-6 overflow-y-auto">
      <div class="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-lg font-black">${escapeHtml(user.name?.charAt(0) || 'S')}</div>
          <div><h3 class="text-xl font-black text-slate-900 dark:text-white">${escapeHtml(user.name)}</h3><p class="text-xs text-slate-500">${escapeHtml(user.email || '')}</p></div>
        </div>
        <button id="close-account-modal" aria-label="${isEn ? 'Close' : 'Kapat'}" class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center"><i class="ph-bold ph-x"></i></button>
      </div>
      ${options.notice ? `<div class="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 flex items-start gap-3"><span class="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0"><i class="ph-bold ph-check"></i></span><div><strong class="text-sm text-emerald-800 dark:text-emerald-300">${isEn ? 'Listing received' : 'İlanınız alındı'}</strong><p class="mt-1 text-xs leading-5 text-emerald-700/80 dark:text-emerald-300/80">${escapeHtml(options.notice)}</p></div></div>` : ''}
      ${state.launchFree ? `<div class="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-3 text-xs font-bold text-indigo-700 dark:text-indigo-300"><i class="ph-bold ph-confetti mr-1"></i>${isEn ? 'All core features are free during launch.' : 'Tüm temel özellikler lansman döneminde ücretsiz.'}</div>` : ''}
      <div class="account-credit-grid grid grid-cols-1 sm:grid-cols-2 gap-3">${accountUsageCards}</div>
      <section class="space-y-3">
        <div class="flex items-center justify-between"><h4 class="text-sm font-black text-slate-900 dark:text-white">${isEn ? 'My listings' : 'İlanlarım'}</h4><button id="account-new-listing" class="text-[11px] font-bold text-blue-600 dark:text-blue-400">+ ${isEn ? 'New listing' : 'Yeni ilan'}</button></div>
        <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
          ${listings.length ? listings.map(item => `<article class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><strong class="text-xs text-slate-900 dark:text-white block truncate">${escapeHtml(item.title)}</strong><span class="inline-flex mt-1 text-[10px] font-bold px-2 py-1 rounded-full ${item.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : item.status === 'rejected' ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}">${escapeHtml(statusLabel(item.status))}</span></div><strong class="text-xs text-slate-700 dark:text-slate-300">$${Number(item.askingPrice || item.budget).toLocaleString('en-US')}</strong></div><div class="flex flex-wrap gap-2">${item.type === 'sale' && !item.isVerified && user.sellerVipCredits > 0 ? `<button data-addon-listing="${item.id}" data-addon="verification" class="px-3 py-2 rounded-lg bg-purple-500/10 text-purple-500 text-[10px] font-bold" title="${isEn ? 'Use verification review' : 'Doğrulama hakkını kullan'}"><i class="ph-bold ph-shield-check mr-1"></i>${isEn ? 'Verify' : 'Doğrula'}</button>` : ''}${item.type === 'sale' && ['Aktif', 'Doğrulanmış', 'Active', 'Verified'].includes(item.status) && user.boostCredits > 0 ? `<button data-addon-listing="${item.id}" data-addon="boost" class="px-3 py-2 rounded-lg bg-amber-500/10 text-amber-500 text-[10px] font-bold"><i class="ph-bold ph-trend-up mr-1"></i>${isEn ? 'Boost' : 'Öne çıkar'}</button>` : ''}<button data-edit-listing="${item.id}" class="px-3 py-2 rounded-lg bg-blue-500/10 text-blue-500 text-[10px] font-bold"><i class="ph-bold ph-pencil-simple mr-1"></i>${isEn ? 'Edit' : 'Düzenle'}</button><button data-delete-listing="${item.id}" class="px-3 py-2 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-bold"><i class="ph-bold ph-trash mr-1"></i>${isEn ? 'Delete' : 'Sil'}</button></div></article>`).join('') : `<p class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 text-center">${isEn ? 'You have no listings yet.' : 'Henüz ilanınız yok.'}</p>`}
        </div>
      </section>
      <div class="grid ${user.isAdmin ? 'grid-cols-2' : 'grid-cols-1'} gap-3">
        ${user.isAdmin ? `<button id="open-admin-btn" class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm"><i class="ph-bold ph-shield-check mr-2"></i>${isEn ? 'Administration' : 'Yönetim paneli'}</button>` : ''}
        <button id="account-settings-btn" class="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm"><i class="ph-bold ph-gear-six mr-2"></i>${isEn ? 'Account settings' : 'Hesap ayarları'}</button>
      </div>
      <button id="logout-btn" class="w-full py-3 rounded-xl border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-950/20"><i class="ph-bold ph-sign-out mr-2"></i>${isEn ? 'Log out' : 'Çıkış yap'}</button>
    </div>`;
  document.getElementById('close-account-modal')?.addEventListener('click', closeModal);
  document.getElementById('open-admin-btn')?.addEventListener('click', () => { window.location.href = '/admin.html'; });
  document.getElementById('account-settings-btn')?.addEventListener('click', openAccountSettingsModal);
  document.getElementById('account-new-listing')?.addEventListener('click', () => { closeModal(); openCreateListingModal(); });
  document.querySelectorAll('[data-edit-listing]').forEach(button => button.addEventListener('click', () => {
    const listing = listings.find(item => item.id === button.dataset.editListing);
    if (listing) { closeModal(); openCreateListingModal(listing); }
  }));
  document.querySelectorAll('[data-addon-listing]').forEach(button => button.addEventListener('click', async () => {
    const addon = button.dataset.addon;
    const message = addon === 'verification'
      ? (isEn ? 'Use one verification review for this listing?' : 'Bu ilan için 1 doğrulama inceleme hakkı kullanılsın mı?')
      : (isEn ? 'Use the 7-day boost for this listing?' : 'Bu ilan için 7 günlük öne çıkarma hakkı kullanılsın mı?');
    if (!window.confirm(message)) return;
    button.disabled = true;
    try {
      const result = await SearyaApi.applyListingAddon(button.dataset.addonListing, addon);
      applyAuthenticatedUser(result.user);
      showToast(addon === 'verification' ? (isEn ? 'Sent for verification review.' : 'İlan doğrulama incelemesine gönderildi.') : (isEn ? 'Listing boosted for 7 days.' : 'İlan 7 gün boyunca öne çıkarıldı.'));
      await openAccountModal();
      await hydrateBackendState();
    } catch (error) { showToast(apiErrorMessage(error)); button.disabled = false; }
  }));
  document.querySelectorAll('[data-delete-listing]').forEach(button => button.addEventListener('click', async () => {
    const listing = listings.find(item => item.id === button.dataset.deleteListing);
    if (!listing || !window.confirm(isEn ? `Remove “${listing.title}”?` : `“${listing.title}” ilanı kaldırılsın mı?`)) return;
    button.disabled = true;
    try { await SearyaApi.deleteListing(listing.id); showToast(isEn ? 'Listing removed.' : 'İlan kaldırıldı.'); await openAccountModal(); await hydrateBackendState(); }
    catch (error) { showToast(apiErrorMessage(error)); button.disabled = false; }
  }));
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try { await SearyaApi.logout(); } catch {}
    state.messages = [];
    applyAuthenticatedUser(null);
    closeModal();
    showToast(isEn ? 'Signed out.' : 'Oturum kapatıldı.');
  });
}

function openAccountSettingsModal() {
  if (!requireAuthenticated()) return;
  const isEn = state.lang === 'en';
  const user = state.currentUser;
  const content = el.modalContent();
  const backdrop = el.modalBackdrop();
  if (!content || !backdrop) return;
  content.innerHTML = `<div class="p-5 sm:p-8 space-y-6 overflow-y-auto">
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4"><div><h3 class="text-xl font-black text-slate-900 dark:text-white">${isEn ? 'Account settings' : 'Hesap ayarları'}</h3><p class="text-xs text-slate-500">${escapeHtml(user.email || '')}</p></div><button id="close-settings-modal" aria-label="Close" class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"><i class="ph-bold ph-x"></i></button></div>
    <form id="change-password-form" class="space-y-3"><h4 class="text-sm font-black text-slate-900 dark:text-white">${isEn ? 'Change password' : 'Şifre değiştir'}</h4><input id="settings-current-password" type="password" required placeholder="${isEn ? 'Current password' : 'Mevcut şifre'}" class="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm"><input id="settings-new-password" type="password" required minlength="8" placeholder="${isEn ? 'New password — at least 8 characters' : 'Yeni şifre — en az 8 karakter'}" class="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm"><button class="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold">${isEn ? 'Update password' : 'Şifreyi güncelle'}</button></form>
    <section class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><h4 class="text-sm font-black text-slate-900 dark:text-white">${isEn ? 'Your data' : 'Verileriniz'}</h4><p class="text-[11px] text-slate-500 mt-1 mb-3">${isEn ? 'Download a JSON copy of your account, listings, purchases and messages.' : 'Hesap, ilan, paket ve mesaj verilerinizin JSON kopyasını indirin.'}</p><button id="export-account-btn" class="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold"><i class="ph-bold ph-download-simple mr-1"></i>${isEn ? 'Download my data' : 'Verilerimi indir'}</button></section>
    <section class="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/30"><h4 class="text-sm font-black text-red-700 dark:text-red-400">${isEn ? 'Delete account' : 'Hesabı sil'}</h4>${user.isAdmin ? `<p class="text-[11px] text-red-600/80 mt-1">${isEn ? 'The primary administrator cannot be deleted here.' : 'Birincil yönetici hesabı bu ekrandan silinemez.'}</p>` : `<p class="text-[11px] text-red-600/80 mt-1 mb-3">${isEn ? 'This permanently removes your listings and personal account data.' : 'Bu işlem ilanlarınızı ve kişisel hesap verilerinizi kalıcı olarak kaldırır.'}</p><input id="delete-account-password" type="password" placeholder="${isEn ? 'Current password' : 'Mevcut şifre'}" class="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/30 text-sm mb-2"><input id="delete-account-confirmation" type="text" placeholder="${isEn ? 'DELETE MY ACCOUNT' : 'HESABIMI SİL'}" class="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/30 text-sm mb-3"><button id="delete-account-btn" class="w-full py-3 rounded-xl bg-red-600 text-white text-sm font-bold">${isEn ? 'Permanently delete account' : 'Hesabı kalıcı olarak sil'}</button>`}</section>
  </div>`;
  backdrop.classList.remove('hidden');
  document.getElementById('close-settings-modal')?.addEventListener('click', openAccountModal);
  document.getElementById('change-password-form')?.addEventListener('submit', async event => {
    event.preventDefault(); const button = event.currentTarget.querySelector('button'); button.disabled = true;
    try { await SearyaApi.changePassword({ currentPassword: document.getElementById('settings-current-password').value, newPassword: document.getElementById('settings-new-password').value }); showToast(isEn ? 'Password updated.' : 'Şifre güncellendi.'); openAccountModal(); }
    catch (error) { showToast(apiErrorMessage(error)); button.disabled = false; }
  });
  document.getElementById('export-account-btn')?.addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    try { const payload = await SearyaApi.exportAccount(); const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = `searya-verilerim-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url); showToast(isEn ? 'Your data was downloaded.' : 'Verileriniz indirildi.'); }
    catch (error) { showToast(apiErrorMessage(error)); } finally { event.currentTarget.disabled = false; }
  });
  document.getElementById('delete-account-btn')?.addEventListener('click', async event => {
    if (!window.confirm(isEn ? 'This cannot be undone. Continue?' : 'Bu işlem geri alınamaz. Devam edilsin mi?')) return;
    event.currentTarget.disabled = true;
    try { await SearyaApi.deleteAccount({ password: document.getElementById('delete-account-password').value, confirmation: document.getElementById('delete-account-confirmation').value.trim() }); state.messages = []; applyAuthenticatedUser(null); closeModal(); showToast(isEn ? 'Your account was deleted.' : 'Hesabınız silindi.'); await hydrateBackendState(); }
    catch (error) { showToast(apiErrorMessage(error)); event.currentTarget.disabled = false; }
  });
}

async function openAdminModal() {
  if (!state.currentUser?.isAdmin) return;
  const isEn = state.lang === 'en';
  const content = el.modalContent();
  const backdrop = el.modalBackdrop();
  if (!content || !backdrop) return;
  content.innerHTML = `<div class="p-8 text-center text-sm text-slate-500"><i class="ph-bold ph-circle-notch animate-spin text-2xl text-blue-500"></i><p class="mt-3">${isEn ? 'Loading administration…' : 'Yönetim verileri yükleniyor…'}</p></div>`;
  backdrop.classList.remove('hidden');
  try {
    const data = await SearyaApi.adminOverview();
    content.innerHTML = `
      <div class="p-5 sm:p-7 space-y-5 overflow-y-auto">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4"><div><h3 class="text-xl font-black text-slate-900 dark:text-white">${isEn ? 'Administration' : 'Yönetim paneli'}</h3><p class="text-xs text-slate-500">${data.counts.users} ${isEn ? 'users' : 'kullanıcı'} · ${data.counts.openReports} ${isEn ? 'open reports' : 'açık şikâyet'}</p></div><button id="close-admin-modal" class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"><i class="ph-bold ph-x"></i></button></div>
        <div class="space-y-3"><h4 class="text-xs font-black uppercase tracking-wider text-slate-500">${isEn ? 'Pending listings' : 'Onay bekleyen ilanlar'} (${data.counts.pendingListings})</h4>
          ${data.pendingListings.length ? data.pendingListings.map(item => `<article class="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"><div class="flex items-start justify-between gap-3"><div><strong class="text-sm text-slate-900 dark:text-white">${escapeHtml(item.title)}</strong><p class="text-[11px] text-slate-500 mt-1">$${Number(item.askingPrice).toLocaleString('en-US')} · ${escapeHtml(item.category)}</p></div>${item.priorityReview ? '<span class="text-[9px] px-2 py-1 rounded-full bg-orange-500/10 text-orange-500 font-black">VIP</span>' : ''}</div><div class="grid grid-cols-3 gap-2 mt-3"><button data-admin-id="${item.id}" data-admin-action="approve" class="py-2 rounded-lg bg-emerald-600 text-white text-[11px] font-bold">${isEn ? 'Approve' : 'Onayla'}</button><button data-admin-id="${item.id}" data-admin-action="verify" class="py-2 rounded-lg bg-blue-600 text-white text-[11px] font-bold">${isEn ? 'Verify' : 'Doğrula'}</button><button data-admin-id="${item.id}" data-admin-action="reject" class="py-2 rounded-lg bg-red-600 text-white text-[11px] font-bold">${isEn ? 'Reject' : 'Reddet'}</button></div></article>`).join('') : `<p class="text-xs text-slate-500">${isEn ? 'No pending listings.' : 'Bekleyen ilan yok.'}</p>`}
        </div>
      </div>`;
    document.getElementById('close-admin-modal')?.addEventListener('click', closeModal);
    document.querySelectorAll('[data-admin-action]').forEach(button => button.addEventListener('click', async () => {
      button.disabled = true;
      try { await SearyaApi.moderateListing(button.dataset.adminId, button.dataset.adminAction); showToast(isEn ? 'Listing updated.' : 'İlan güncellendi.'); await openAdminModal(); await hydrateBackendState(); }
      catch (error) { showToast(apiErrorMessage(error)); button.disabled = false; }
    }));
  } catch (error) {
    content.innerHTML = `<div class="p-8 text-center"><p class="text-sm text-red-500">${escapeHtml(apiErrorMessage(error))}</p><button id="close-admin-modal" class="mt-4 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">${isEn ? 'Close' : 'Kapat'}</button></div>`;
    document.getElementById('close-admin-modal')?.addEventListener('click', closeModal);
  }
}

function openGuideModal(type) {
  const isEn = state.lang === 'en';
  const guides = {
    escrow: {
      title: isEn ? 'Escrow Safety Guide' : 'Escrow Güvenlik Rehberi',
      intro: isEn ? 'Use an independent escrow provider for payment and release funds only after the transfer is verified.' : 'Ödeme için bağımsız bir escrow sağlayıcısı kullanın; parayı yalnızca devir doğrulandıktan sonra serbest bırakın.',
      items: isEn ? ['Confirm buyer and seller identities', 'Write down exactly what will be transferred', 'Verify domain, repository and account access', 'Release funds only after acceptance'] : ['Alıcı ve satıcı kimliklerini doğrulayın', 'Devredilecek varlıkları açıkça yazın', 'Domain, repo ve hesap erişimlerini kontrol edin', 'Onay tamamlanmadan ödemeyi serbest bırakmayın']
    },
    checklist: {
      title: isEn ? 'Project Handover Checklist' : 'Proje Devir Kontrol Listesi',
      intro: isEn ? 'A short checklist for a clean technical handover.' : 'Sorunsuz teknik devir için temel kontrol listesi.',
      items: isEn ? ['Source repository and commit history', 'Domain and DNS access', 'Hosting, database and storage accounts', 'Environment variable inventory without exposing secrets', 'Documentation and 7-day acceptance period'] : ['Kaynak kod deposu ve commit geçmişi', 'Domain ve DNS erişimi', 'Hosting, veritabanı ve depolama hesapları', 'Gizli değerleri paylaşmadan ortam değişkeni envanteri', 'Dokümantasyon ve 7 günlük kabul süresi']
    },
    contract: {
      title: isEn ? 'Transfer Agreement Template' : 'Devir Sözleşmesi Şablonu',
      intro: isEn ? 'Include the parties, transferred assets, price, delivery date, acceptance criteria and warranty limitations. Have a lawyer review the final agreement.' : 'Tarafları, devredilen varlıkları, bedeli, teslim tarihini, kabul kriterlerini ve garanti sınırlarını yazın. Nihai metni bir hukukçuya inceletin.',
      items: isEn ? ['Parties and verified contact details', 'Complete asset inventory', 'Payment and escrow conditions', 'Delivery and acceptance procedure', 'Intellectual property declaration'] : ['Taraflar ve doğrulanmış iletişim bilgileri', 'Eksiksiz varlık listesi', 'Ödeme ve escrow koşulları', 'Teslim ve kabul prosedürü', 'Fikri mülkiyet beyanı']
    },
    privacy: {
      title: isEn ? 'Privacy Policy Summary' : 'Gizlilik Politikası Özeti',
      intro: isEn ? 'Searya should collect only the data needed for accounts, listings, messaging and transaction safety.' : 'Searya yalnızca hesap, ilan, mesajlaşma ve işlem güvenliği için gerekli verileri toplamalıdır.',
      items: isEn ? ['Do not sell personal data', 'Protect private listing and message data', 'Allow account data export and deletion', 'Publish and maintain clear retention and cookie rules'] : ['Kişisel verileri satmayın', 'Özel ilan ve mesaj verilerini koruyun', 'Veri dışa aktarma ve hesap silme imkânı sağlayın', 'Yayından önce saklama ve çerez kurallarını yayınlayın']
    },
    terms: {
      title: isEn ? 'Terms of Use Summary' : 'Kullanım Şartları Özeti',
      intro: isEn ? 'Users are responsible for listing accuracy and due diligence; Searya facilitates discovery and communication.' : 'Kullanıcılar ilan doğruluğu ve inceleme sürecinden sorumludur; Searya keşif ve iletişimi kolaylaştırır.',
      items: isEn ? ['False metrics and stolen assets are prohibited', 'Fees must be shown before payment', 'Disputes follow the agreed transfer contract', 'Illegal or harmful projects may be removed'] : ['Sahte metrikler ve çalıntı varlıklar yasaktır', 'Ücretler ödeme öncesinde açıkça gösterilir', 'Uyuşmazlıklarda kabul edilen devir sözleşmesi esas alınır', 'Yasadışı veya zararlı projeler kaldırılabilir']
    }
  };
  const guide = guides[type];
  const backdrop = el.modalBackdrop();
  const content = el.modalContent();
  if (!guide || !backdrop || !content) return;

  content.innerHTML = `
    <div class="p-6 sm:p-8 space-y-5 overflow-y-auto">
      <div class="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div><h3 class="text-xl font-black text-slate-900 dark:text-white">${escapeHtml(guide.title)}</h3><p class="text-xs text-slate-500 mt-1">${escapeHtml(guide.intro)}</p></div>
        <button id="close-guide-modal" aria-label="${isEn ? 'Close' : 'Kapat'}" class="w-9 h-9 flex-shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center"><i class="ph-bold ph-x"></i></button>
      </div>
      <ul class="space-y-3">${guide.items.map(item => `<li class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300"><i class="ph-bold ph-check-circle text-emerald-500 mt-0.5"></i><span>${escapeHtml(item)}</span></li>`).join('')}</ul>
      <p class="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3">${isEn ? 'Informational template only; obtain professional legal or financial advice when needed.' : 'Bu içerik bilgilendirme amaçlıdır; gerektiğinde profesyonel hukuk veya finans danışmanlığı alın.'}</p>
    </div>`;
  backdrop.classList.remove('hidden');
  document.getElementById('close-guide-modal')?.addEventListener('click', closeModal);
}

// Package Purchase Modal Checkout Handler
function openPackagePurchaseModal(packageName, price, packageKey) {
  const isEn = state.lang === 'en';
  if (state.launchFree) {
    showToast(isEn ? 'Searya is free during launch. No package purchase is required.' : 'Searya lansman döneminde ücretsiz. Paket satın almanız gerekmiyor.');
    return;
  }
  if (state.paymentMode === 'disabled') {
    showToast(isEn ? 'Payment infrastructure is being prepared. Free access remains available.' : 'Ödeme altyapısı hazırlanıyor. Ücretsiz kullanım devam ediyor.');
    return;
  }
  const backdrop = el.modalBackdrop();
  const content = el.modalContent();

  if (!backdrop || !content) return;

  content.innerHTML = `
    <div class="p-6 sm:p-8 space-y-6">
      <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl font-bold">
            <i class="ph-bold ph-shopping-bag font-bold"></i>
          </div>
          <div>
            <h3 class="text-xl font-black text-slate-900 dark:text-white">${packageName}</h3>
            <span class="text-xs text-slate-500">${isEn ? 'Package Purchase Checkout' : 'Paket Satın Alma Paneli'}</span>
          </div>
        </div>
        <button id="close-package-modal" aria-label="Close" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center">
          <i class="ph-bold ph-x"></i>
        </button>
      </div>

      <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <div>
          <span class="text-xs text-slate-500 block">${isEn ? 'Selected Package' : 'Seçilen Paket'}</span>
          <strong class="text-sm font-black text-slate-900 dark:text-white">${packageName}</strong>
        </div>
        <span class="text-2xl font-black text-emerald-600 dark:text-emerald-400">${price}</span>
      </div>

      <form id="package-checkout-form" class="space-y-3">
        <div class="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/20 text-xs text-blue-800 dark:text-blue-200 flex items-start gap-3">
          <i class="ph-bold ph-shield-check text-lg text-blue-600 mt-0.5"></i>
          <p>${isEn ? 'Card details are never collected by Searya. You will continue on the secure payment provider page.' : 'Kart bilgileriniz Searya tarafından alınmaz. Güvenli ödeme sağlayıcısının sayfasında devam edersiniz.'}</p>
        </div>
        <button type="submit" id="confirm-package-buy" class="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 text-white font-black text-sm shadow-xl shadow-purple-500/25 hover:from-emerald-500 hover:to-purple-500 transition-all cursor-pointer">
          ${isEn ? `Continue to secure checkout — ${price}` : `Güvenli ödemeye devam et — ${price}`}
        </button>
      </form>
    </div>
  `;

  backdrop.classList.remove('hidden');
  document.getElementById('close-package-modal')?.addEventListener('click', closeModal);
  document.getElementById('package-checkout-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!requireAuthenticated()) return;
    const button = document.getElementById('confirm-package-buy');
    if (button) button.disabled = true;
    try {
      const result = await SearyaApi.checkout(packageKey);
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      if (result.user) applyAuthenticatedUser(result.user);
      closeModal();
      showToast(result.mode === 'demo' ? (isEn ? 'Test checkout completed and credits were added.' : 'Test ödemesi tamamlandı, haklar hesabınıza eklendi.') : (isEn ? 'Package activated.' : 'Paket aktifleştirildi.'));
    } catch (error) {
      showToast(apiErrorMessage(error));
      if (button) button.disabled = false;
    }
  });
}

// Interactive Free SaaS & AI Project Valuation Calculator Modal
function openValuationModal() {
  const isEn = state.lang === 'en';
  const backdrop = el.modalBackdrop();
  const content = el.modalContent();

  if (!backdrop || !content) return;

  content.innerHTML = `
    <div class="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[88vh]">
      
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl font-bold">
            📊
          </div>
          <div>
            <h3 class="text-xl font-black text-slate-900 dark:text-white">${isEn ? 'AI Project Valuation Calculator' : 'Ücretsiz Proje Değerleme Hesaplayıcı'}</h3>
            <span class="text-xs text-slate-500">${isEn ? 'Calculate your estimated SaaS valuation in seconds' : 'Projenizin tahmini satış değerini 10 saniyede hesaplayın'}</span>
          </div>
        </div>
        <button id="close-valuation-modal" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center">
          <i class="ph-bold ph-x"></i>
        </button>
      </div>

      <!-- Form Inputs Grid -->
      <div class="space-y-4">
        
        <div>
          <label class="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">${isEn ? 'Monthly Recurring Revenue ($ MRR)' : 'Aylık Düzenli Gelir ($ MRR)'}</label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
            <input type="number" id="calc-mrr" value="2450" placeholder="2450" class="w-full pl-8 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600">
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">${isEn ? 'Project Category' : 'Proje Kategorisi'}</label>
            <select id="calc-cat" class="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none">
              <option value="ai">🤖 AI Projesi (2.5x - 3.5x ARR)</option>
              <option value="saas" selected>⚡ Micro SaaS (2.0x - 2.8x ARR)</option>
              <option value="extension">🧩 Chrome Extension (1.2x - 2.0x ARR)</option>
              <option value="mobile">📱 Mobil Uygulama (1.5x - 2.4x ARR)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">${isEn ? 'Monthly Growth Rate' : 'Aylık Büyüme Oranı'}</label>
            <select id="calc-growth" class="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none">
              <option value="high">🚀 Yüksek Büyüme (> %15/ay)</option>
              <option value="med" selected>📈 Düzenli Büyüme (%5 - %15/ay)</option>
              <option value="stable">⚓ Stabil Gelir (%0 - %5/ay)</option>
            </select>
          </div>
        </div>

      </div>

      <!-- Real-Time Calculation Result Box -->
      <div id="valuation-result-box" class="p-6 rounded-3xl bg-gradient-to-br from-purple-900/90 via-indigo-900/90 to-slate-900 text-white border border-purple-500/40 shadow-2xl space-y-4 relative overflow-hidden">
        
        <div class="flex items-center justify-between">
          <span class="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500 text-slate-950 flex items-center gap-1">
            <i class="ph-bold ph-sparkle"></i> GERÇEKÇİ PİYASA SATIŞ DEĞERİ
          </span>
          <span id="calc-multiple-badge" class="text-xs font-black text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-xl border border-purple-500/30">2.4x ARR (28x MRR)</span>
        </div>

        <div class="text-center py-2">
          <span class="text-xs text-slate-300 block font-medium mb-1">${isEn ? 'Estimated Market Value' : 'Tahmini Piyasa Satış Değeri (Makul Aralık)'}</span>
          <strong id="calc-valuation-range" class="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-purple-300 to-indigo-300">$58,800 – $82,300</strong>
        </div>

        <div class="grid grid-cols-3 gap-2 text-center text-xs border-t border-white/10 pt-4">
          <div>
            <span class="text-[10px] text-slate-400 block font-semibold">Yıllık Gelir (ARR)</span>
            <strong id="calc-arr-val" class="font-bold text-white text-sm">$29,400</strong>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 block font-semibold">Tahmini Satış Süresi</span>
            <strong class="font-bold text-emerald-400 text-sm">7-14 Gün</strong>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 block font-semibold">Komisyon Oranı</span>
            <strong class="font-bold text-purple-300 text-sm">%0 Komisyon</strong>
          </div>
        </div>

      </div>

      <!-- Action Button -->
      <button id="calc-list-now-btn" class="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 text-white font-extrabold text-sm shadow-xl shadow-purple-500/25 hover:from-emerald-500 hover:to-purple-500 transition-all cursor-pointer flex items-center justify-center gap-2">
        <span>🚀 Projeni Bu Fiyata Searya'da Satışa Çıkar →</span>
      </button>

    </div>
  `;

  backdrop.classList.remove('hidden');

  const mrrInput = document.getElementById('calc-mrr');
  const catSelect = document.getElementById('calc-cat');
  const growthSelect = document.getElementById('calc-growth');
  const rangeEl = document.getElementById('calc-valuation-range');
  const multipleEl = document.getElementById('calc-multiple-badge');
  const arrEl = document.getElementById('calc-arr-val');

  function updateValuation() {
    const mrr = Math.max(0, parseFloat(mrrInput?.value || 0) || 0);
    const cat = catSelect?.value || 'saas';
    const growth = growthSelect?.value || 'med';

    const arr = mrr * 12;
    let baseMult = 2.4;

    if (cat === 'ai') baseMult = 3.0;
    else if (cat === 'saas') baseMult = 2.4;
    else if (cat === 'extension') baseMult = 1.6;
    else if (cat === 'mobile') baseMult = 2.0;

    if (growth === 'high') baseMult += 0.4;
    else if (growth === 'stable') baseMult -= 0.4;

    const minVal = Math.round(arr * (baseMult - 0.4));
    const maxVal = Math.round(arr * (baseMult + 0.4));

    if (rangeEl) rangeEl.textContent = `$${minVal.toLocaleString('en-US')} – $${maxVal.toLocaleString('en-US')}`;
    if (multipleEl) multipleEl.textContent = `${baseMult.toFixed(1)}x ARR (${Math.round(baseMult * 12)}x MRR)`;
    if (arrEl) arrEl.textContent = `$${arr.toLocaleString('en-US')}`;
  }

  mrrInput?.addEventListener('input', updateValuation);
  catSelect?.addEventListener('change', updateValuation);
  growthSelect?.addEventListener('change', updateValuation);

  document.getElementById('close-valuation-modal')?.addEventListener('click', closeModal);
  document.getElementById('calc-list-now-btn')?.addEventListener('click', () => {
    closeModal();
    openCreateListingModal();
  });
}

// Gamified Viral Feature: Project Battles (Hangisini Satın Alırdın?)
function openProjectBattlesModal() {
  const isEn = state.lang === 'en';
  const backdrop = el.modalBackdrop();
  const content = el.modalContent();

  if (!backdrop || !content) return;

  const listings = initialForSaleListings.filter(p => p.type === 'sale' || p.askingPrice);
  if (listings.length < 2) return;

  // Pick two random distinct projects
  let idxA = Math.floor(Math.random() * listings.length);
  let idxB = Math.floor(Math.random() * listings.length);
  while (idxB === idxA) {
    idxB = Math.floor(Math.random() * listings.length);
  }

  const projA = listings[idxA];
  const projB = listings[idxB];

  let hasVoted = false;

  function renderBattle() {
    content.innerHTML = `
      <div class="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[90vh]">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-emerald-500 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-amber-500/20">
              ⚔️
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">VIRAL ARENA</span>
                <span class="text-xs text-slate-400 font-bold">1,840+ Oy Kullanıldı</span>
              </div>
              <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">${isEn ? 'Project Battles: Which would you buy?' : 'Project Battles: Hangisini Satın Alırdın?'}</h3>
            </div>
          </div>

          <button id="close-battle-modal" class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center transition-all">
            <i class="ph-bold ph-x text-base"></i>
          </button>
        </div>

        <p class="text-xs text-center text-slate-400 font-medium">
          ${isEn ? 'Compare two digital projects side-by-side and cast your vote on which acquisition makes more sense!' : 'İki dijital projeyi yan yana karşılaştır, yatırım yapmak isteyeceğin tarafa oyunu ver!'}
        </p>

        <!-- Battle Arena Side by Side Grid -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center relative">
          
          <!-- PROJECT A (LEFT CARD) -->
          <div class="md:col-span-5 rounded-3xl p-5 bg-slate-900/90 border border-purple-500/40 text-white space-y-4 shadow-xl hover:border-purple-500 transition-all flex flex-col justify-between h-full relative overflow-hidden group">
            <div class="space-y-3">
              <div class="h-32 rounded-2xl overflow-hidden relative">
                <img src="${projA.coverImage || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                <span class="absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-purple-600 text-white shadow-md">PROJE A</span>
              </div>

              <div>
                <h4 class="text-base font-black text-white line-clamp-1">${projA.title}</h4>
                <p class="text-xs text-slate-400 mt-0.5 line-clamp-2">${projA.shortDesc || projA.description}</p>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-black/40 border border-white/5">
                <div>
                  <span class="text-[10px] text-slate-400 block font-semibold">Fiyat</span>
                  <strong class="text-sm font-black text-purple-400">$${(projA.askingPrice || 0).toLocaleString('en-US')}</strong>
                </div>
                <div>
                  <span class="text-[10px] text-slate-400 block font-semibold">Aylık MRR</span>
                  <strong class="text-sm font-black text-emerald-400">$${(projA.mrr || 0).toLocaleString('en-US')} /mo</strong>
                </div>
              </div>
            </div>

            <!-- Vote Button A / Results Bar A -->
            <div class="pt-3 border-t border-white/10 space-y-2">
              ${!hasVoted ? `
                <button id="vote-btn-a" class="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2">
                  <span>👈 Bu Projeyi Alırdım</span>
                </button>
              ` : `
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-xs font-black">
                    <span class="text-purple-400">Proje A</span>
                    <span class="text-white">%64 Oy</span>
                  </div>
                  <div class="h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style="width: 64%"></div>
                  </div>
                </div>
              `}
            </div>
          </div>

          <!-- VS LIGHTNING BADGE -->
          <div class="md:col-span-2 flex items-center justify-center my-2 md:my-0">
            <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-red-500 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-xl ring-4 ring-slate-950 animate-bounce">
              VS
            </div>
          </div>

          <!-- PROJECT B (RIGHT CARD) -->
          <div class="md:col-span-5 rounded-3xl p-5 bg-slate-900/90 border border-emerald-500/40 text-white space-y-4 shadow-xl hover:border-emerald-500 transition-all flex flex-col justify-between h-full relative overflow-hidden group">
            <div class="space-y-3">
              <div class="h-32 rounded-2xl overflow-hidden relative">
                <img src="${projB.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                <span class="absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-600 text-white shadow-md">PROJE B</span>
              </div>

              <div>
                <h4 class="text-base font-black text-white line-clamp-1">${projB.title}</h4>
                <p class="text-xs text-slate-400 mt-0.5 line-clamp-2">${projB.shortDesc || projB.description}</p>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-black/40 border border-white/5">
                <div>
                  <span class="text-[10px] text-slate-400 block font-semibold">Fiyat</span>
                  <strong class="text-sm font-black text-purple-400">$${(projB.askingPrice || 0).toLocaleString('en-US')}</strong>
                </div>
                <div>
                  <span class="text-[10px] text-slate-400 block font-semibold">Aylık MRR</span>
                  <strong class="text-sm font-black text-emerald-400">$${(projB.mrr || 0).toLocaleString('en-US')} /mo</strong>
                </div>
              </div>
            </div>

            <!-- Vote Button B / Results Bar B -->
            <div class="pt-3 border-t border-white/10 space-y-2">
              ${!hasVoted ? `
                <button id="vote-btn-b" class="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                  <span>Bu Projeyi Alırdım 👉</span>
                </button>
              ` : `
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-xs font-black">
                    <span class="text-emerald-400">Proje B</span>
                    <span class="text-white">%36 Oy</span>
                  </div>
                  <div class="h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style="width: 36%"></div>
                  </div>
                </div>
              `}
            </div>
          </div>

        </div>

        <!-- Next Battle Action Bar -->
        ${hasVoted ? `
          <div class="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <span class="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
              <i class="ph-bold ph-check-circle text-base"></i> Oyunuz kaydedildi! Toplam %64 ile Proje A önde gidiyor.
            </span>

            <button id="next-battle-btn" class="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition-all">
              <span>🎲 Sonraki İki Proje (Next Battle) →</span>
            </button>
          </div>
        ` : ''}

      </div>
    `;

    backdrop.classList.remove('hidden');

    document.getElementById('close-battle-modal')?.addEventListener('click', closeModal);

    document.getElementById('vote-btn-a')?.addEventListener('click', () => {
      hasVoted = true;
      showToast("🏆 Oyunuz Proje A'ya kaydedildi!");
      renderBattle();
    });

    document.getElementById('vote-btn-b')?.addEventListener('click', () => {
      hasVoted = true;
      showToast("🏆 Oyunuz Proje B'ye kaydedildi!");
      renderBattle();
    });

    document.getElementById('next-battle-btn')?.addEventListener('click', () => {
      openProjectBattlesModal();
    });
  }

  renderBattle();
}

function switchSimplePricingAudience(audience = 'buyer') {
  const selected = audience === 'seller' ? 'seller' : 'buyer';
  document.querySelectorAll('[data-pricing-audience]').forEach(card => {
    card.classList.toggle('hidden', card.dataset.pricingAudience !== selected);
    if (card.dataset.pricingAudience === selected) card.classList.add('animate-fade-in');
  });
  const buyerButton = document.getElementById('simple-pricing-buyer-tab');
  const sellerButton = document.getElementById('simple-pricing-seller-tab');
  [[buyerButton, 'buyer'], [sellerButton, 'seller']].forEach(([button, value]) => {
    if (!button) return;
    const active = value === selected;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.getElementById('t-simple-verification-note')?.classList.toggle('hidden', selected !== 'seller');
}

// Switch Pricing View (Buyer, Seller or Both Side-by-Side)
function switchPricingView(mode) {
  state.pricingTab = mode;
  
  const bCol = document.getElementById('pricing-col-buyer');
  const sCol = document.getElementById('pricing-col-seller');
  const bBtn = el.pricingToggleBuyer();
  const sBtn = el.pricingToggleSeller();
  const aBtn = document.getElementById('pricing-toggle-all');

  const defaultStyle = "pricing-toggle-btn px-5 py-2.5 rounded-full font-bold text-xs transition-all text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-transparent";

  if (bBtn) bBtn.className = defaultStyle;
  if (sBtn) sBtn.className = defaultStyle;
  if (aBtn) aBtn.className = defaultStyle;

  if (mode === 'buyer') {
    if (bCol) bCol.className = "lg:col-span-12 space-y-6 animate-fade-in block";
    if (sCol) sCol.className = "hidden";
    if (bBtn) bBtn.className = "pricing-toggle-btn active px-6 py-2.5 rounded-full font-bold text-xs transition-all bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30";
  } else if (mode === 'seller') {
    if (sCol) sCol.className = "lg:col-span-12 space-y-6 animate-fade-in block";
    if (bCol) bCol.className = "hidden";
    if (sBtn) sBtn.className = "pricing-toggle-btn active px-6 py-2.5 rounded-full font-bold text-xs transition-all bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-500/30";
  } else {
    // Both side-by-side
    if (bCol) bCol.className = "lg:col-span-5 space-y-6 animate-fade-in block";
    if (sCol) sCol.className = "lg:col-span-7 space-y-6 animate-fade-in block";
    if (aBtn) aBtn.className = "pricing-toggle-btn active px-5 py-2.5 rounded-full font-bold text-xs transition-all bg-slate-900 text-white dark:bg-slate-700 shadow-md";
  }
}

// Switch Main Tab cleanly
function switchTab(tab) {
  const changed = state.activeTab !== tab;
  state.activeTab = tab;
  state.categoryFilter = 'all';

  document.querySelectorAll('.cat-chip').forEach(c => {
    c.classList.remove('active', 'bg-slate-900', 'text-white', 'dark:bg-slate-800');
    c.classList.add('bg-white', 'text-slate-600', 'dark:bg-slate-900', 'dark:text-slate-400');
  });
  document.querySelector('.cat-chip[data-category="all"]')?.classList.add('active', 'bg-slate-900', 'text-white', 'dark:bg-slate-800');

  const dict = t();
  const tabSale = el.tabForSale();
  const tabWtb = el.tabLookingToBuy();
  const gTitle = el.gridTitle();
  const gSub = el.gridSubtitle();

  if (tab === 'sale') {
    if (tabSale) tabSale.className = "tab-btn active flex flex-shrink-0 items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all text-emerald-950 dark:text-emerald-300 bg-white dark:bg-emerald-500/20 border border-slate-200 dark:border-emerald-500/40 shadow-sm";
    if (tabWtb) tabWtb.className = "tab-btn flex flex-shrink-0 items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white";
    if (gTitle) gTitle.textContent = dict.gridTitleSale;
    if (gSub) gSub.textContent = dict.gridSubtitleSale;
  } else {
    if (tabWtb) tabWtb.className = "tab-btn active flex flex-shrink-0 items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all text-indigo-950 dark:text-indigo-300 bg-white dark:bg-indigo-500/20 border border-slate-200 dark:border-indigo-500/40 shadow-sm";
    if (tabSale) tabSale.className = "tab-btn flex flex-shrink-0 items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white";
    if (gTitle) gTitle.textContent = dict.gridTitleWtb;
    if (gSub) gSub.textContent = dict.gridSubtitleWtb;
  }
  renderListings();
  if (changed) trackBehavior('tab_changed', { tab });
}

function selectCategory(category = 'all') {
  const selected = document.querySelector(`.cat-chip[data-category="${category}"]`) || document.querySelector('.cat-chip[data-category="all"]');
  document.querySelectorAll('.cat-chip').forEach(chip => {
    chip.classList.remove('active', 'bg-slate-900', 'text-white', 'dark:bg-slate-800');
    chip.classList.add('bg-white', 'text-slate-600', 'dark:bg-slate-900', 'dark:text-slate-400');
  });
  selected?.classList.remove('bg-white', 'text-slate-600', 'dark:text-slate-400');
  selected?.classList.add('active', 'bg-slate-900', 'text-white', 'dark:bg-slate-800');
  state.categoryFilter = selected?.dataset.category || 'all';
  renderListings();
  trackBehavior('filter_changed', { category: state.categoryFilter, tab: state.activeTab });
}

function updateAlertControls() {
  const isEn = state.lang === 'en';
  const saveLabel = document.getElementById('t-save-search');
  const alertsLabel = document.getElementById('t-project-alerts');
  const countBadge = document.getElementById('project-alert-count');
  const weeklyKicker = document.getElementById('t-weekly-picks-kicker');
  const weeklyTitle = document.getElementById('t-weekly-picks-title');
  const weeklySubtitle = document.getElementById('t-weekly-picks-subtitle');
  const weeklyButton = document.getElementById('t-weekly-alert-btn');

  if (saveLabel) saveLabel.textContent = isEn ? 'Save Search' : 'Aramayı Kaydet';
  if (alertsLabel) alertsLabel.textContent = isEn ? 'My Alerts' : 'Alarmlarım';
  if (weeklyKicker) weeklyKicker.innerHTML = `<i class="ph-bold ph-sparkle"></i>${isEn ? "This week's picks" : 'Bu haftanın seçkisi'}`;
  if (weeklyTitle) weeklyTitle.textContent = isEn ? '6 projects worth a closer look' : 'İncelemeye değer 6 proje';
  if (weeklySubtitle) weeklySubtitle.textContent = isEn ? 'Selected by recency, verification and buyer interest.' : 'Güncellik, doğrulama ve ilgi düzeyine göre öne çıkan ilanlar.';
  if (weeklyButton) weeklyButton.textContent = isEn ? 'Create weekly alert' : 'Haftalık alarm oluştur';

  if (countBadge) {
    countBadge.textContent = String(state.savedAlerts.length);
    countBadge.classList.toggle('hidden', state.savedAlerts.length === 0);
    countBadge.classList.toggle('flex', state.savedAlerts.length > 0);
  }
}

function listingMatchesAlert(listing, alert) {
  const price = Number(listing.askingPrice || 0);
  const searchable = normalizeSearch([listing.title, listing.shortDesc, ...(listing.techStack || [])].join(' '));
  return (alert.category === 'all' || listing.category === alert.category)
    && price >= alert.minPrice
    && price <= alert.maxPrice
    && (!alert.tech || searchable.includes(normalizeSearch(alert.tech)));
}

function getAlertMatches(alert) {
  return state.forSaleListings.filter(listing => listingMatchesAlert(listing, alert));
}

function renderWeeklyPicks() {
  const container = document.getElementById('weekly-picks-grid');
  if (!container) return;
  const isEn = state.lang === 'en';
  const earlyStage = state.forSaleListings
    .filter(project => !project.mrr)
    .sort((a, b) => listingCreatedAt(b) - listingCreatedAt(a) || (b.views || 0) - (a.views || 0))
    .slice(0, 3);
  const revenueGenerating = state.forSaleListings
    .filter(project => project.mrr > 0)
    .sort((a, b) => (b.isVerified - a.isVerified) || (b.views || 0) - (a.views || 0))
    .slice(0, 3);
  const picks = earlyStage.flatMap((project, index) => [project, revenueGenerating[index]]).filter(Boolean);

  container.innerHTML = picks.map((project, index) => {
    const title = isEn ? (project.titleEn || project.title) : project.title;
    const verified = project.isVerified || project.status === 'Doğrulanmış' || project.statusEn === 'Verified';
    return `
      <button type="button" data-weekly-project-id="${escapeHtml(project.id)}" class="weekly-pick-card text-left p-4 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all shadow-sm group">
        <div class="flex items-start gap-3">
          <img src="${safeImageUrl(project.coverImage)}" alt="${escapeHtml(title)}" class="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div class="min-w-0 flex-1 space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[10px] font-black text-indigo-600 dark:text-indigo-400">#${index + 1} ${isEn ? 'WEEKLY PICK' : 'HAFTANIN SEÇİMİ'}</span>
              ${verified ? `<i class="ph-fill ph-seal-check text-emerald-500" title="${isEn ? 'Verified' : 'Doğrulanmış'}"></i>` : ''}
            </div>
            <h3 class="font-black text-sm text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">${escapeHtml(title)}</h3>
            <div class="flex items-center justify-between gap-2 text-[11px]">
              <strong class="text-emerald-600 dark:text-emerald-400">$${Number(project.askingPrice || 0).toLocaleString('en-US')}</strong>
              <span class="text-slate-400 flex items-center gap-1"><i class="ph-bold ph-eye"></i>${Number(project.views || 0).toLocaleString('en-US')}</span>
            </div>
          </div>
        </div>
      </button>`;
  }).join('');

  container.querySelectorAll('[data-weekly-project-id]').forEach(card => {
    card.addEventListener('click', () => {
      const project = state.forSaleListings.find(item => item.id === card.dataset.weeklyProjectId);
      if (project) openProjectDetailModal(project);
    });
  });
}

function openProjectAlertModal(options = {}) {
  const isEn = state.lang === 'en';
  const backdrop = el.modalBackdrop();
  const content = el.modalContent();
  if (!backdrop || !content) return;

  const selectedCategory = options.useCurrentSearch ? state.categoryFilter : 'all';
  const selectedTech = options.useCurrentSearch ? cleanUserText(state.searchQuery, 60) : '';
  const selectedFrequency = options.frequency || 'instant';
  const categoryLabels = {
    all: isEn ? 'All categories' : 'Tüm kategoriler',
    ai: isEn ? 'AI Tools' : 'AI Projeleri',
    saas: 'Micro SaaS',
    extension: 'Chrome Extension',
    mobile: isEn ? 'Mobile Apps' : 'Mobil Uygulamalar',
    notion: 'Notion Templates',
    'ui-kit': 'UI Kits',
    api: 'Developer APIs'
  };

  const alertRows = state.savedAlerts.map(alert => {
    const frequencyLabel = alert.frequency === 'weekly'
      ? (isEn ? 'Weekly' : 'Haftalık')
      : alert.frequency === 'daily'
        ? (isEn ? 'Daily' : 'Günlük')
        : (isEn ? 'Instant' : 'Anlık');
    return `
      <div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div class="min-w-0">
          <strong class="text-xs text-slate-900 dark:text-white block truncate">${escapeHtml(categoryLabels[alert.category] || categoryLabels.all)} · $${alert.minPrice.toLocaleString('en-US')}–$${alert.maxPrice.toLocaleString('en-US')}</strong>
          <span class="text-[10px] text-slate-500">${alert.tech ? `${escapeHtml(alert.tech)} · ` : ''}${frequencyLabel} · ${getAlertMatches(alert).length} ${isEn ? 'matches' : 'eşleşme'}</span>
        </div>
        <button type="button" data-delete-alert-id="${escapeHtml(alert.id)}" aria-label="${isEn ? 'Delete alert' : 'Alarmı sil'}" class="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center flex-shrink-0"><i class="ph-bold ph-trash"></i></button>
      </div>`;
  }).join('');

  content.innerHTML = `
    <div class="p-6 sm:p-8 space-y-5 overflow-y-auto">
      <div class="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div class="flex items-start gap-3">
          <span class="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl"><i class="ph-bold ph-bell-ringing"></i></span>
          <div><h3 class="text-xl font-black text-slate-900 dark:text-white">${isEn ? 'Smart Project Alert' : 'Akıllı Proje Alarmı'}</h3><p class="text-xs text-slate-500 mt-1">${isEn ? 'Save your criteria and see matching new projects first.' : 'Kriterlerini kaydet, uygun yeni projeleri ilk sen gör.'}</p></div>
        </div>
        <button id="close-alert-modal" aria-label="${isEn ? 'Close' : 'Kapat'}" class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center flex-shrink-0"><i class="ph-bold ph-x"></i></button>
      </div>

      <form id="project-alert-form" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">${isEn ? 'Category' : 'Kategori'}</label>
          <select id="alert-category" class="w-full px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white">
            ${Object.entries(categoryLabels).map(([value, label]) => `<option value="${value}" ${selectedCategory === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">${isEn ? 'Min. budget' : 'Min. bütçe'}</label><input id="alert-min-price" type="number" min="0" max="10000000" value="0" required class="w-full px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"></div>
          <div><label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">${isEn ? 'Max. budget' : 'Maks. bütçe'}</label><input id="alert-max-price" type="number" min="1" max="10000000" value="50000" required class="w-full px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"></div>
        </div>
        <div><label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">${isEn ? 'Technology (optional)' : 'Teknoloji (isteğe bağlı)'}</label><input id="alert-tech" type="text" maxlength="60" value="${escapeHtml(selectedTech)}" placeholder="Next.js, Python, AI..." class="w-full px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"></div>
        <div><label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">${isEn ? 'Notification frequency' : 'Bildirim sıklığı'}</label><select id="alert-frequency" class="w-full px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"><option value="instant" ${selectedFrequency === 'instant' ? 'selected' : ''}>${isEn ? 'Instant' : 'Anlık'}</option><option value="daily">${isEn ? 'Daily summary' : 'Günlük özet'}</option><option value="weekly" ${selectedFrequency === 'weekly' ? 'selected' : ''}>${isEn ? 'Weekly selection' : 'Haftalık seçki'}</option></select></div>
        <button type="submit" class="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"><i class="ph-bold ph-bell-plus"></i>${isEn ? 'Save Project Alert' : 'Proje Alarmını Kaydet'}</button>
        <p class="text-[10px] text-center text-slate-400">${isEn ? 'Alerts are saved to your account.' : 'Alarmlar hesabınıza kaydedilir.'}</p>
      </form>

      ${state.savedAlerts.length ? `<div class="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800"><h4 class="text-xs font-black text-slate-900 dark:text-white">${isEn ? 'Saved alerts' : 'Kayıtlı alarmlar'}</h4>${alertRows}</div>` : ''}
    </div>`;

  backdrop.classList.remove('hidden');
  document.getElementById('close-alert-modal')?.addEventListener('click', closeModal);
  document.getElementById('project-alert-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!requireAuthenticated()) return;
    const minPrice = Math.max(0, Number(document.getElementById('alert-min-price').value) || 0);
    const maxPrice = Math.max(1, Number(document.getElementById('alert-max-price').value) || 0);
    if (maxPrice < minPrice) {
      showToast(isEn ? 'Maximum budget must be greater than minimum budget.' : 'Maksimum bütçe minimum bütçeden büyük olmalı.');
      return;
    }
    const alert = {
      id: `alert-${Date.now()}`,
      category: document.getElementById('alert-category').value,
      minPrice,
      maxPrice,
      tech: cleanUserText(document.getElementById('alert-tech').value, 60),
      frequency: document.getElementById('alert-frequency').value,
      createdAt: new Date().toISOString()
    };
    try {
      const result = await SearyaApi.createAlert({ query: alert.tech, category: alert.category, minPrice, maxPrice, frequency: alert.frequency });
      alert.id = result.id;
      state.savedAlerts = [alert, ...state.savedAlerts].slice(0, 10);
      persistClientState();
      updateAlertControls();
      closeModal();
      showToast(isEn ? `Project alert saved · ${getAlertMatches(alert).length} current matches` : `Proje alarmı kaydedildi · Şu anda ${getAlertMatches(alert).length} eşleşme var`);
    } catch (error) { showToast(apiErrorMessage(error)); }
  });

  content.querySelectorAll('[data-delete-alert-id]').forEach(button => {
    button.addEventListener('click', async () => {
      try {
        if (state.currentUser) await SearyaApi.deleteAlert(button.dataset.deleteAlertId);
        state.savedAlerts = state.savedAlerts.filter(alert => alert.id !== button.dataset.deleteAlertId);
        persistClientState();
        updateAlertControls();
        openProjectAlertModal();
      } catch (error) { showToast(apiErrorMessage(error)); }
    });
  });
}

// Render Grid of Side-by-Side Square Cards
function renderListings() {
  const container = el.listingsGridContainer();
  if (!container) return;

  const isSale = state.activeTab === 'sale';
  let items = isSale ? [...state.forSaleListings] : [...state.wtbListings];

  // Category Filter
  if (state.categoryFilter !== 'all') {
    items = items.filter(i => i.category === state.categoryFilter);
  }

  // Search Query
  if (state.searchQuery) {
    items = items.filter(i => {
      const title = state.lang === 'en' ? (i.titleEn || i.title) : i.title;
      const desc = state.lang === 'en' ? (i.shortDescEn || i.shortDesc) : i.shortDesc;
      return normalizeSearch(title).includes(state.searchQuery) ||
        normalizeSearch(desc).includes(state.searchQuery) ||
        i.techStack?.some(tech => normalizeSearch(tech).includes(state.searchQuery));
    });
  }

  // Sorting
  if (state.sortBy === 'newest') {
    items.sort((a, b) => listingCreatedAt(b) - listingCreatedAt(a));
  } else if (state.sortBy === 'price-low') {
    items.sort((a, b) => (a.askingPrice || a.budget || 0) - (b.askingPrice || b.budget || 0));
  } else if (state.sortBy === 'price-high') {
    items.sort((a, b) => (b.askingPrice || b.budget || 0) - (a.askingPrice || a.budget || 0));
  } else if (state.sortBy === 'popular') {
    items.sort((a, b) => (b.views || 0) - (a.views || 0) || listingCreatedAt(b) - listingCreatedAt(a));
  }

  const cntSale = el.forSaleCount();
  const cntWtb = el.wtbCount();
  if (cntSale) cntSale.textContent = state.forSaleListings.length;
  if (cntWtb) cntWtb.textContent = state.wtbListings.length;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center space-y-3 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800">
        <i class="ph-duotone ph-magnifying-glass text-4xl text-slate-400"></i>
        <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">${state.lang === 'en' ? 'No results found' : 'Sonuç bulunamadı'}</h3>
        <p class="text-xs text-slate-500 max-w-sm mx-auto">${state.lang === 'en' ? 'Try a different filter or create a new listing.' : 'Farklı bir filtre deneyabilir veya yeni bir ilan oluşturabilirsiniz.'}</p>
        <button id="empty-create-listing-btn" class="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-all">${t().btnCreateListing} →</button>
      </div>
    `;
    document.getElementById('empty-create-listing-btn')?.addEventListener('click', openCreateListingModal);
    return;
  }

  container.innerHTML = items.map(item => isSale ? renderSaleSquareCard(item) : renderWtbSquareCard(item)).join('');

  container.querySelectorAll('.project-card').forEach((card, index) => {
    card.style.setProperty('--sy-card-index', String(index));
    bindPointerTilt(card, 1.8, 2.6);
  });

  // Attach Click Handlers to All Cards in Grid
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.share-btn')) return;
      if (e.target.closest('.dm-direct-btn')) return;
      const id = card.dataset.id;
      const allItems = [...state.forSaleListings, ...state.wtbListings];
      const listing = allItems.find(i => i.id === id);
      if (listing) openProjectDetailModal(listing);
    });
  });

  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const allItems = [...state.forSaleListings, ...state.wtbListings];
      const listing = allItems.find(i => i.id === id);
      if (listing) openShareCardModal(listing);
    });
  });

  document.querySelectorAll('.dm-direct-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const allItems = [...state.forSaleListings, ...state.wtbListings];
      const listing = allItems.find(i => i.id === id);
      if (listing) openInboxWithMessage(listing);
    });
  });
}

// Render Individual Sale Project Card (Square Aspect Ratio & Bilingual)
function renderSaleSquareCard(p) {
  const dict = t();
  const title = state.lang === 'en' ? (p.titleEn || p.title) : p.title;
  const desc = state.lang === 'en' ? (p.shortDescEn || p.shortDesc) : p.shortDesc;
  const categoryLabel = state.lang === 'en' ? (p.categoryEn || p.category) : p.category;
  const formattedPrice = p.askingPrice ? `$${p.askingPrice.toLocaleString('en-US')}` : '$450';
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(desc);
  const safeCategory = escapeHtml(String(categoryLabel || '').toUpperCase());
  const sellerName = escapeHtml(p.seller?.name || 'Verified Seller');
  const sellerAvatar = safeImageUrl(p.seller?.avatar);
  const coverImage = safeImageUrl(p.coverImage);

  return `
    <div data-id="${p.id}" class="project-card glass-card glass-card-hover rounded-3xl overflow-hidden cursor-pointer flex flex-col justify-between group border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0D131F] shadow-sm transition-all duration-300">
      <div>
        <!-- Square Image Cover Container -->
        <div class="relative w-full aspect-square overflow-hidden bg-slate-100 dark:bg-slate-900">
          <img src="${coverImage}" alt="${safeTitle}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>
          
          <!-- Category Pill -->
          <div class="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            <span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-slate-900/90 text-white backdrop-blur-md border border-white/10 flex items-center gap-1">
              <i class="ph-bold ph-tag"></i> ${safeCategory}
            </span>
            ${p.isBoosted ? `<span class="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-400 text-slate-950 flex items-center gap-1"><i class="ph-bold ph-trend-up"></i>${state.lang === 'en' ? 'BOOSTED' : 'ÖNE ÇIKAN'}</span>` : ''}
            ${p.managedBySearya ? `<span class="px-2.5 py-1 rounded-lg text-[10px] font-black bg-blue-500 text-white flex items-center gap-1"><i class="ph-bold ph-info"></i>SHOWCASE · SEARYA MANAGED</span>` : ''}
            ${p.isAnonymous ? `
              <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/90 text-slate-950 backdrop-blur-md flex items-center gap-1 shadow-sm">
                <i class="ph-bold ph-user-ghost"></i> ${dict.anonBadge}
              </span>
            ` : ''}
          </div>

          <!-- PROMINENT PRICE BADGE (Top Right) -->
          <div class="absolute top-3 right-3 z-10">
            <span class="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500 text-slate-950 shadow-lg backdrop-blur-md border border-emerald-400/40">
              ${formattedPrice}
            </span>
          </div>

          <!-- Overlay Seller Info & Title -->
          <div class="absolute bottom-3 left-3 right-3 space-y-1.5 text-white z-10">
            <div class="flex items-center gap-2">
              <img src="${sellerAvatar}" alt="Seller" class="w-5 h-5 rounded-full object-cover border border-white/40">
              <span class="text-[11px] font-medium text-slate-200 truncate max-w-[120px]">${sellerName}</span>
              ${p.seller.githubVerified ? `
                <i class="ph-fill ph-check-circle text-emerald-400 text-xs"></i>
              ` : ''}
            </div>

            <h3 class="text-base font-extrabold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
              ${safeTitle}
            </h3>
          </div>
        </div>

        <div class="p-4 space-y-2.5">
          <p class="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 font-normal leading-relaxed">
            ${safeDesc}
          </p>

          <div class="flex flex-wrap gap-1 pt-1">
            ${p.techStack.slice(0, 3).map(tech => `
              <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                ${escapeHtml(tech)}
              </span>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="p-4 pt-0 flex items-center justify-between gap-2">
        <span class="text-[10px] text-slate-400 flex items-center gap-1" title="${state.lang === 'en' ? 'Views' : 'Görüntülenme'}"><i class="ph-bold ph-eye"></i>${(p.views || 0).toLocaleString('en-US')}</span>
        <button data-id="${p.id}" class="share-btn p-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-white hover:bg-emerald-50 text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700/60 transition-all" title="${dict.btnShareCard}">
          <i class="ph-bold ph-share-network text-emerald-500 text-sm"></i>
        </button>

        <button data-id="${p.id}" class="dm-direct-btn flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm">
          <i class="ph-bold ph-paper-plane-tilt"></i>
          <span>${dict.btnSendMessage}</span>
        </button>
      </div>
    </div>
  `;
}

// Render WTB Card (Square Aspect Ratio & Bilingual)
function renderWtbSquareCard(w) {
  const dict = t();
  const title = state.lang === 'en' ? (w.titleEn || w.title) : w.title;
  const desc = state.lang === 'en' ? (w.descriptionEn || w.description) : w.description;
  const formattedBudget = w.budget ? `$${w.budget.toLocaleString('en-US')}` : '$500 - $1,000';
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(desc);
  const buyerName = escapeHtml(w.buyer?.name || 'Verified Buyer');
  const buyerAvatar = safeImageUrl(w.buyer?.avatar);
  const techPreference = escapeHtml(state.lang === 'en' ? (w.techPreferenceEn || w.techPreference) : w.techPreference);

  return `
    <div data-id="${w.id}" class="project-card glass-card glass-card-hover rounded-3xl p-5 cursor-pointer flex flex-col justify-between space-y-4 border-2 border-indigo-500/30 bg-gradient-to-br from-white via-indigo-50/20 to-white dark:from-[#0D131F] dark:via-indigo-950/20 dark:to-[#0D131F] shadow-sm transition-all duration-300">
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5"><span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white flex items-center gap-1 shadow-sm"><i class="ph-bold ph-target"></i> ${dict.wtbBadge}</span></div>
          <span class="px-3 py-1 rounded-xl text-xs font-black bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40">
            ${formattedBudget}
          </span>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <img src="${buyerAvatar}" alt="Buyer" class="w-7 h-7 rounded-full object-cover border border-indigo-300">
          <div>
            <span class="text-xs font-bold text-slate-900 dark:text-white block">${buyerName}</span>
          </div>
        </div>

        <h3 class="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
          ${safeTitle}
        </h3>
        <p class="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
          ${safeDesc}
        </p>

        <div class="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] flex items-center justify-between text-slate-700 dark:text-slate-300">
          <div class="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
            <i class="ph-bold ph-code"></i> ${techPreference}
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between gap-2 pt-2">
        <span class="text-[10px] text-slate-400 flex items-center gap-1" title="${state.lang === 'en' ? 'Views' : 'Görüntülenme'}"><i class="ph-bold ph-eye"></i>${(w.views || 0).toLocaleString('en-US')}</span>
        <button data-id="${w.id}" class="share-btn px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700/60 transition-all">
          <i class="ph-bold ph-share-network text-indigo-500"></i>
          <span>${dict.btnShareCard}</span>
        </button>

        <button data-id="${w.id}" class="dm-direct-btn flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all">
          <i class="ph-bold ph-paper-plane-tilt"></i>
          <span>${dict.btnSendOffer}</span>
        </button>
      </div>
    </div>
  `;
}

// Project Detail Modal
function openProjectDetailModal(p) {
  const dict = t();
  const isSale = p.type === 'sale' || p.askingPrice;
  const title = state.lang === 'en' ? (p.titleEn || p.title) : p.title;
  const desc = state.lang === 'en' ? (p.fullDescEn || p.fullDesc || p.descriptionEn || p.description) : (p.fullDesc || p.description);
  const isVerified = p.isVerified === true || p.status === 'Doğrulanmış' || p.statusEn === 'Verified';
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(desc);
  const profile = p.seller || p.buyer || {};
  trackBehavior('listing_opened', { listingId: p.id, listingTitle: title, listingType: isSale ? 'sale' : 'wtb' });
  p.views = (p.views || 0) + 1;
  if (!p.viewRecorded && p.id) {
    p.viewRecorded = true;
    SearyaApi.recordListingView(p.id).then(result => { p.views = Number(result.views || p.views); }).catch(() => {});
  }
  const backdrop = el.modalBackdrop();
  const content = el.modalContent();
  if (!backdrop || !content) return;
  state.openListingSlug = p.slug || p.id || '';
  if (state.openListingSlug) {
    history.replaceState({}, '', `/projects/${encodeURIComponent(state.openListingSlug)}`);
  }

  content.innerHTML = `
    <div class="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-900 flex-shrink-0">
      <img src="${safeImageUrl(p.coverImage)}" alt="${safeTitle}" class="w-full h-full object-cover">
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
      <button id="close-modal-btn" aria-label="Close" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-slate-800 transition-all backdrop-blur-md">
        <i class="ph-bold ph-x text-lg"></i>
      </button>
      
      <div class="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${isSale ? 'bg-emerald-500 text-slate-950' : 'bg-indigo-600 text-white'}">
              ${isSale ? escapeHtml(state.lang === 'en' ? (p.categoryEn || p.category) : p.category) : (state.lang === 'en' ? 'LOOKING TO BUY' : 'PROJE ARIYORUM')}
            </span>
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800/90 text-white border border-slate-700">
              ${escapeHtml(state.lang === 'en' ? (p.statusEn || p.status || 'Active') : (p.status || 'Aktif'))}
            </span>
          </div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white">${safeTitle}</h2>
        </div>
        <div class="text-right">
          <span class="text-xs text-slate-400 block font-medium">${isSale ? (state.lang === 'en' ? 'Asking Price' : 'İstenen Fiyat') : (state.lang === 'en' ? 'Budget' : 'Bütçe')}</span>
          <span class="text-3xl font-extrabold text-emerald-400">$${(p.askingPrice || p.budget || 0).toLocaleString('en-US')}</span>
        </div>
      </div>
    </div>

    <div class="p-6 sm:p-8 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-6">
        <div>
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">${state.lang === 'en' ? 'About Project' : 'Proje Hakkında'}</h3>
          <p class="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">${safeDesc}</p>
        </div>

        <div class="space-y-3">
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400">Tech Stack & Services</h3>
          <div class="flex flex-wrap gap-2">
            ${(p.techStack || [p.techPreference || 'Next.js', 'Tailwind', 'Stripe']).map(t => `
              <span class="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700">
                ${escapeHtml(t)}
              </span>
            `).join('')}
          </div>
        </div>

        <div class="${isVerified ? '' : 'hidden'} p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
          <i class="ph-bold ph-shield-check text-xl text-emerald-600 dark:text-emerald-400 mt-0.5"></i>
          <div><strong class="block mb-1">Verification review completed</strong><span>Searya reviewed the evidence supplied for this listing. Buyers should still complete their own legal, technical and financial due diligence before payment.</span></div>
        </div>

        <div class="${isSale && !isVerified ? '' : 'hidden'} p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
          <i class="ph-bold ph-warning-circle text-base mt-0.5"></i>
          <span>${state.lang === 'en' ? 'This listing is not verified yet. Request revenue, repository and ownership evidence before making a payment.' : 'Bu ilan henüz doğrulanmadı. Ödeme öncesinde gelir, repo ve mülkiyet kanıtlarını isteyin.'}</span>
        </div>

        ${isSale ? `
          <div class="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span class="text-slate-400 block font-medium">${state.lang === 'en' ? 'Selling Reason' : 'Satış Nedeni'}</span>
              <span class="text-slate-800 dark:text-slate-200 font-semibold">${state.lang === 'en' ? (p.reasonForSellingEn || p.reasonForSelling || 'Strategic Pivot') : (p.reasonForSelling || 'Strateji Değişikliği')}</span>
            </div>
            <div>
              <span class="text-slate-400 block font-medium">${state.lang === 'en' ? 'Setup Time' : 'Kurulum Süresi'}</span>
              <span class="text-slate-800 dark:text-slate-200 font-semibold">~${p.setupTimeHours || 1} ${state.lang === 'en' ? 'hours' : 'saat'}</span>
            </div>
          </div>
        ` : `
          <div class="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 text-xs text-indigo-900 dark:text-indigo-200">
            <span class="font-bold block">${state.lang === 'en' ? 'MRR Requirement:' : 'MRR Şartı:'}</span>
            <span>${state.lang === 'en' ? (p.mrrRequirementEn || p.mrrRequirement) : p.mrrRequirement}</span>
          </div>
        `}
      </div>

      <div class="space-y-6">
        <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">${isSale ? (state.lang === 'en' ? 'Seller Profile' : 'Satıcı Profili') : (state.lang === 'en' ? 'Buyer Profile' : 'Alıcı Profili')}</h4>
          
          <div class="flex items-center gap-3">
            <img src="${safeImageUrl(profile.avatar)}" alt="Dev" class="w-12 h-12 rounded-2xl object-cover border border-slate-300 dark:border-slate-700">
            <div>
              <h5 class="text-sm font-bold text-slate-900 dark:text-white">${escapeHtml(profile.name)}</h5>
              <span class="text-xs text-slate-500 dark:text-slate-400">${escapeHtml(profile.handle || '@builder')}</span>
            </div>
          </div>

          <button id="modal-send-dm-btn" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all">
            <i class="ph-bold ph-paper-plane-tilt text-lg"></i>
            <span>${isSale ? dict.btnSendMessage : dict.btnSendOffer}</span>
          </button>

          <button id="modal-share-card-btn" class="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all">
            <i class="ph-bold ph-share-network text-emerald-500 text-base"></i>
            <span>${dict.btnShareCardCreate}</span>
          </button>

          <button id="modal-report-btn" class="w-full py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold text-xs flex items-center justify-center gap-2 transition-all">
            <i class="ph-bold ph-flag text-base"></i>
            <span>${state.lang === 'en' ? 'Report listing' : 'İlanı şikâyet et'}</span>
          </button>
          ${p.ownerId && p.ownerId !== state.currentUser?.id ? `<button id="modal-block-btn" class="w-full py-2 text-slate-500 hover:text-red-500 text-[11px] font-semibold"><i class="ph-bold ph-user-minus mr-1"></i>${state.lang === 'en' ? 'Block this user' : 'Bu kullanıcıyı engelle'}</button>` : ''}
        </div>
      </div>
    </div>
  `;

  backdrop.classList.remove('hidden');

  document.getElementById('close-modal-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-send-dm-btn')?.addEventListener('click', () => {
    closeModal();
    openInboxWithMessage(p);
  });
  document.getElementById('modal-share-card-btn')?.addEventListener('click', () => {
    closeModal();
    openShareCardModal(p);
  });
  document.getElementById('modal-report-btn')?.addEventListener('click', () => openReportModal(p));
  document.getElementById('modal-block-btn')?.addEventListener('click', async () => {
    if (!requireAuthenticated()) return;
    try {
      await SearyaApi.block(p.ownerId);
      closeModal();
      showToast(state.lang === 'en' ? 'User blocked.' : 'Kullanıcı engellendi.');
    } catch (error) { showToast(apiErrorMessage(error)); }
  });
}

function closeModal() {
  if (activeBehaviorFlow?.type === 'listing') abandonBehaviorFlow('modal_closed');
  const backdrop = el.modalBackdrop();
  if (backdrop) backdrop.classList.add('hidden');
  if (state.openListingSlug) {
    state.openListingSlug = '';
    history.replaceState({}, '', '/');
  }
}

async function openListingFromUrl() {
  const pageUrl = new URL(window.location.href);
  const routeMatch = pageUrl.pathname.match(/^\/projects\/([^/]+)\/?$/);
  const slug = routeMatch ? decodeURIComponent(routeMatch[1]) : pageUrl.searchParams.get('listing');
  if (!slug) return;
  const local = [...state.forSaleListings, ...state.wtbListings].find(item => item.slug === slug || item.id === slug);
  if (local) return openProjectDetailModal(local);
  try {
    const result = await SearyaApi.listing(slug);
    if (result.listing) openProjectDetailModal(result.listing);
  } catch {
    showToast(state.lang === 'en' ? 'The shared listing could not be found.' : 'Paylaşılan ilan bulunamadı.');
  }
}

function openReportModal(listing) {
  if (!requireAuthenticated()) return;
  const isEn = state.lang === 'en';
  const backdrop = el.modalBackdrop();
  const content = el.modalContent();
  if (!backdrop || !content) return;
  state.openListingSlug = '';
  content.innerHTML = `
    <form id="report-form" class="p-6 sm:p-8 space-y-5">
      <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4"><div><h3 class="text-xl font-black text-slate-900 dark:text-white">${isEn ? 'Report listing' : 'İlanı şikâyet et'}</h3><p class="text-xs text-slate-500 mt-1">${escapeHtml(listing.title)}</p></div><button type="button" id="close-report-modal" aria-label="Close" class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"><i class="ph-bold ph-x"></i></button></div>
      <div><label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">${isEn ? 'Reason' : 'Şikâyet nedeni'}</label><textarea id="report-reason" minlength="10" maxlength="500" required rows="4" class="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm" placeholder="${isEn ? 'Describe the misleading or unsafe content…' : 'Yanıltıcı veya güvensiz içeriği açıklayın…'}"></textarea></div>
      <button type="submit" class="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm">${isEn ? 'Send report' : 'Şikâyeti gönder'}</button>
    </form>`;
  backdrop.classList.remove('hidden');
  document.getElementById('close-report-modal')?.addEventListener('click', closeModal);
  document.getElementById('report-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      await SearyaApi.report({ targetType: 'listing', targetId: listing.id, reason: document.getElementById('report-reason')?.value || '' });
      closeModal();
      showToast(isEn ? 'Report received.' : 'Şikâyetiniz incelemeye alındı.');
    } catch (error) { showToast(apiErrorMessage(error)); }
  });
}

// Interactive Social Media Share Card Generator Modal
function openShareCardModal(p) {
  trackBehavior('button_clicked', { action: 'share_card_opened', listingId: p.id, listingTitle: p.title });
  const isSale = p.type === 'sale' || p.askingPrice;
  let activeFormat = 'twitter';
  const shareUrl = `${window.location.origin}/projects/${encodeURIComponent(p.slug || p.id)}`;
  const backdrop = el.modalBackdrop();
  const content = el.modalContent();
  if (!backdrop || !content) return;

  const updateCardPreview = () => {
    const cardTitle = p.title || "AI SaaS Platform";
    const priceText = isSale ? `$${(p.askingPrice || 450).toLocaleString('en-US')}` : `$${(p.budget || 500).toLocaleString('en-US')} – $1,000`;
    const techPills = (p.techStack || ['Next.js', 'Tailwind CSS', 'Supabase', 'Stripe']).slice(0, 4);

    const isPurple = isSale;
    const badgeBg = isPurple ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white';
    const badgeText = isPurple ? 'FOR SALE' : 'LOOKING TO BUY';
    const badgeIcon = isPurple ? 'ph-bold ph-rocket' : 'ph-bold ph-target';

    const cardHtml = `
      <div class="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
        
        <div class="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl ${isPurple ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'} flex items-center justify-center text-2xl shadow-sm">
              <i class="ph-bold ${isPurple ? 'ph-shopping-bag' : 'ph-magnifying-glass'}"></i>
            </div>
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider ${isPurple ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400'}">
                ${isPurple ? (state.lang === 'en' ? 'SALE LISTING SHARE CARD' : 'SATIŞ İLANI PAYLAŞIM KARTI') : (state.lang === 'en' ? 'BUYING REQUEST SHARE CARD' : 'ALIŞ İLANI PAYLAŞIM KARTI')}
              </span>
              <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                ${isPurple ? (state.lang === 'en' ? 'Selling this project!' : 'Bu projeyi satıyorum!') : (state.lang === 'en' ? 'Looking for this project!' : 'Bu projeyi arıyorum!')}
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ${isPurple ? (state.lang === 'en' ? 'Share to reach right cash buyers fast.' : 'Paylaş, doğru alıcıya daha hızlı ulaş.') : (state.lang === 'en' ? 'Share to get pitches from sellers directly.' : 'Paylaş, doğru satıcıdan teklif al.')}
              </p>
            </div>
          </div>

          <button id="close-share-modal" aria-label="Close" class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center transition-all">
            <i class="ph-bold ph-x text-lg"></i>
          </button>
        </div>

        <div class="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button data-format="twitter" class="format-tab-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeFormat === 'twitter' ? (isPurple ? 'bg-purple-600 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md') : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}">
            <i class="ph-bold ph-x-logo"></i>
            <span>X (Twitter) – 1200x675</span>
          </button>

          <button data-format="feed" class="format-tab-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeFormat === 'feed' ? (isPurple ? 'bg-purple-600 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md') : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}">
            <i class="ph-bold ph-instagram-logo"></i>
            <span>Instagram (Feed) – 1080x1080</span>
          </button>

          <button data-format="story" class="format-tab-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeFormat === 'story' ? (isPurple ? 'bg-purple-600 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md') : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}">
            <i class="ph-bold ph-device-mobile"></i>
            <span>Instagram Story – 1080x1920</span>
          </button>

          <button data-format="whatsapp" class="format-tab-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeFormat === 'whatsapp' ? (isPurple ? 'bg-purple-600 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md') : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}">
            <i class="ph-bold ph-whatsapp-logo"></i>
            <span>WhatsApp – 1024x1024</span>
          </button>
        </div>

        <div class="relative w-full rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl transition-all duration-300 ${
          isPurple 
            ? 'bg-gradient-to-br from-[#120B24] via-[#1A1038] to-[#0A0518] text-white border border-purple-500/30' 
            : 'bg-gradient-to-br from-[#061F16] via-[#0B2E21] to-[#04120D] text-white border border-emerald-500/30'
        } ${
          activeFormat === 'twitter' ? 'aspect-twitter' : activeFormat === 'feed' ? 'aspect-feed' : activeFormat === 'story' ? 'aspect-story' : 'aspect-whatsapp'
        } flex flex-col justify-between">
          
          <div class="flex items-center justify-between">
            <span class="px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${badgeBg} flex items-center gap-1.5 shadow-md">
              <i class="${badgeIcon}"></i> ${badgeText}
            </span>

            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg ${isPurple ? 'bg-purple-600' : 'bg-emerald-600'} flex items-center justify-center text-white text-xs font-black">S</div>
              <span class="font-extrabold text-sm text-white tracking-tight">Searya</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-auto">
            <div class="${isSale ? 'md:col-span-7' : 'md:col-span-12'} space-y-3">
              <h2 class="text-2xl sm:text-3xl font-black text-white leading-tight">${cardTitle}</h2>
              
              <div class="space-y-1">
                <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">${isSale ? (state.lang === 'en' ? 'ASKING PRICE' : 'FİYAT') : (state.lang === 'en' ? 'BUDGET' : 'BÜTÇE')}</span>
                <span class="text-3xl sm:text-4xl font-black ${isPurple ? 'text-purple-400' : 'text-emerald-400'}">${priceText}</span>
              </div>

              <div class="flex flex-wrap gap-2 pt-2">
                ${techPills.map(tech => `
                  <span class="px-3 py-1 rounded-xl text-xs font-bold bg-white/10 text-white backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                    <i class="ph-bold ph-code text-xs ${isPurple ? 'text-purple-400' : 'text-emerald-400'}"></i> ${tech}
                  </span>
                `).join('')}
              </div>
            </div>

            ${isSale ? `
              <div class="md:col-span-5 hidden md:block">
                <div class="rounded-2xl p-3 bg-slate-900/90 border border-slate-700/80 shadow-xl space-y-2">
                  <div class="flex items-center gap-1.5 pb-1 border-b border-slate-800">
                    <span class="w-2 h-2 rounded-full bg-red-500"></span>
                    <span class="w-2 h-2 rounded-full bg-yellow-500"></span>
                    <span class="w-2 h-2 rounded-full bg-green-500"></span>
                    <span class="text-[9px] text-slate-500 ml-2 font-mono">dashboard.app</span>
                  </div>
                  <img src="${p.coverImage || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80'}" class="w-full h-24 object-cover rounded-lg">
                </div>
              </div>
            ` : ''}
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-white/10">
            <span class="text-[10px] font-extrabold uppercase tracking-wider ${isPurple ? 'text-purple-300 bg-purple-500/20 border border-purple-500/40' : 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/40'} px-3 py-1 rounded-full flex items-center gap-1.5">
              <i class="ph-bold ph-check-circle"></i> ${isSale ? 'READY TO LAUNCH' : 'HEMEN ALMAYA HAZIRIM'}
            </span>

            <span class="text-xs font-bold text-slate-400 flex items-center gap-1">
              <i class="ph-bold ph-globe"></i> searya.com
            </span>
          </div>

        </div>

        <div class="space-y-3">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block">${state.lang === 'en' ? 'Preset Tweet / Caption Copy:' : 'Hazır Metin & Link:'}</label>
          <textarea id="tweet-textarea" readonly class="w-full h-24 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none">🔥 SEARYA ${badgeText}: ${cardTitle}\n💰 ${isSale ? 'Price' : 'Budget'}: ${priceText}\n🛠 Tech: ${techPills.join(', ')}\n👉 Details: ${shareUrl}\n#BuildInPublic #Searya #IndieHackers</textarea>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 pt-1">
          <button id="copy-tweet-btn" class="flex-1 py-3 rounded-xl bg-slate-900 text-white dark:bg-slate-800 hover:bg-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all">
            <i class="ph-bold ph-copy text-base"></i>
            <span>${state.lang === 'en' ? 'Copy Text & Link' : 'Metni & Linki Kopyala'}</span>
          </button>

          <a id="share-x-link" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`🔥 SEARYA ${badgeText}: ${cardTitle}\n💰 ${priceText}\n👉 Details: ${shareUrl}\n#BuildInPublic #Searya`)}" target="_blank" rel="noopener noreferrer" class="flex-1 py-3 rounded-xl ${isPurple ? 'bg-purple-600 hover:bg-purple-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all text-center">
            <i class="ph-bold ph-x-logo text-base"></i>
            <span>${state.lang === 'en' ? 'Share on X / Twitter' : 'X (Twitter)\'da Paylaş'}</span>
          </a>
        </div>
      </div>
    `;

    content.innerHTML = cardHtml;

    document.querySelectorAll('.format-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeFormat = btn.dataset.format;
        updateCardPreview();
      });
    });

    document.getElementById('close-share-modal')?.addEventListener('click', closeModal);
    document.getElementById('copy-tweet-btn')?.addEventListener('click', async () => {
      const text = document.getElementById('tweet-textarea').value;
      try {
        await navigator.clipboard.writeText(text);
        trackBehavior('listing_shared', { listingId: p.id, listingTitle: p.title, listingType: p.type || (p.askingPrice ? 'sale' : 'wtb'), action: 'copy' });
        showToast(t().toastCopied);
      } catch {
        document.getElementById('tweet-textarea')?.select();
        showToast(state.lang === 'en' ? 'Select and copy the text manually.' : 'Metni seçip manuel olarak kopyalayın.');
      }
    });
    document.getElementById('share-x-link')?.addEventListener('click', () => trackBehavior('listing_shared', { listingId: p.id, listingTitle: p.title, listingType: p.type || (p.askingPrice ? 'sale' : 'wtb'), action: 'x' }));
  };

  updateCardPreview();
  backdrop.classList.remove('hidden');
}

// Create Listing Modal
function openCreateListingModal(editListing = null) {
  if (editListing instanceof Event) editListing = null;
  if (!state.currentUser) {
    showToast('Create a free account or log in before posting a listing.');
    showOnboardingPage('register');
    return;
  }
  const dict = t();
  startBehaviorFlow('listing', { mode: editListing ? 'edit' : 'create', listingType: editListing?.type || 'undecided' });
  trackBehavior('listing_form_started', { mode: editListing ? 'edit' : 'create', listingType: editListing?.type || 'undecided' });
  let uploadedImageData = editListing?.coverImage || '';
  const backdrop = el.modalBackdrop();
  const content = el.modalContent();
  if (!backdrop || !content) return;

  content.innerHTML = `
    <!-- Header -->
    <div class="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0 bg-white dark:bg-[#0D131F]">
      <div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white">${editListing ? (state.lang === 'en' ? 'Edit listing' : 'İlanı düzenle') : dict.btnCreateListing}</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">${editListing ? (state.lang === 'en' ? 'Changes are reviewed again before publishing.' : 'Değişiklikler yayınlanmadan önce yeniden incelenir.') : (state.lang === 'en' ? 'Post your digital project or specify your buying criteria.' : 'Projenizi yeni sahipleriyle buluşturun veya ne satın almak istediğinizi yazın.')}</p>
      </div>
      <button id="close-create-modal" aria-label="Close" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center">
        <i class="ph-bold ph-x text-base"></i>
      </button>
    </div>

    <!-- Scrollable Form Body -->
    <form id="create-listing-form" class="flex-1 overflow-y-auto p-6 space-y-4">
      <div id="listing-type-selector" class="grid grid-cols-2 gap-3 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <label class="flex items-center justify-center gap-2 p-2.5 rounded-lg cursor-pointer font-bold text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 shadow-sm">
          <input type="radio" name="listingType" value="sale" checked class="accent-emerald-500">
          <i class="ph-bold ph-storefront text-emerald-500 text-base"></i>
          <span>${state.lang === 'en' ? 'Project For Sale' : 'Projemi Satıyorum'}</span>
        </label>
        <label class="flex items-center justify-center gap-2 p-2.5 rounded-lg cursor-pointer font-bold text-xs text-slate-600 dark:text-slate-400">
          <input type="radio" name="listingType" value="wtb" class="accent-emerald-500">
          <i class="ph-bold ph-magnifying-glass text-indigo-500 text-base"></i>
          <span>${state.lang === 'en' ? 'Looking to Buy (WTB)' : 'Proje Arıyorum (WTB)'}</span>
        </label>
      </div>

      <div>
        <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">${state.lang === 'en' ? 'Listing Title' : 'İlan Başlığı'}</label>
        <input type="text" id="form-title" required minlength="3" maxlength="100" placeholder="${state.lang === 'en' ? 'e.g. Next.js + OpenAI Content SaaS' : 'Örn: Next.js + OpenAI İçerik SaaS'}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500">
      </div>

      <div id="listing-basic-grid" class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">${state.lang === 'en' ? 'Category' : 'Kategori'}</label>
          <select id="form-category" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none">
            <option value="ai">${state.lang === 'en' ? 'AI Tool' : 'AI Projesi'}</option>
            <option value="saas">Micro SaaS</option>
            <option value="extension">Chrome Extension</option>
            <option value="mobile">${state.lang === 'en' ? 'Mobile App' : 'Mobil Uygulama'}</option>
            <option value="notion">Notion Template</option>
            <option value="ui-kit">UI Kit</option>
            <option value="api">Developer API</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">${state.lang === 'en' ? 'Price / Budget ($)' : 'Fiyat / Bütçe ($)'}</label>
          <input type="number" id="form-price" required min="1" max="10000000" step="1" placeholder="450" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500">
        </div>
      </div>

      <!-- IMAGE UPLOAD CONTAINER -->
      <div id="image-upload-wrapper" class="space-y-2">
        <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block flex items-center justify-between">
          <span class="flex items-center gap-2"><i class="ph-bold ph-image-square text-emerald-500 text-base"></i>${state.lang === 'en' ? 'Add Listing Image' : 'İlan Fotoğrafı Ekle'}</span>
          <span class="text-[10px] text-slate-400 font-normal">PNG, JPG, WebP · Max 5 MB</span>
        </label>
        
        <div class="border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-4 text-center hover:border-emerald-500 dark:hover:border-emerald-500 transition-all bg-slate-50 dark:bg-slate-900/50 cursor-pointer relative group">
          <input type="file" id="form-image-file" accept="image/png,image/jpeg,image/webp" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
          
          <div id="image-upload-preview-box" class="flex flex-col items-center justify-center space-y-2">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl">
              <i class="ph-bold ph-image-square"></i>
            </div>
            <p id="image-upload-status" class="text-xs font-semibold text-slate-700 dark:text-slate-300">
              ${state.lang === 'en' ? 'Click to choose a project image' : 'Proje görselini seçmek için tıklayın'}
            </p>
            <span class="text-[10px] text-slate-400">${state.lang === 'en' ? 'Use a clear screenshot of the actual product' : 'Ürünün gerçek ve net bir ekran görüntüsünü kullanın'}</span>
          </div>
        </div>
      </div>

      <div>
        <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Tech Stack</label>
        <input type="text" id="form-stack" required minlength="2" maxlength="200" placeholder="Next.js 14, Tailwind, OpenAI API, Supabase" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500">
      </div>

      <div>
        <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">${state.lang === 'en' ? 'Description & Details' : 'Kısa Açıklama & Detaylar'}</label>
        <textarea id="form-desc" rows="3" required minlength="20" maxlength="2000" placeholder="${state.lang === 'en' ? 'What does the project do? Why are you selling?' : 'Proje ne iş yapar? Neden satıyorsunuz?'}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"></textarea>
      </div>

      <!-- Action Footer -->
      <div class="pt-4 border-t border-slate-200 dark:border-slate-800">
        <p id="listing-form-status" class="hidden mb-3 rounded-xl px-3 py-2.5 text-xs font-bold" role="status" aria-live="polite"></p>
        <button type="submit" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
          <i class="ph-bold ph-paper-plane-tilt text-base"></i>
          <span>${editListing ? (state.lang === 'en' ? 'Save changes' : 'Değişiklikleri kaydet') : (state.lang === 'en' ? 'Publish Listing' : 'İlanı Yayınla')}</span>
        </button>
      </div>
    </form>
  `;

  backdrop.classList.remove('hidden');

  if (editListing) {
    document.querySelector(`input[name="listingType"][value="${editListing.type}"]`)?.click();
    document.querySelectorAll('input[name="listingType"]').forEach(input => { input.disabled = true; });
    document.getElementById('form-title').value = editListing.title || '';
    document.getElementById('form-category').value = editListing.category || 'saas';
    document.getElementById('form-price').value = editListing.askingPrice || editListing.budget || '';
    document.getElementById('form-stack').value = (editListing.techStack || []).join(', ');
    document.getElementById('form-desc').value = editListing.description || editListing.shortDesc || '';
    if (editListing.type === 'sale' && uploadedImageData) {
      document.getElementById('image-upload-preview-box').innerHTML = `<img src="${safeImageUrl(uploadedImageData)}" class="h-20 w-auto rounded-xl object-cover shadow-md mx-auto border border-emerald-500"><span class="text-xs text-emerald-500 font-bold">${state.lang === 'en' ? 'Current image' : 'Mevcut görsel'}</span>`;
    }
    if (editListing.type === 'wtb') document.getElementById('image-upload-wrapper')?.classList.add('hidden');
  }

  const typeRadios = document.querySelectorAll('input[name="listingType"]');
  const imageWrapper = document.getElementById('image-upload-wrapper');

  typeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'wtb') {
        if (imageWrapper) imageWrapper.classList.add('hidden');
      } else {
        if (imageWrapper) imageWrapper.classList.remove('hidden');
      }
    });
  });

  const fileInput = document.getElementById('form-image-file');
  const previewBox = document.getElementById('image-upload-preview-box');
  const formStatus = document.getElementById('listing-form-status');
  const setFormStatus = (message, type = 'info') => {
    if (!formStatus) return;
    formStatus.textContent = message;
    const color = type === 'error' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300' : type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300';
    formStatus.className = `mb-3 rounded-xl px-3 py-2.5 text-xs font-bold ${color}`;
  };

  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        if (previewBox) previewBox.innerHTML = `<i class="ph-bold ph-circle-notch animate-spin text-2xl text-emerald-500"></i><span class="text-xs text-slate-500">${state.lang === 'en' ? 'Optimizing image…' : 'Görsel optimize ediliyor…'}</span>`;
        try {
          uploadedImageData = await optimizeListingImage(file);
          if (previewBox) {
            previewBox.innerHTML = `
              <img src="${uploadedImageData}" class="h-20 w-auto rounded-xl object-cover shadow-md mx-auto border border-emerald-500">
              <span class="text-xs text-emerald-500 font-bold flex items-center gap-1"><i class="ph-bold ph-check"></i> ${state.lang === 'en' ? 'Image ready' : 'Görsel hazır'}</span>
            `;
          }
          setFormStatus(state.lang === 'en' ? 'Image optimized and ready to publish.' : 'Görsel optimize edildi ve yayına hazır.', 'success');
        } catch (error) {
          e.target.value = '';
          uploadedImageData = '';
          setFormStatus(error.message, 'error');
        }
      }
    });
  }

  document.getElementById('close-create-modal')?.addEventListener('click', closeModal);
  document.getElementById('create-listing-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = document.querySelector('input[name="listingType"]:checked').value;
    const title = cleanUserText(document.getElementById('form-title').value, 100);
    const category = document.getElementById('form-category').value;
    const price = parseFloat(document.getElementById('form-price').value);
    const stack = document.getElementById('form-stack').value.split(',').map(s => cleanUserText(s, 40)).filter(Boolean).slice(0, 8);
    const desc = cleanUserText(document.getElementById('form-desc').value, 2000);
    const finalImage = safeImageUrl(uploadedImageData);

    if (!title || !Number.isFinite(price) || price <= 0 || stack.length === 0 || desc.length < 20) {
      setFormStatus(state.lang === 'en' ? 'Please complete all required fields correctly.' : 'Lütfen zorunlu alanları doğru şekilde doldurun.', 'error');
      return;
    }
    if (type === 'sale' && !uploadedImageData) {
      setFormStatus(state.lang === 'en' ? 'Please add a real project image.' : 'Lütfen projeye ait gerçek bir ilan fotoğrafı ekleyin.', 'error');
      return;
    }

    if (!requireAuthenticated()) return;
    trackBehavior('listing_submit_attempted', { mode: editListing ? 'edit' : 'create', listingType: type, category });
    const submitButton = e.currentTarget.querySelector('button[type="submit"]');
    const originalButtonHtml = submitButton?.innerHTML || '';
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add('opacity-70', 'cursor-wait');
      submitButton.innerHTML = `<i class="ph-bold ph-circle-notch animate-spin text-base"></i><span>${state.lang === 'en' ? 'Submitting…' : 'Gönderiliyor…'}</span>`;
    }
    setFormStatus(state.lang === 'en' ? 'Your listing is being submitted securely…' : 'İlanınız güvenli biçimde gönderiliyor…');
    try {
      const listingPayload = {
        type,
        title,
        category,
        price,
        techStack: stack,
        description: desc,
        coverImage: finalImage
      };
      const result = editListing ? await SearyaApi.updateListing(editListing.id, listingPayload) : await SearyaApi.createListing(listingPayload);
      if (result.user) applyAuthenticatedUser(result.user);
      trackBehavior('listing_submit_succeeded', { mode: editListing ? 'edit' : 'create', listingType: type, category, listingId: result.listing?.id || editListing?.id || '' });
      completeBehaviorFlow('listing');
      closeModal();
      if (editListing) {
        await hydrateBackendState();
        await openAccountModal({ notice: state.lang === 'en' ? 'Your changes were saved and sent for review.' : 'Değişiklikleriniz kaydedildi ve yeniden incelemeye gönderildi.' });
        return;
      }
      if (result.moderation === 'approved') {
        if (type === 'sale') state.forSaleListings.unshift(result.listing);
        else state.wtbListings.unshift(result.listing);
        switchTab(type === 'sale' ? 'sale' : 'wtb');
        renderWeeklyPicks();
        showToast(t().toastPublished);
        await openAccountModal({ notice: state.lang === 'en' ? 'Your listing is now live.' : 'İlanınız başarıyla yayınlandı.' });
      } else {
        await openAccountModal({ notice: state.lang === 'en' ? 'Your listing is visible below with “Pending review” status. It will appear publicly after approval.' : 'İlanınız aşağıda “Onay bekliyor” durumuyla görünüyor. Yönetici onayından sonra herkese açık yayınlanacak.' });
      }
    } catch (error) {
      trackBehavior('listing_submit_failed', { mode: editListing ? 'edit' : 'create', listingType: type, category, code: error?.code || 'request_failed' });
      if (error instanceof ApiError && error.code === 'FREE_LAUNCH_LISTING_LIMIT') {
        setFormStatus(apiErrorMessage(error), 'error');
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.classList.remove('opacity-70', 'cursor-wait');
          submitButton.innerHTML = originalButtonHtml;
        }
      } else if (error instanceof ApiError && error.code === 'LISTING_CREDIT_REQUIRED') {
        closeModal();
        openPackagePurchaseModal(state.lang === 'en' ? '3 Listing Pack' : '3 İlan Paketi', '$9', 'seller_listings_3');
      } else {
        setFormStatus(apiErrorMessage(error), 'error');
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.classList.remove('opacity-70', 'cursor-wait');
          submitButton.innerHTML = originalButtonHtml;
        }
      }
    }
  });
}

// DEDICATED MULTI-THREAD INBOX MESSAGING DRAWER SYSTEM
async function loadThreadsFromApi() {
  if (!state.currentUser) return;
  const result = await SearyaApi.threads();
  state.messages = result.threads || [];
  if (result.user) applyAuthenticatedUser(result.user);
  if (!state.messages.some(thread => thread.id === state.activeThreadId)) state.activeThreadId = state.messages[0]?.id || '';
}

async function markActiveThreadRead() {
  const activeThread = state.messages.find(thread => thread.id === state.activeThreadId);
  if (!activeThread?.unread) return;
  const result = await SearyaApi.markThreadRead(activeThread.id);
  activeThread.unread = false;
  activeThread.unreadCount = 0;
  state.unreadMessageCount = Number(result?.unreadCount || 0);
  updateUnreadMessageBadge();
}

async function toggleInboxDrawer() {
  const drawer = el.inboxDrawer();
  if (!drawer) return;

  if (drawer.classList.contains('translate-x-full')) {
    if (!requireAuthenticated()) return;
    state.inboxOpen = true;
    try {
      await loadThreadsFromApi();
      await markActiveThreadRead();
      renderInboxDrawerContent();
    } catch (error) {
      showToast(apiErrorMessage(error));
      state.inboxOpen = false;
      return;
    }
    drawer.classList.remove('translate-x-full');
  } else {
    state.inboxOpen = false;
    drawer.classList.add('translate-x-full');
  }
}

async function openInboxWithMessage(listing) {
  trackBehavior('conversation_attempted', { listingId: listing.id, listingTitle: listing.title, listingType: listing.type || (listing.askingPrice ? 'sale' : 'wtb') });
  if (!requireAuthenticated()) {
    trackBehavior('conversation_failed', { listingId: listing.id, code: 'authentication_required' });
    return;
  }
  try {
    const starter = state.lang === 'en' ? `Hi! I am interested in ${listing.title}. Is it still available?` : `Selam! ${listing.title} ilanı ile ilgileniyorum. Hâlâ müsait mi?`;
    const result = await SearyaApi.startThread(listing.id, starter);
    if (result.user) applyAuthenticatedUser(result.user);
    await loadThreadsFromApi();
    state.activeThreadId = result.threadId;
    state.inboxOpen = true;
    renderInboxDrawerContent();
    el.inboxDrawer()?.classList.remove('translate-x-full');
    trackBehavior('conversation_started_client', { listingId: listing.id, listingTitle: listing.title });
  } catch (error) {
    trackBehavior('conversation_failed', { listingId: listing.id, code: error?.code || 'request_failed' });
    if (error instanceof ApiError && error.code === 'FREE_LAUNCH_CONNECTION_LIMIT') showToast(apiErrorMessage(error));
    else if (error instanceof ApiError && error.code === 'CONNECTION_CREDIT_REQUIRED') openBuyerConnectionPack();
    else showToast(apiErrorMessage(error));
  }
}

function updateBuyerCreditBadge() {
  persistClientState();
  const badge = document.getElementById('buyer-credit-count');
  if (!badge) return;
  const signedIn = Boolean(state.currentUser);
  badge.classList.toggle('hidden', !signedIn);
  badge.classList.toggle('flex', signedIn);
  badge.textContent = state.buyerConnections > 99 ? '99+' : String(state.buyerConnections);
  const label = state.lang === 'en'
    ? `${state.buyerConnections} new seller connections remaining`
    : `${state.buyerConnections} yeni satıcı bağlantısı kaldı`;
  badge.setAttribute('aria-label', label);
  el.inboxBtn()?.setAttribute('title', signedIn ? label : 'Messages');
}

function updateUnreadMessageBadge() {
  const badge = document.getElementById('unread-message-count');
  if (!badge) return;
  const count = Math.max(0, Number(state.unreadMessageCount || 0));
  badge.textContent = count > 99 ? '99+' : String(count);
  badge.classList.toggle('hidden', count === 0);
  badge.classList.toggle('flex', count > 0);
  el.inboxBtn()?.setAttribute('aria-label', state.lang === 'en' ? `Messages, ${count} unread` : `Mesajlarım, ${count} okunmamış`);
}

function openBuyerConnectionPack() {
  if (state.launchFree) {
    showToast(state.lang === 'en' ? 'You can start 10 new seller conversations every 30 days. Existing chats remain unlimited.' : 'Her 30 günde 10 yeni satıcı görüşmesi başlatabilirsiniz. Mevcut sohbetler sınırsızdır.');
    return;
  }
  const packageName = state.lang === 'en' ? '10 Connection Pack' : '10 Bağlantı Paketi';
  openPackagePurchaseModal(packageName, '$9', 'buyer_connections_10');
}

function renderInboxDrawerContent() {
  const drawer = el.inboxDrawer();
  if (!drawer) return;

  const dict = t();
  const activeThread = state.messages.find(m => m.id === state.activeThreadId) || state.messages[0];

  if (!activeThread) {
    drawer.innerHTML = `
      <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0D131F]"><div><h3 class="text-sm font-extrabold text-slate-900 dark:text-white">${dict.inboxTitle}</h3><p class="text-[10px] text-slate-500">${state.lang === 'en' ? 'Your conversations will appear here.' : 'Görüşmeleriniz burada görünecek.'}</p></div><button id="close-inbox-btn" aria-label="Close" class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"><i class="ph-bold ph-x"></i></button></div>
      <div class="flex-1 flex flex-col items-center justify-center p-8 text-center"><i class="ph-bold ph-chats-circle text-4xl text-blue-500"></i><h4 class="mt-3 text-sm font-black text-slate-900 dark:text-white">${state.lang === 'en' ? 'No conversations yet' : 'Henüz görüşme yok'}</h4><p class="mt-1 text-xs text-slate-500">${state.lang === 'en' ? 'Open a listing and contact its owner.' : 'Bir ilanı açıp ilan sahibiyle iletişime geçin.'}</p></div>`;
    document.getElementById('close-inbox-btn')?.addEventListener('click', toggleInboxDrawer);
    return;
  }

  drawer.innerHTML = `
    <!-- Header -->
    <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0D131F]">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-lg font-bold">
          <i class="ph-bold ph-chats"></i>
        </div>
        <div>
          <h3 class="text-sm font-extrabold text-slate-900 dark:text-white">${dict.inboxTitle}</h3>
          <p class="text-[10px] text-slate-500 dark:text-slate-400">${dict.inboxSubtitle} · <strong class="text-emerald-600 dark:text-emerald-400">${state.buyerConnections} ${state.lang === 'en' ? 'connections left' : 'bağlantı kaldı'}</strong></p>
        </div>
      </div>

      <button id="close-inbox-btn" aria-label="Close" class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all">
        <i class="ph-bold ph-x text-base"></i>
      </button>
    </div>

    <!-- Multi-Thread Conversation Switcher List -->
    <div class="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 overflow-x-auto flex items-center gap-2 no-scrollbar">
      ${state.messages.map(thread => `
        <button data-thread-id="${thread.id}" class="thread-tab-btn flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
          thread.id === activeThread.id
            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
        }">
          <img src="${safeImageUrl(thread.partnerAvatar)}" class="w-5 h-5 rounded-full object-cover">
          <span class="truncate max-w-[100px]">${escapeHtml(thread.partnerName)}</span>
          ${thread.unread ? `<span class="w-2 h-2 rounded-full bg-emerald-400"></span>` : ''}
        </button>
      `).join('')}
    </div>

    <!-- Safety Warning Banner -->
    <div class="p-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
      <i class="ph-bold ph-shield-warning text-base text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"></i>
      <div>
        <strong>${dict.inboxSafetyTitle}</strong> ${dict.inboxSafetyText}
      </div>
    </div>

    <!-- Active Chat Partner Header Bar -->
    <div class="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0D131F]">
      <div class="flex items-center gap-2.5">
        <img src="${safeImageUrl(activeThread.partnerAvatar)}" class="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-slate-700">
        <div>
          <h4 class="text-xs font-bold text-slate-900 dark:text-white">${escapeHtml(activeThread.partnerName)}</h4>
          <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">${escapeHtml(activeThread.projectTitle)} (${escapeHtml(activeThread.askingPrice)})</span>
        </div>
      </div>
      <span class="text-[10px] text-slate-400 font-medium">${state.lang === 'en' ? 'Active Handshake' : 'Aktif Görüşme'}</span>
    </div>

    <!-- Scrollable Messages Box -->
    <div class="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-[#080C14]/50" id="chat-messages-box">
      ${activeThread.messages.map(msg => `
        <div class="flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}">
          <div class="max-w-[85%] p-3 rounded-2xl text-xs font-normal ${
            msg.sender === 'me' 
              ? 'bg-emerald-600 text-white rounded-br-none shadow-sm' 
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm'
          }">
            ${escapeHtml(state.lang === 'en' ? (msg.textEn || msg.text) : msg.text)}
          </div>
          <span class="text-[9px] text-slate-400 mt-1 px-1">${msg.time}</span>
        </div>
      `).join('')}
    </div>

    <!-- Send Message Form -->
    <form id="dm-send-form" class="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2 bg-white dark:bg-[#0D131F]">
      <input type="text" id="dm-input" required placeholder="${dict.inboxPlaceholder}" class="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500">
      <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center shadow-md">
        <i class="ph-bold ph-paper-plane-right text-base"></i>
      </button>
    </form>
  `;

  document.getElementById('close-inbox-btn')?.addEventListener('click', toggleInboxDrawer);

  document.querySelectorAll('.thread-tab-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      state.activeThreadId = btn.dataset.threadId;
      try { await markActiveThreadRead(); } catch (error) { showToast(apiErrorMessage(error)); }
      renderInboxDrawerContent();
    });
  });

  const chatBox = document.getElementById('chat-messages-box');
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;

  document.getElementById('dm-send-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('dm-input');
    const text = input ? cleanUserText(input.value, 1000) : '';
    if (!text) return;
    const submitButton = e.currentTarget.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    try {
      const result = await SearyaApi.sendMessage(activeThread.id, text);
      activeThread.messages.push(result.message);
      if (input) input.value = '';
      renderInboxDrawerContent();
    } catch (error) {
      showToast(apiErrorMessage(error));
      if (submitButton) submitButton.disabled = false;
    }
  });
}

// Toast Notifications
function showToast(message) {
  const container = el.toastContainer();
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 flex items-center gap-2 animate-fade-in pointer-events-auto';
  toast.innerHTML = `<i class="ph-bold ph-check-circle text-emerald-400 text-base"></i> <span>${escapeHtml(message)}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// Dedicated Full-Screen Onboarding & Auth Card Manager
let authMode = 'login'; // 'login' | 'register'
let authRole = 'buyer';

function showOnboardingPage(mode = 'login') {
  authMode = mode === 'register' || mode === 1 ? 'register' : 'login';
  startBehaviorFlow('auth', { mode: authMode });
  trackBehavior('auth_started', { mode: authMode });
  const obView = document.getElementById('onboarding-fullview');
  const mainView = document.getElementById('main-app-view');

  if (obView && mainView) {
    closeModal();
    obView.classList.remove('hidden');
    obView.classList.add('flex');
    document.body.classList.add('onboarding-open');
  }

  renderAuthCard();
  window.setTimeout(() => document.getElementById('auth-email')?.focus(), 50);
}

function showMainAppPage(scrollToListings = false) {
  const obView = document.getElementById('onboarding-fullview');
  const mainView = document.getElementById('main-app-view');

  if (obView && mainView) {
    if (activeBehaviorFlow?.type === 'auth') abandonBehaviorFlow('auth_view_closed');
    obView.classList.add('hidden');
    obView.classList.remove('flex');
    mainView.classList.remove('hidden');
    mainView.classList.add('flex-col');
    document.body.classList.remove('onboarding-open');
    
    if (scrollToListings) {
      setTimeout(() => {
        const grid = document.getElementById('listings-grid');
        if (grid) grid.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }
}

function renderAuthCard() {
  const isEn = state.lang === 'en';
  const titleEl = document.getElementById('t-ob-card-title');
  const subEl = document.getElementById('t-ob-card-sub');
  const tabLogin = document.getElementById('ob-tab-login');
  const tabReg = document.getElementById('ob-tab-register');
  const formContainer = document.getElementById('ob-form-fields-container');

  if (!formContainer) return;
  updateSocialAuthAvailability();
  if (tabLogin) tabLogin.textContent = isEn ? 'Log In' : 'Giriş Yap';
  if (tabReg) tabReg.textContent = isEn ? 'Sign Up' : 'Kayıt Ol';
  const divider = document.getElementById('t-ob-divider');
  if (divider) divider.textContent = isEn ? 'or' : 'veya';

  const activeTabStyle = "py-2.5 rounded-xl font-extrabold text-xs transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm";
  const inactiveTabStyle = "py-2.5 rounded-xl font-semibold text-xs transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white";

  if (authMode === 'login') {
    if (titleEl) titleEl.textContent = isEn ? "Welcome to Searya! 👋" : "Searya'ya Hoş Geldiniz! 👋";
    if (subEl) subEl.textContent = isEn ? "Don't have an account? Sign up for free." : "Hesabınız yok mu? Hemen ücretsiz kayıt olun.";
    if (tabLogin) tabLogin.className = activeTabStyle;
    if (tabReg) tabReg.className = inactiveTabStyle;

    formContainer.innerHTML = `
      <form id="auth-form" class="space-y-4">
        <div>
          <label class="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">${isEn ? 'Email Address' : 'E-posta adresi'}</label>
          <div class="relative">
            <i class="ph-bold ph-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"></i>
            <input type="email" id="auth-email" required autocomplete="email" placeholder="${isEn ? 'example@email.com' : 'ornek@email.com'}" class="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-600 transition-colors">
          </div>
        </div>

        <div>
          <label class="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">${isEn ? 'Password' : 'Şifre'}</label>
          <div class="relative">
            <i class="ph-bold ph-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"></i>
            <input type="password" id="auth-password" required minlength="6" autocomplete="current-password" placeholder="${isEn ? 'Enter password' : 'Şifrenizi girin'}" class="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-600 transition-colors">
            <button type="button" id="toggle-pw-btn" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <i class="ph-bold ph-eye text-base"></i>
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between text-xs pt-1">
          <label class="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 font-medium">
            <input type="checkbox" checked class="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500">
            <span>${isEn ? 'Keep me logged in' : 'Oturumu açık tut'}</span>
          </label>
          <a href="#" id="forgot-password-link" class="font-bold text-purple-600 dark:text-purple-400 hover:underline">${isEn ? 'Forgot password?' : 'Şifremi unuttum?'}</a>
        </div>
        <p class="text-center text-[11px] text-slate-500 dark:text-slate-400">${isEn ? "Didn't receive verification email?" : 'Doğrulama e-postası gelmedi mi?'} <a href="#" id="resend-verification-link" class="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">${isEn ? 'Send again' : 'Tekrar gönder'}</a></p>

        <button type="submit" id="auth-submit-btn" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 transition-all transform active:scale-95 cursor-pointer">
          ${isEn ? 'Log In' : 'Giriş Yap'}
        </button>
        <p id="auth-form-status" class="hidden rounded-xl px-3 py-2.5 text-xs font-bold" role="status" aria-live="polite"></p>
      </form>
    `;
  } else {
    if (titleEl) titleEl.textContent = isEn ? "Create Your Account 🚀" : "Hesabınızı Oluşturun 🚀";
    if (subEl) subEl.textContent = isEn ? "Already registered? Switch to Login." : "Zaten hesabınız var mı? Giriş yapın.";
    if (tabReg) tabReg.className = activeTabStyle;
    if (tabLogin) tabLogin.className = inactiveTabStyle;

    formContainer.innerHTML = `
      <form id="auth-form" class="space-y-4">
        <div>
          <label class="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">${isEn ? 'Full Name' : 'Ad Soyad'}</label>
          <div class="relative">
            <i class="ph-bold ph-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"></i>
            <input type="text" id="auth-fullname" required minlength="2" maxlength="80" autocomplete="name" placeholder="${isEn ? 'Enter your full name' : 'Adınızı ve soyadınızı girin'}" class="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-600 transition-colors">
          </div>
        </div>

        <div>
          <label class="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">${isEn ? 'Email Address' : 'E-posta adresi'}</label>
          <div class="relative">
            <i class="ph-bold ph-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"></i>
            <input type="email" id="auth-email" required autocomplete="email" placeholder="${isEn ? 'example@email.com' : 'ornek@email.com'}" class="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-600 transition-colors">
          </div>
        </div>

        <div>
          <label class="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">${isEn ? 'Password' : 'Şifre'}</label>
          <div class="relative">
            <i class="ph-bold ph-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"></i>
            <input type="password" id="auth-password" required minlength="8" autocomplete="new-password" placeholder="${isEn ? 'Min 8 characters' : 'Şifrenizi girin (min 8 karakter)'}" class="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-600 transition-colors">
            <button type="button" id="toggle-pw-btn" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <i class="ph-bold ph-eye text-base"></i>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">${isEn ? 'Profile Role' : 'Profil Tipi'}</label>
          <div class="grid grid-cols-3 gap-2">
            <button type="button" data-role="buyer" class="auth-role-btn py-2 rounded-xl border-2 text-xs font-bold transition-all ${authRole === 'buyer' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}">🟢 ${isEn ? 'Buyer' : 'Alıcı'}</button>
            <button type="button" data-role="seller" class="auth-role-btn py-2 rounded-xl border-2 text-xs font-bold transition-all ${authRole === 'seller' ? 'border-purple-500 bg-purple-500/10 text-purple-600' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}">🟣 ${isEn ? 'Seller' : 'Satıcı'}</button>
            <button type="button" data-role="both" class="auth-role-btn py-2 rounded-xl border-2 text-xs font-bold transition-all ${authRole === 'both' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}">⚡ ${isEn ? 'Both' : 'İkisi de'}</button>
          </div>
        </div>

        <button type="submit" id="auth-submit-btn" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
          <span>${isEn ? 'Sign Up for Free 🎉' : 'Kayıt Ol & Ücretsiz Başla 🎉'}</span>
        </button>
        <p id="auth-form-status" class="hidden rounded-xl px-3 py-2.5 text-xs font-bold" role="status" aria-live="polite"></p>
      </form>
    `;

    document.querySelectorAll('.auth-role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        authRole = btn.dataset.role;

        const activeRoleClasses = {
          buyer: ['border-emerald-500', 'bg-emerald-500/10', 'text-emerald-600'],
          seller: ['border-purple-500', 'bg-purple-500/10', 'text-purple-600'],
          both: ['border-indigo-500', 'bg-indigo-500/10', 'text-indigo-600']
        };
        const inactiveRoleClasses = ['border-slate-200', 'dark:border-slate-800', 'text-slate-600', 'dark:text-slate-400'];
        const allRoleClasses = [...inactiveRoleClasses, ...Object.values(activeRoleClasses).flat()];

        document.querySelectorAll('.auth-role-btn').forEach(roleButton => {
          const selected = roleButton.dataset.role === authRole;
          roleButton.classList.remove(...allRoleClasses);
          roleButton.classList.add(...(selected ? activeRoleClasses[authRole] : inactiveRoleClasses));
          roleButton.setAttribute('aria-pressed', String(selected));
        });
      });
    });
  }

  // Password toggle
  document.getElementById('toggle-pw-btn')?.addEventListener('click', () => {
    const input = document.getElementById('auth-password');
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
  });

  // Form Submit Listener (Enter Key)
  applyAuthCooldown(document.getElementById('auth-submit-btn'), document.getElementById('auth-form-status'));
  document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      e.currentTarget.reportValidity();
      return;
    }
    const submitButton = document.getElementById('auth-submit-btn');
    const status = document.getElementById('auth-form-status');
    const email = document.getElementById('auth-email')?.value || '';
    const password = document.getElementById('auth-password')?.value || '';
    const attempt = consumeAuthAttempt();
    if (!attempt.allowed) {
      applyAuthCooldown(submitButton, status, attempt);
      return;
    }
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add('opacity-70', 'cursor-wait');
    }
    if (status) {
      status.textContent = authMode === 'register'
        ? (isEn ? 'Creating your account…' : 'Hesabınız oluşturuluyor…')
        : (isEn ? 'Signing you in…' : 'Giriş yapılıyor…');
      status.className = 'rounded-xl px-3 py-2.5 text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300';
    }
    try {
      const payload = authMode === 'register'
        ? await SearyaApi.register({ name: document.getElementById('auth-fullname')?.value || '', email, password, role: authRole })
        : await SearyaApi.login({ email, password });
      state.backendReady = true;
      if (payload.verificationRequired) {
        trackBehavior('auth_completed', { mode: authMode, role: authRole, step: 'verification_required' });
        completeBehaviorFlow('auth');
        showMainAppPage();
        openVerificationPendingModal(email);
        return;
      }
      applyAuthenticatedUser(payload.user);
      trackBehavior('auth_completed', { mode: authMode, role: payload.user?.role || authRole, step: 'signed_in' });
      completeBehaviorFlow('auth');
      showToast(authMode === 'login' ? (isEn ? 'Welcome back!' : 'Başarıyla giriş yapıldı!') : (isEn ? 'Your account is ready!' : 'Hesabınız başarıyla oluşturuldu!'));
      showMainAppPage();
    } catch (error) {
      trackBehavior('auth_failed', { mode: authMode, role: authMode === 'register' ? authRole : '', code: error?.code || 'request_failed' });
      const message = apiErrorMessage(error);
      if (status) {
        status.textContent = message;
        status.className = 'rounded-xl px-3 py-2.5 text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
      }
      showToast(message);
    } finally {
      if (submitButton) {
        submitButton.classList.remove('opacity-70', 'cursor-wait');
        if (!applyAuthCooldown(submitButton, status)) submitButton.disabled = false;
      }
    }
  });

  document.getElementById('forgot-password-link')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('auth-email');
    if (!emailInput?.checkValidity()) {
      emailInput?.reportValidity();
      return;
    }
    try {
      const result = await SearyaApi.forgotPassword(emailInput.value);
      if (result.previewToken) {
        showMainAppPage();
        openResetPasswordModal(result.previewToken);
      } else {
        showToast(isEn ? 'If the account exists, reset instructions were sent.' : 'Hesap varsa sıfırlama bağlantısı gönderildi.');
      }
    } catch (error) {
      showToast(apiErrorMessage(error));
    }
  });

  document.getElementById('resend-verification-link')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('auth-email');
    if (!emailInput?.checkValidity()) {
      emailInput?.reportValidity();
      return;
    }
    try {
      await SearyaApi.resendVerification(emailInput.value);
      showToast(isEn ? 'If the account is unverified, a new link was sent.' : 'Hesap doğrulanmamışsa yeni bağlantı gönderildi.');
    } catch (error) {
      showToast(apiErrorMessage(error));
    }
  });

  // Social Auth Buttons Click Listeners
  document.querySelectorAll('.social-auth-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const provider = btn.dataset.provider;
      const providerName = provider === 'google' ? 'Google' : 'Apple';
      if (!state.socialAuth?.[provider]) {
        showToast(isEn ? `${providerName} sign-in is not configured yet. Use email sign-in for now.` : `${providerName} ile giriş henüz yapılandırılmadı. Şimdilik e-posta ile giriş yapın.`);
        return;
      }
      const role = authMode === 'register' ? authRole : 'buyer';
      window.location.assign(`/api/auth/oauth/${provider}/start?role=${encodeURIComponent(role)}`);
    };
  });
}
