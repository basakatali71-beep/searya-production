# Searya Business Tools

Searya provides free practical tools for freelancers and small businesses. The production app currently includes 12 generators and calculators for business documents, pricing, time, expenses, QR codes and professional identity.

## Run locally

Requirements: Node.js 24.14 or newer.

```bash
npm start
```

Open `http://localhost:4173/`.

The app uses Node's built-in HTTP, crypto and SQLite modules; no third-party server package is required. The SQLite database is created at `data/searya.sqlite` and is ignored by git.

## Tests

```bash
npm run check
```

The integration tests cover health checks, secure registration/session cookies, account and Business Profile persistence, image validation, business-tool routes, calculations, QR output, SEO metadata, rate limits and legacy marketplace compatibility.

## Account and Business Profile architecture

- Anonymous visitors can continue using the basic tools without creating an account.
- Signed-in users can save tool outputs in `tool_items` and manage shared identity data in `business_profiles`.
- Business Profile stores contact, address, brand, social, booking, currency and optional tax defaults once per user. Images accept only bounded PNG, JPG or WebP data.
- `GET /api/account/business-profile` returns a safe editable profile and completion percentage.
- `PUT /api/account/business-profile` validates and upserts the authenticated user's profile.
- Account export includes the Business Profile, and deleting a user removes it through the database foreign key.
- Phase 1 intentionally does not autofill every tool yet. The shared API and account editor are the foundation for tool-by-tool autofill in the next phase.

## Production configuration

Copy `.env.example` to `.env` and configure:

- `APP_ORIGIN`: the final HTTPS origin.
- `NODE_ENV=production`.
- Keep `PAYMENT_MODE=disabled` until an approved live payment provider is configured. A Polar sandbox configuration is automatically disabled in production so test checkout can never be shown to customers.
- `RESEND_API_KEY`, `EMAIL_FROM` and a verified sender domain for transactional email.
- A strong `SEARYA_ADMIN_EMAIL` and `SEARYA_ADMIN_PASSWORD` before the first start.
- On Render with a persistent disk mounted at `/var/data`, use `SEARYA_DB_PATH=/var/data/searya.sqlite` and optionally `SEARYA_BACKUP_DIR=/var/data/backups`.

## Search-engine notifications

- The app publishes an IndexNow verification file and submits newly approved listing URLs plus the sitemap to the global IndexNow endpoint. Participating engines share accepted submissions, so one request covers Bing, Yandex and other IndexNow engines.
- `INDEXNOW_KEY` is optional because a deploy-safe default key is included. Set it in Render and the matching GitHub Actions secret only when rotating the key.
- The scheduled blog workflow waits until the deployed article is publicly reachable, then submits the article and sitemap through IndexNow.
- Google Indexing API is intentionally not used for marketplace listings or blog posts: Google officially limits it to `JobPosting` and livestream `BroadcastEvent` pages. Google discovery uses the dynamic sitemap and Search Console Sitemap API instead.
- To enable automatic Google sitemap refreshes, create a Google service account, add its email to the `sc-domain:searya.com` Search Console property, then store its complete JSON as `GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON` in Render and GitHub Actions secrets.

Do not use `PAYMENT_MODE=demo` in production. Demo checkout is deliberately disabled when `NODE_ENV=production`.

The server creates one SQLite backup per day and retains the latest seven files. These backups protect against application mistakes but live on the same disk; provider snapshots or an external database backup should also be enabled before storing valuable production data.

## Included launch controls

- Scrypt password hashing and HttpOnly/SameSite session cookies
- Origin checks and endpoint rate limits
- Persistent accounts, listings, credits, alerts and messages
- Server-side buyer connection limits and seller listing credits
- Early contact-information blocking in new conversations
- Listing moderation, reports, blocks and administrator review API/UI
- Production-safe payment waiting state while the live provider application is pending
- Resend transactional email support when credentials are configured
- Verification-email resend, project-alert delivery and unread-message counters
- Daily SQLite backup rotation with seven-file retention
- Shareable listing URLs, sitemap, robots.txt and social metadata
- Privacy, terms, cookies and transfer-checklist drafts

The legal pages are operational drafts, not a substitute for review by a lawyer in the launch jurisdiction.
