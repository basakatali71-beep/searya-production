import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLOG_KEYWORDS } from '../src/data/blogKeywords.js';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const POSTS_FILE = resolve(ROOT, 'src/data/blogPosts.json');
const apiKey = String(process.env.OPENAI_API_KEY || '').trim();
const model = String(process.env.OPENAI_BLOG_MODEL || 'gpt-5-mini').trim();
if (!apiKey) throw new Error('OPENAI_API_KEY is required. Store it as a GitHub Actions secret; never commit it.');

const slugify = value => String(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
const posts = JSON.parse(await readFile(POSTS_FILE, 'utf8'));
const used = new Set(posts.map(post => post.keyword));
const remaining = BLOG_KEYWORDS.filter(keyword => !used.has(keyword));
const keyword = process.env.BLOG_KEYWORD || remaining[0] || BLOG_KEYWORDS[posts.length % BLOG_KEYWORDS.length];

const schema = {
  type: 'object', additionalProperties: false, required: ['title','excerpt','metaDescription','tags','sections'],
  properties: {
    title: { type: 'string' }, excerpt: { type: 'string' }, metaDescription: { type: 'string' },
    tags: { type: 'array', minItems: 3, maxItems: 7, items: { type: 'string' } },
    sections: { type: 'array', minItems: 5, items: { type: 'object', additionalProperties: false, required: ['heading','paragraphs','subsections'], properties: {
      heading: { type: 'string' }, paragraphs: { type: 'array', minItems: 2, items: { type: 'string' } },
      subsections: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['heading','paragraphs'], properties: { heading: { type: 'string' }, paragraphs: { type: 'array', minItems: 1, items: { type: 'string' } } } } }
    } } }
  }
};

const response = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model, store: false, input: [{ role: 'system', content: 'You are Searya Editorial. Write accurate, practical American English for buyers and sellers of digital projects. Never invent statistics, platform fees, legal guarantees, customers, or transaction outcomes. Searya connects people but does not process acquisitions, escrow, or due diligence.' }, { role: 'user', content: `Create a comprehensive 1,000-1,300 word SEO article targeting: "${keyword}". Use a specific non-clickbait title, useful H2 sections and occasional H3 subsections. Address search intent directly, add practical steps and cautions, and close naturally without fake claims. Meta description must be 140-160 characters.` }], text: { format: { type: 'json_schema', name: 'searya_blog_article', strict: true, schema } } })
});
if (!response.ok) throw new Error(`OpenAI request failed (${response.status}): ${await response.text()}`);
const payload = await response.json();
const article = JSON.parse(payload.output_text || '{}');
const allText = article.sections.flatMap(section => [section.heading, ...section.paragraphs, ...section.subsections.flatMap(sub => [sub.heading, ...sub.paragraphs])]).join(' ');
const wordCount = allText.trim().split(/\s+/).length;
if (wordCount < 900) throw new Error(`Generated article is too short (${wordCount} words); no file was changed.`);
if (article.metaDescription.length < 120 || article.metaDescription.length > 165) throw new Error('Generated meta description is outside the allowed range; no file was changed.');
let slug = slugify(article.title);
if (posts.some(post => post.slug === slug)) slug = `${slug}-${new Date().toISOString().slice(0,10)}`;
const publishedAt = new Date().toISOString();
posts.push({ id: crypto.randomUUID(), keyword, slug, url: `/blog/${slug}`, title: article.title, excerpt: article.excerpt, metaDescription: article.metaDescription, tags: article.tags, readTime: `${Math.max(5, Math.ceil(wordCount / 220))} min read`, author: 'Searya Editorial', publishedAt, updatedAt: publishedAt, wordCount, sections: article.sections });
await writeFile(POSTS_FILE, `${JSON.stringify(posts, null, 2)}\n`);
console.log(`Published /blog/${slug} (${wordCount} words) for keyword: ${keyword}`);
