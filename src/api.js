export class ApiError extends Error {
  constructor(message, status = 500, code = 'API_ERROR', payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body !== 'string') {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(body);
  }
  const response = await fetch(path, {
    ...options,
    body,
    headers,
    credentials: 'same-origin'
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload?.error || {};
    throw new ApiError(error.message || `Request failed (${response.status}).`, response.status, error.code || 'API_ERROR', payload);
  }
  return payload;
}

export const SearyaApi = {
  health: () => request('/api/health'),
  trackPageView: (path, referrer = '') => request('/api/analytics/pageview', { method: 'POST', body: { path, referrer } }),
  trackEvent: (eventName, metadata = {}) => request('/api/analytics/event', { method: 'POST', body: { eventName, metadata } }),
  trackPresence: (sessionId, action = 'heartbeat', path = '/', device = 'unknown') => request('/api/analytics/presence', { method: 'POST', body: { sessionId, action, path, device } }),
  revokeAnalytics: () => request('/api/analytics/consent', { method: 'DELETE' }),
  me: () => request('/api/auth/me'),
  register: data => request('/api/auth/register', { method: 'POST', body: data }),
  login: data => request('/api/auth/login', { method: 'POST', body: data }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  forgotPassword: email => request('/api/auth/forgot-password', { method: 'POST', body: { email } }),
  resendVerification: email => request('/api/auth/resend-verification', { method: 'POST', body: { email } }),
  resetPassword: (token, password) => request('/api/auth/reset-password', { method: 'POST', body: { token, password } }),
  verifyEmail: token => request('/api/auth/verify-email', { method: 'POST', body: { token } }),
  accountDashboard: () => request('/api/account/dashboard'),
  businessProfile: () => request('/api/account/business-profile'),
  saveBusinessProfile: data => request('/api/account/business-profile', { method: 'PUT', body: data }),
  toolItems: () => request('/api/tools/items'),
  saveToolItem: data => request('/api/tools/items', { method: 'POST', body: data }),
  deleteToolItem: id => request(`/api/tools/items/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  myListings: () => request('/api/me/listings'),
  changePassword: data => request('/api/account/change-password', { method: 'POST', body: data }),
  exportAccount: () => request('/api/account/export'),
  deleteAccount: data => request('/api/account', { method: 'DELETE', body: data }),
  listings: type => request(`/api/listings${type ? `?type=${encodeURIComponent(type)}` : ''}`),
  listing: slug => request(`/api/listings/${encodeURIComponent(slug)}`),
  recordListingView: id => request(`/api/listings/${encodeURIComponent(id)}/view`, { method: 'POST' }),
  createListing: data => request('/api/listings', { method: 'POST', body: data }),
  updateListing: (id, data) => request(`/api/listings/${encodeURIComponent(id)}`, { method: 'PATCH', body: data }),
  deleteListing: id => request(`/api/listings/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  applyListingAddon: (id, addon) => request(`/api/listings/${encodeURIComponent(id)}/addon`, { method: 'POST', body: { addon } }),
  threads: () => request('/api/threads'),
  unreadMessageCount: () => request('/api/threads/unread-count'),
  markThreadRead: threadId => request(`/api/threads/${encodeURIComponent(threadId)}/read`, { method: 'POST' }),
  startThread: (listingId, message) => request('/api/threads', { method: 'POST', body: { listingId, message } }),
  sendMessage: (threadId, message) => request(`/api/threads/${encodeURIComponent(threadId)}/messages`, { method: 'POST', body: { message } }),
  checkout: packageKey => request('/api/packages/checkout', { method: 'POST', body: { packageKey } }),
  createAlert: data => request('/api/alerts', { method: 'POST', body: data }),
  alerts: () => request('/api/alerts'),
  deleteAlert: id => request(`/api/alerts/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  report: data => request('/api/reports', { method: 'POST', body: data }),
  block: userId => request('/api/blocks', { method: 'POST', body: { userId } }),
  adminOverview: () => request('/api/admin/overview'),
  updateAdminUserStatus: (id, status) => request(`/api/admin/users/${encodeURIComponent(id)}/status`, { method: 'POST', body: { status } }),
  updateAdminReport: (id, status) => request(`/api/admin/reports/${encodeURIComponent(id)}`, { method: 'POST', body: { status } }),
  moderateListing: (id, action) => request(`/api/admin/listings/${encodeURIComponent(id)}/moderate`, { method: 'POST', body: { action } })
};
