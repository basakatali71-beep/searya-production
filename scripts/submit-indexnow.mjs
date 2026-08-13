import { submitIndexNow } from '../src/services/indexNow.js';

const origin = String(process.env.PUBLIC_ORIGIN || 'https://searya.com').replace(/\/$/, '');
const args = process.argv.slice(2).filter(Boolean);
let urls = args;

if (!urls.length || args.includes('--sitemap')) {
  const sitemap = await fetch(`${origin}/sitemap.xml`).then(async response => {
    if (!response.ok) throw new Error(`Could not read sitemap (${response.status}).`);
    return response.text();
  });
  urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
}

if (!urls.length) throw new Error('No URL was supplied and the sitemap contained no URLs.');

if (!args.includes('--sitemap')) {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const available = await Promise.all(urls.map(async url => {
      try { return (await fetch(new URL(url, origin), { method: 'HEAD', redirect: 'follow' })).ok; }
      catch { return false; }
    }));
    if (available.every(Boolean)) break;
    if (attempt === 30) throw new Error('The new URL did not become publicly available before IndexNow submission.');
    await new Promise(resolve => setTimeout(resolve, 10_000));
  }
}

const result = await submitIndexNow(urls, { origin });
console.log(`IndexNow accepted ${result.submitted} URL(s) with HTTP ${result.status}.`);

