import { GoogleAuth } from 'google-auth-library';

const SEARCH_CONSOLE_SCOPE = 'https://www.googleapis.com/auth/webmasters';

function serviceAccountCredentials(raw = process.env.GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON) {
  if (!raw) return null;
  const credentials = JSON.parse(String(raw));
  if (!credentials.client_email || !credentials.private_key) throw new Error('Google Search Console service-account JSON is incomplete.');
  return credentials;
}

export async function submitSitemapToGoogle(options = {}) {
  const siteUrl = String(options.siteUrl || process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || 'sc-domain:searya.com');
  const sitemapUrl = String(options.sitemapUrl || process.env.GOOGLE_SEARCH_CONSOLE_SITEMAP_URL || 'https://searya.com/sitemap.xml');
  const credentials = options.credentials || serviceAccountCredentials(options.credentialsJson);
  if (!credentials) return { configured: false, submitted: false };
  let accessToken = options.accessToken;
  if (!accessToken) {
    const auth = new GoogleAuth({ credentials, scopes: [SEARCH_CONSOLE_SCOPE] });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    accessToken = typeof token === 'string' ? token : token?.token;
  }
  if (!accessToken) throw new Error('Google Search Console access token could not be created.');
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
  const response = await (options.fetchImpl || fetch)(endpoint, { method: 'PUT', headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(Number(options.timeoutMs || 10_000)) });
  if (!response.ok) throw new Error(`Google Search Console rejected the sitemap with HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return { configured: true, submitted: true, siteUrl, sitemapUrl };
}
