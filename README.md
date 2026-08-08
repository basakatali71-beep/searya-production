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

The integration tests cover health checks, seeded listings, secure registration/session cookies, server-side listing credits, package credits and administrator moderation.

## Production configuration

Copy `.env.example` to `.env` and configure:

- `APP_ORIGIN`: the final HTTPS origin.
- `NODE_ENV=production`.
- `PAYMENT_MODE=polar`, `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET` and the three Polar product IDs.
- Use `POLAR_SERVER=sandbox` while testing and `POLAR_SERVER=production` for live payments.
- Polar webhook URL: `https://your-domain.example/api/polar/webhook` (Raw format, `order.paid` event).
- `RESEND_API_KEY`, `EMAIL_FROM` and a verified sender domain for transactional email.
- A strong `SEARYA_ADMIN_EMAIL` and `SEARYA_ADMIN_PASSWORD` before the first start.

Do not use `PAYMENT_MODE=demo` in production. Demo checkout is deliberately disabled when `NODE_ENV=production`.

## Included launch controls

- Scrypt password hashing and HttpOnly/SameSite session cookies
- Origin checks and endpoint rate limits
- Persistent accounts, listings, credits, alerts and messages
- Server-side buyer connection limits and seller listing credits
- Early contact-information blocking in new conversations
- Listing moderation, reports, blocks and administrator review API/UI
- Polar Checkout + signed and idempotent `order.paid` webhook support
- Resend transactional email support when credentials are configured
- Shareable listing URLs, sitemap, robots.txt and social metadata
- Privacy, terms, cookies and transfer-checklist drafts

The legal pages are operational drafts, not a substitute for review by a lawyer in the launch jurisdiction.
