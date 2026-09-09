# IB Recruit Tracker

Tracks ~40 investment banking / PE / middle-market firms for when their 2028 full-time or
Insight-program applications open, and emails you the moment a status changes. Application-drop
tracking only — no networking/conversion-calculator features (those stay in your spreadsheet).

## Architecture

- **Next.js 16 (App Router)** on Vercel — dashboard UI + CRUD API routes.
- **Postgres on Neon** via **Drizzle ORM** — shared by the web app and the scraper.
- **GitHub Actions** (hourly cron) runs the actual scraper (`scraper/index.ts`), since Playwright's
  Chromium binary doesn't fit cleanly in a Vercel serverless function. The Next.js app never
  launches a browser itself — it does CRUD, and for browser-strategy firms it dispatches the GH
  Actions workflow on demand ("Check Now").
- **Cheerio** for static/server-rendered ATS pages (`http` strategy, most firms); **Playwright**
  only for JS-rendered pages like Workday (`browser` strategy).
- **Resend** sends the alert email when a firm's status flips.

See `db/schema.ts` for the data model (`firms`, `watch_targets`, `check_runs`, `alerts`).

## One-time setup

1. **Neon Postgres** — create a free project at neon.tech, copy the pooled connection string.
2. **Resend** — sign up at resend.com, verify a sending domain (or use their test domain while
   getting started), grab an API key.
3. **GitHub repo** — push this project to a new repo (public keeps Actions minutes unlimited;
   private is fine too, see cost note below).
4. **GitHub → Settings → Secrets and variables → Actions**, add:
   - `DATABASE_URL`, `RESEND_API_KEY`, `ALERT_TO_EMAIL`, `ALERT_FROM_EMAIL`
5. **GitHub Personal Access Token** (fine-grained, scoped to this repo, Actions: read/write) — used
   by the dashboard's "Check Now" button to trigger the workflow for browser-strategy firms.
6. **Vercel** — import the repo, set the same env vars as `.env.example` describes, plus
   `GITHUB_OWNER` / `GITHUB_REPO` / `GITHUB_DISPATCH_TOKEN` (the PAT from step 5) and
   `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` (Vercel installs devDependencies including Playwright at
   build time but never launches a browser — this skips the ~300MB Chromium download there).
7. Run the DB migration once against Neon: `DATABASE_URL=... npm run db:migrate`.
8. Seed the firm list: `DATABASE_URL=... npm run seed` (reads `seed/firms.csv`).
9. Deploy to Vercel, open the dashboard, and add a watch-target URL per firm (see below) — the
   spreadsheet has no careers-page URLs, so this step is manual and unavoidable.

## Local development

```bash
cp .env.example .env.local   # fill in DATABASE_URL at minimum
npm install
npm run db:migrate           # applies db/migrations against Neon
npm run seed                 # loads seed/firms.csv into the firms table
npm run dev                  # http://localhost:3000
```

To run a scrape manually against all active watch targets:

```bash
npm run scrape
# or, for one firm only:
npx tsx scraper/index.ts --firm-id=<uuid>
```

## Adding a firm's watch target

Open a firm's detail page and add: the careers-page URL, an optional CSS selector to narrow the
check, a comma-separated keyword list (e.g. `2028, Summer Analyst, Full-Time Analyst, Apply Now`),
and a fetch strategy:
- **http** (default) — fast, works for most ATS pages (Greenhouse, SmartRecruiters, iCIMS, most
  custom career pages).
- **browser** — use only if you confirm the listing doesn't appear in the `http` strategy's result
  (check the `raw_excerpt` on a check run) — this is almost always a JS-rendered page like Workday.

A firm flips to **Application Open** the first time a configured keyword appears that wasn't
present on the previous check, which triggers an email. Once a firm is `open` or
`does_not_sponsor`, the scheduled run stops actively polling it (use "Check Now" to re-check
manually if needed).

## Known limitations

- Some firms run bot protection (Akamai/Cloudflare) that blocks even polite scraping — these
  surface as a `Check Error` status, not a bypass attempt.
- Some Workday postings are login-gated; absence of a visible listing isn't proof it's not open.
- ATS page structures change without notice — keyword matching is the primary signal, CSS
  selectors are a secondary narrowing tool only, and will occasionally need updating.
- **Treat every alert as "go verify manually," not as confirmed fact.**
- **LinkedIn is intentionally never scraped** (their ToS prohibits it) — track LinkedIn-only firms
  by hand.
- Before trusting hourly polling on a firm, skim its `robots.txt` and ToS; if a target starts
  returning errors consistently, deactivate it rather than trying to work around the block.

## Cost

$0/month at this scale: Vercel Hobby, Neon free tier, Resend free tier (3,000 emails/month), and
GitHub Actions (unlimited on a public repo; 2,000 free minutes/month on a private one — a full
hourly run across ~45 firms takes roughly 1-3 minutes).
