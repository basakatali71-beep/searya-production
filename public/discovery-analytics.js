(() => {
  const CONSENT_KEY = 'searya-cookie-consent-v1';
  const slug = document.body.dataset.discoverySlug || '';
  if (!slug || localStorage.getItem(CONSENT_KEY) !== 'analytics') return;

  const track = (eventName, metadata = {}) => fetch('/api/analytics/event', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventName, metadata: { discoverySlug: slug, path: location.pathname, ...metadata } }),
    keepalive: true
  }).catch(() => {});

  track('discovery_page_view');
  document.addEventListener('click', event => {
    const project = event.target.closest('.discovery-project-link');
    if (project) track('discovery_project_click', { listingId: project.dataset.listingId || '' });
    else if (event.target.closest('.discovery-seller-cta')) track('discovery_seller_cta_click');
    else if (event.target.closest('.discovery-buyer-cta')) track('discovery_buyer_cta_click');
  });
})();
