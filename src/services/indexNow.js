const DEFAULT_INDEXNOW_KEY = 'eafc80a9e06ac211f8ee62b81e9475a3';
const DEFAULT_INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

export const INDEXNOW_KEY = String(process.env.INDEXNOW_KEY || DEFAULT_INDEXNOW_KEY).trim();

export function indexNowKeyPath(key = INDEXNOW_KEY) {
  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) throw new Error('INDEXNOW_KEY must contain 8-128 letters, numbers, or dashes.');
  return `/${key}.txt`;
}

export function canonicalIndexNowUrls(values, origin = 'https://searya.com') {
  const site = new URL(origin);
  const urls = new Set();
  for (const value of Array.isArray(values) ? values : [values]) {
    if (!value) continue;
    const url = new URL(String(value), site);
    if (url.host !== site.host || !['http:', 'https:'].includes(url.protocol)) continue;
    url.hash = '';
    urls.add(url.href);
  }
  return [...urls].slice(0, 10_000);
}

export async function submitIndexNow(values, options = {}) {
  const origin = String(options.origin || process.env.PUBLIC_ORIGIN || 'https://searya.com');
  const key = String(options.key || INDEXNOW_KEY).trim();
  const endpoint = String(options.endpoint || process.env.INDEXNOW_ENDPOINT || DEFAULT_INDEXNOW_ENDPOINT);
  const fetchImpl = options.fetchImpl || fetch;
  const urlList = canonicalIndexNowUrls(values, origin);
  if (!urlList.length) return { submitted: 0, skipped: true };
  const site = new URL(origin);
  const keyLocation = new URL(indexNowKeyPath(key), site).href;
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: site.host, key, keyLocation, urlList }),
    signal: AbortSignal.timeout(Number(options.timeoutMs || 10_000))
  });
  if (![200, 202].includes(response.status)) {
    throw new Error(`IndexNow rejected ${urlList.length} URL(s) with HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  return { submitted: urlList.length, status: response.status, keyLocation };
}

