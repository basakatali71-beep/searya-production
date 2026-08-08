# Searya Marketplace

Searya is a Turkish/English marketplace MVP for transferring unfinished or operating digital projects.

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

The integration tests cover health checks, secure registration/session cookies, verification-email retries, rate limits behind a proxy, server-side listing credits, unread messages, blocks, package credits and administrator moderation.

## Production configuration

Copy `.env.example` to `.env` and configure:

- `APP_ORIGIN`: the final HTTPS origin.
- `NODE_ENV=production`.
- Keep `PAYMENT_MODE=disabled` until an approved live payment provider is configured. A Polar sandbox configuration is automatically disabled in production so test checkout can never be shown to customers.
- `RESEND_API_KEY`, `EMAIL_FROM` and a verified sender domain for transactional email.
- A strong `SEARYA_ADMIN_EMAIL` and `SEARYA_ADMIN_PASSWORD` before the first start.
- On Render with a persistent disk mounted at `/var/data`, use `SEARYA_DB_PATH=/var/data/searya.sqlite` and optionally `SEARYA_BACKUP_DIR=/var/data/backups`.

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
