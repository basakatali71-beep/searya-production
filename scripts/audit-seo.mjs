import { INDUSTRY_TOOL_PAGES, INDUSTRY_TOOL_PATHS, TOOL_GUIDE_PATHS } from '../src/data/toolSeoContent.js';

const origin = String(process.env.SEO_AUDIT_ORIGIN || process.argv[2] || 'http://127.0.0.1:4173').replace(/\/$/, '');
const canonicalOrigin = 'https://searya.com';
const toolPaths = [
  '/qr-code-generator', '/time-card-calculator', '/invoice-generator', '/digital-business-card',
  '/email-signature-generator', '/expense-tracker', '/profit-margin-calculator', '/sales-tax-calculator',
  '/estimate-generator', '/job-cost-calculator', '/hourly-rate-calculator', '/break-even-calculator'
];
const indexablePaths = ['/', '/tools', '/pricing', ...toolPaths, ...INDUSTRY_TOOL_PATHS, '/guides', ...TOOL_GUIDE_PATHS, '/legal/privacy.html', '/legal/terms.html', '/legal/cookies.html'];
const aliases = {
  '/work-hours-calculator': '/time-card-calculator', '/quote-generator': '/invoice-generator', '/receipt-maker': '/invoice-generator',
  '/digital-business-card-maker': '/digital-business-card', '/qr-business-card': '/digital-business-card', '/virtual-business-card': '/digital-business-card'
};
const obsoletePaths = ['/projects/example-project', '/discover/saas', '/blog'];
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function match(html, expression) {
  return html.match(expression)?.[1]?.trim() || '';
}

const sitemapResponse = await fetch(`${origin}/sitemap.xml`);
const sitemap = await sitemapResponse.text();
check(sitemapResponse.status === 200, `sitemap.xml returned ${sitemapResponse.status}`);
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(result => result[1]));
check(sitemapUrls.size === indexablePaths.length, `sitemap has ${sitemapUrls.size} URLs; expected ${indexablePaths.length}`);

const seenTitles = new Map();
const seenDescriptions = new Map();
for (const path of indexablePaths) {
  const response = await fetch(`${origin}${path}`);
  const html = await response.text();
  const title = match(html, /<title>([\s\S]*?)<\/title>/i);
  const description = match(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  const canonical = match(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);
  const h1Count = (html.match(/<h1(?:\s[^>]*)?>/gi) || []).length;
  const robots = match(html, /<meta\s+name="robots"\s+content="([^"]*)"/i).toLowerCase();
  const expectedCanonical = `${canonicalOrigin}${path === '/' ? '/' : path}`;

  check(response.status === 200, `${path} returned ${response.status}`);
  check(Boolean(title), `${path} has no title`);
  check(Boolean(description), `${path} has no meta description`);
  check(canonical === expectedCanonical, `${path} canonical is ${canonical || 'missing'}; expected ${expectedCanonical}`);
  check(h1Count === 1, `${path} has ${h1Count} H1 elements`);
  check(!robots.includes('noindex'), `${path} is marked noindex`);
  check(sitemapUrls.has(expectedCanonical), `${path} is missing from sitemap.xml`);
  if (path === '/' || path === '/tools' || path === '/pricing' || toolPaths.includes(path)) {
    check(/<meta property="og:title" content="[^"]+">/i.test(html), `${path} has no Open Graph title`);
    check(/<meta property="og:description" content="[^"]+">/i.test(html), `${path} has no Open Graph description`);
    check(/<meta property="og:url" content="[^"]+">/i.test(html), `${path} has no Open Graph URL`);
  }
  if (toolPaths.includes(path) || INDUSTRY_TOOL_PATHS.includes(path)) {
    check(/class="tool-breadcrumb"/.test(html), `${path} has no visible breadcrumb`);
    check(/"@type":"BreadcrumbList"/.test(html), `${path} has no BreadcrumbList schema`);
    check(/"@type":"SoftwareApplication"/.test(html), `${path} has no SoftwareApplication schema`);
    check(/"@type":"FAQPage"/.test(html), `${path} has no FAQPage schema`);
    check(/"@type":"HowTo"/.test(html), `${path} has no HowTo schema`);
    check(/class="tool-guide"/.test(html), `${path} has no supporting tool guide`);
    check((html.match(/<details>/g) || []).length >= 6, `${path} has fewer than 6 visible FAQ items`);
    check(!seenTitles.has(title), `${path} duplicates the title used by ${seenTitles.get(title)}`);
    check(!seenDescriptions.has(description), `${path} duplicates the description used by ${seenDescriptions.get(description)}`);
    seenTitles.set(title, path);
    seenDescriptions.set(description, path);
  }
  if (TOOL_GUIDE_PATHS.includes(path)) {
    check(/"@type":"Article"/.test(html), `${path} has no Article schema`);
    check(/class="seo-article-section"/.test(html), `${path} has no guide content sections`);
  }
}

const industryWords = page => new Set([
  page.scenario, page.why, page.records, ...page.rows.flat(), ...page.faqs.flat()
].join(' ').toLowerCase().match(/[a-z0-9]+/g) || []);
const industriesByTool = Object.values(INDUSTRY_TOOL_PAGES).reduce((groups, page) => {
  (groups[page.toolPath] ||= []).push(page);
  return groups;
}, {});
for (const pages of Object.values(industriesByTool)) {
  for (let left = 0; left < pages.length; left += 1) {
    for (let right = left + 1; right < pages.length; right += 1) {
      const leftWords = industryWords(pages[left]);
      const rightWords = industryWords(pages[right]);
      const intersection = [...leftWords].filter(word => rightWords.has(word)).length;
      const union = new Set([...leftWords, ...rightWords]).size;
      const similarity = union ? intersection / union : 1;
      check(similarity < 0.6, `${pages[left].path} and ${pages[right].path} have ${(similarity * 100).toFixed(1)}% industry-copy similarity`);
    }
  }
}

for (const [alias, target] of Object.entries(aliases)) {
  const response = await fetch(`${origin}${alias}`, { redirect: 'manual' });
  check(response.status === 301, `${alias} returned ${response.status}; expected 301`);
  check(response.headers.get('location') === `${canonicalOrigin}${target}`, `${alias} points to ${response.headers.get('location')}; expected ${canonicalOrigin}${target}`);
  check(!sitemapUrls.has(`${canonicalOrigin}${alias}`), `${alias} must not appear in sitemap.xml`);
}

for (const path of obsoletePaths) {
  const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
  check(response.status === 410, `${path} returned ${response.status}; expected 410`);
  check((response.headers.get('x-robots-tag') || '').includes('noindex'), `${path} is missing the X-Robots-Tag noindex directive`);
}

const robots = await fetch(`${origin}/robots.txt`).then(response => response.text());
check(/Disallow: \/admin\.html/.test(robots), 'robots.txt does not block admin.html');
check(/Disallow: \/api\//.test(robots), 'robots.txt does not block API routes');
check(/Sitemap: https:\/\/searya\.com\/sitemap\.xml/.test(robots), 'robots.txt has the wrong sitemap URL');

if (failures.length) {
  console.error(`SEO audit failed with ${failures.length} issue(s):`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`SEO audit passed: ${indexablePaths.length} indexable URLs, ${toolPaths.length} canonical tools, ${INDUSTRY_TOOL_PATHS.length} low-duplication industry pages, ${Object.keys(aliases).length} redirects and ${obsoletePaths.length} removals checked.`);
}
