import { submitSitemapToGoogle } from '../src/services/googleSearchConsole.js';

const result = await submitSitemapToGoogle();
if (!result.configured) {
  console.log('Google Search Console credentials are not configured; sitemap remains discoverable through robots.txt.');
  process.exit(0);
}
console.log(`Submitted ${result.sitemapUrl} to Google Search Console property ${result.siteUrl}.`);

