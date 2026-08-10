# FrameCraft Evolution — 10-Loop Improvement Spec

> **Request:** Loop **/plan → implement → /review** ten times. Each loop makes the product more exciting (new features), continuously improves **metadata/SEO**, and adds the **best data tracking**. Everything (frontend, backend, PostgreSQL) runs via **Podman** (compose YAML). New features first; SEO and analytics get dedicated phases.

**Status:** Spec only — no code changes made yet.
**Date:** 2026-08-10
**Author:** Buffy (via 6-round structured interview with the user)

---

## 1. Decisions captured from the interview

| # | Question | Answer |
|---|----------|--------|
| 1 | Loop structure | **Phased batches** — loops 1–5 features, then SEO/metadata loops, then analytics loops, then polish |
| 2 | Review gating | **Fully autonomous** — all 10 loops run with internal review each loop; user reviews everything at the end |
| 3 | Overall priority | **New features first** |
| 4 | Feature areas (loops 1–5) | Search & filtering power-ups · AI recommendations · Homepage excitement · Seller analytics · Notifications center · Order tracking timeline · Reviews & ratings (auction power-ups **not** selected) |
| 5 | Feature access model | **Mixed** — browse public, actions gated (bid, review, track, notify require sign-in) |
| 6 | Feature boldness | **Practical conversion boosters** |
| 7 | SEO scope | **All five**: technical SEO files, JSON-LD structured data, per-page metadata everywhere, dynamic OG image generation, CWV & performance in SEO loops |
| 8 | SEO target | **Both equally** — local studio SEO (Kathmandu/Patan) + marketplace SEO (products/auctions/sellers) |
| 9 | Domain | **Placeholders** — use `framecraft.com.np` as the canonical/OG base |
| 10 | Tracking stack | **PostgreSQL** — user confirmed "i have postgresql all postgresql service"; use the existing Postgres backend for analytics (no third-party scripts) |
| 11 | Events to track | **All** — page views & navigation, commerce funnel, auction & social actions, lead forms, search queries |
| 12 | Analytics access | **Admins + sellers** (sellers see their own product/shop stats) |
| 13 | Consent | **Lightweight banner** — "we use analytics" notice, dismissible, stored in localStorage |
| 14 | Postgres scope | **Migrate everything** — already effectively done (see §3) |
| 15 | Postgres setup | **Podman** — everything (frontend, backend, PostgreSQL) in a podman YAML |
| 16 | AI recommendations | **In-house algorithmic** — computed from views/saves/bids/tags; no API keys, no cost |
| 17 | Notifications | **In-app + WhatsApp** (studio is WhatsApp-first today) |
| 18 | Validation cadence | **Typecheck + backend tests every loop; one full `next build` at the end** |
| 19 | Migration timing | **Foundation step before loop 1** |
| 20 | Container profile | **Deferred to my recommendation** → production-optimized (multi-stage, minimal, standalone output, non-root, healthchecks) |
| 21 | Test DB | **Auto test database** — already implemented (see §3) |
| 22 | Microvisuals page | **Leave untouched** (separate AI-image-gen landing page; not part of this work) |
| 23 | Loop log | **Yes** — maintain a `loop-log.md` documenting each loop's changes + validation results |

---

## 2. Goal statement

Run **10 consecutive plan → implement → review loops** on FrameCraft that, cumulatively:

1. Add **practical, conversion-boosting features** (7 areas selected) — loops 1–5.
2. Bring the site to **SEO excellence**: technical files, JSON-LD, complete per-page metadata, dynamic OG images, CWV — loops 6–7.
3. Build a **self-hosted analytics system in PostgreSQL** with admins + sellers dashboards and a lightweight consent banner — loops 8–9.
4. **Polish & harden** everything (CWV, a11y, i18n, seeds, final build) — loop 10.

All of it runs on **Podman**: one compose YAML orchestrating Postgres, the Bun/Elysia backend, and the Next.js frontend.

---

## 3. Current state assessment (verified from codebase)

### ✅ Already done — do NOT redo
- **Backend is already on PostgreSQL** (`backend/src/db.ts` uses `Bun.sql`, schema is Postgres-flavored: `SERIAL PRIMARY KEY`, `to_char(now(),…)`, `ALTER TABLE … ADD COLUMN IF NOT EXISTS` migrations). `config.ts` defaults `DATABASE_URL` to `postgres://framecraft:framecraft@localhost:5432/framecraft` and documents a podman Postgres run.
- **Tests already auto-provision a `_test` database** (`backend/test/api.test.ts` → `ensureTestDatabase()` creates `<dbname>_test`, drops/recreates schema, reseeds). No manual test DB needed.
- **Full marketplace exists**: auth (customer/seller/admin, httpOnly sessions), products (fixed-price + auctions with bids), sellers + follows, likes, comments, orders + payments (eSewa/Khalti/Fonepay/Bank/COD), cart, checkout, seller dashboard (ResourceManager CRUD), admin console (users/orders/bookings/quotes/settings), account page (Overview/Orders/Bids/Saved/Settings), blog/stories, booking, custom frame builder + quotes, newsletter, gallery/frames/services/about/contact, i18n (en/ne via next-intl).
- **Design system** exists (`design-system/framecraft/MASTER.md`): walnut/cream/gold, Playfair+DMsans… (note: layout actually uses Playfair_Display + DM_Sans + DM_Mono + Noto Sans Devanagari), luxury aesthetic, liquid-glass motion.

### ⚠️ Missing / gaps (this spec's work)
- **No containerization**: zero Dockerfiles/Containerfiles and no compose file anywhere (verified — only `pnpm-lock.yaml`/`pnpm-workspace.yaml` exist). `config.ts` documents a bare `podman run` for Postgres only.
- **No git repository** at the project root (no `.git`). No history/rollback. Recommend `git init` as part of the foundation phase.
- **Metadata is minimal**: only `layout.tsx` exports `generateMetadata` (title/description/keywords + basic OG without images). About/Services/Contact have their own; **shop, products, sellers, blog, checkout, auth, account, dashboard, admin, frames, gallery, booking, custom, not-found do NOT**. No canonical, no hreflang, no robots.ts, no sitemap.ts, no JSON-LD anywhere, no og:image/twitter cards, no OG image generation.
- **No analytics/tracking whatsoever**: zero analytics/gtag/dataLayer references in app code. No event capture, no dashboards, no consent banner. `@next/third-parties` is already installed (unused) — usable if a third-party script is ever added.
- **No search analytics, no seller-facing stats, no notifications, no reviews/ratings, no order-status timeline, no recommendations, no homepage live feed.**

### 🔧 Stack facts
- **Backend:** Bun + Elysia, `bun:sqlite` fully replaced by `Bun.sql` (Postgres), port 3001. Scripts: `dev`, `start`, `seed`, `test` (bun test), `typecheck`.
- **Frontend:** Next.js 16 (App Router, React 19, Tailwind v4, next-intl, three.js, framer-motion, gsap, lenis), port 3000. Scripts: `dev`, `build`, `start`, `lint`, `typecheck`. Uses `next/image` with remote Unsplash patterns.
- **Env vars:** backend — `PORT`, `FRONTEND_ORIGIN`, `DATABASE_URL`, `ADMIN_KEY`, `SESSION_TTL_DAYS`, `SECURE_COOKIES` (via NODE_ENV), `PUBLIC_BASE_URL`, `KHALTI_SECRET_KEY`, `KHALTI_API`, `ESEWA_SECRET_KEY`, `ESEWA_PRODUCT_CODE`, `ESEWA_API`. Frontend — `NEXT_PUBLIC_API_URL` (used in `lib/api.ts`); **no `NEXT_PUBLIC_SITE_URL` yet (needed for SEO)**.

---

## 4. Foundation phase (BEFORE loop 1) — Podman orchestration

Goal: the entire stack boots via one `podman-compose up`. Production-optimized containers (my recommendation per Q20).

### 4.1 Backend container
- `backend/Containerfile` (multi-stage, `oven/bun:1` base, `bun install --production` → copy source → `bun src/index.ts`).
- Non-root user, `EXPOSE 3001`.
- Healthcheck: `curl -f http://localhost:3001/api/health` (install curl in image or use `bun -e` fetch).

### 4.2 Frontend container
- `frontend/Containerfile` (multi-stage): deps → build (`next build` with `output: "standalone"` — add to `next.config.ts`) → runtime stage copies `.next/standalone` + static assets. Non-root, `EXPOSE 3000`.
- Requires `NEXT_PUBLIC_API_URL` at build time (public envs are inlined) — document build args.
- Healthcheck against `/`.

### 4.3 `podman-compose.yaml` (root)
Services:
1. **postgres** — `docker.io/library/postgres:16-alpine`, env `POSTGRES_USER=framecraft`, `POSTGRES_PASSWORD=framecraft`, `POSTGRES_DB=framecraft`, named volume `pgdata`, healthcheck `pg_isready`, port `5432:5432`.
2. **backend** — builds `backend/`, `depends_on: postgres: condition: service_healthy`, env from `.env` (DATABASE_URL points at the `postgres` service hostname), port `3001:3001`, healthcheck.
3. **frontend** — builds `frontend/`, `depends_on: backend: condition: service_healthy`, env `NEXT_PUBLIC_API_URL=http://localhost:3001`, port `3000:3000`, healthcheck.

Also:
- `.env.example` at root documenting all vars (port, DB URL, ADMIN_KEY, site URL, payment keys, WhatsApp keys).
- `README` section: `podman-compose up --build`, first-run seed (`podman-compose exec backend bun run seed`), teardown.
- **Recommended:** `git init` + initial commit (no repo exists — needed for `/review` diffs and safe rollback).

### 4.4 Acceptance for foundation
`podman-compose up --build` → `GET /api/health` OK → homepage loads in browser → `bun run seed` runs → login + shop works. Backend tests + both typechecks green against the composed Postgres.

---

## 5. The 10 loops

Each loop follows: **/plan** (short written plan in `loop-log.md`) → **implement** → **/review** (code-reviewer-deepseek-flash + `bun run typecheck` frontend & backend + `bun test` backend; full `next build` only after loop 10).

### Loops 1–5 — Features (priority: new features first)

| Loop | Feature | Key deliverables |
|------|---------|------------------|
| **1** | **Search & filtering power-ups** | Shop + frames + sellers: category chips, price-range filter, stock filter (in-stock / auction), sort (newest, price ↑↓, most bids, popularity), URL-query sync so filters are shareable, search term highlight. All server-side via existing `GET /api/products?category=&search=&auction=&status=` + new `sort`/`minPrice`/`maxPrice`/`inStock` params. |
| **2** | **Reviews & ratings** | `product_reviews` table (id, product_id, user_id, rating 1–5, title, body, created_at, UNIQUE(product_id, user_id)) + `seller_ratings` (aggregate seller rating from product reviews). Signed-in users can review purchased products (gated per Q5); star picker UI + review list on product page; seller response field; average rating badge on ProductCard + seller profile. |
| **3** | **Order tracking timeline** | Visual status timeline on order pages (Placed → Confirmed → In progress → Ready → Delivered, reusing existing order statuses; store timestamps per transition in `order_events` table). Public "track by order number" for guests; WhatsApp update sent on status change (see §8). Account "Orders" tab shows timeline. |
| **4** | **Notifications center** | `notifications` table (id, user_id, type, title, body, link, read, created_at). Events: outbid, auction won, order status change, new follower, new comment/reply, review received. Bell in navbar (unread dot + dropdown + "mark all read"), account tab, `GET/PATCH /api/notifications`. Optionally a realtime touch via polling (keep simple — no websocket unless trivial). |
| **5** | **Homepage excitement + AI recommendations** | Homepage: live **Hot auctions** rail (ending soon, current bid), **Recently sold** strip, seller/activity feed. **AI recommendations**: in-house algorithmic (Q16) — content-based similarity on category/tags/material + collaborative signal (users who saved/bid same items), `GET /api/recommendations` + "You might also like" rails on product pages, using views/saves/bids as implicit signals (feeds the analytics phase). |

> **Seller analytics** (selected in Round 2) is deliberately deferred into the analytics phase (loops 8–9) because it needs the events infrastructure — noted so it isn't lost.

### Loops 6–7 — SEO / metadata

| Loop | Deliverables |
|------|--------------|
| **6** | **Technical SEO + JSON-LD**: `app/sitemap.ts` (all public routes, per-locale alternates, `framecraft.com.np` base), `app/robots.ts`, canonical + hreflang (en/ne) on every page via a shared metadata helper, JSON-LD: **LocalBusiness** (home), **Product + Offer/Auction** (product pages), **ItemList** (shop), **Person/Organization** (sellers), **Article** (blog), **BreadcrumbList** everywhere, **Organization + WebSite** (sitewide). |
| **7** | **Per-page metadata everywhere + OG images + CWV**: every route gets title/description/OG/Twitter (shop, products, sellers, blog, checkout, auth, account, dashboard, admin, frames, gallery, booking, custom, not-found) via a shared `buildMetadata()` helper + per-page `generateMetadata`; **dynamic OG image route** (`/api/og?title=…&type=…` generating branded 1200×630 PNG via `@vercel/og` or an in-repo canvas/`satori`-free solution — evaluate bundle cost); CWV pass (LCP/CLS/INP fixes, image sizing, lazy-load audits). |

### Loops 8–9 — Data tracking (in PostgreSQL)

| Loop | Deliverables |
|------|--------------|
| **8** | **Event layer**: `analytics_events` table (see §6), `POST /api/track` (anonymous session + optional user_id from cookie), client tracker util (`lib/track.ts`) wired into a provider — fires: page_view, product_view, add_to_cart, checkout_start, order_placed, bid_placed, search, newsletter_subscribe, booking_created, quote_created, follow, like, comment; lightweight consent banner (localStorage, Q13); search query capture. |
| **9** | **Analytics dashboards**: **Admin analytics** tab (page views, top products, funnel: view→cart→checkout→order, bid activity, search terms, lead-form counts, top sellers, revenue by payment method, date-range picker, daily rollup table for perf). **Seller analytics** (their products' views/favorites/bids/orders + conversion). Both read from `analytics_events` + rollups. |

### Loop 10 — Polish & hardening
- Final CWV/performance pass, a11y (focus states, contrast, reduced-motion), i18n completeness (en ↔ ne parity for all new strings), seed expansion (more products/sellers/reviews/bids for demo), bundle audit (existing `bundle-audit.md` pattern), **full `next build`**, full test suite, `/review` of everything.

---

## 6. Data tracking design (spec)

```sql
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event TEXT NOT NULL,            -- page_view | product_view | add_to_cart |
                                 -- checkout_start | order_placed | bid_placed |
                                 -- search | newsletter_subscribe | booking_created |
                                 -- quote_created | follow | like | comment | consent
  path TEXT,
  locale TEXT,
  referrer TEXT,
  session_id TEXT,                -- anonymous uuid cookie
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  search_query TEXT,
  meta JSONB,                     -- e.g. { method, amount, cart_value }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_event_time ON analytics_events(event, created_at);
CREATE INDEX IF NOT EXISTS idx_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_product ON analytics_events(product_id);

-- Daily rollups for fast dashboard queries
CREATE TABLE IF NOT EXISTS analytics_daily (
  day DATE NOT NULL,
  event TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, event)
);
```

- **Tracking endpoint:** `POST /api/track` (batched, lightweight, no auth required — session id from a signed cookie; user_id inferred from session cookie when present).
- **Funnels:** product_view → add_to_cart → checkout_start → order_placed; per-product and per-seller breakdowns.
- **Seller stats:** product views, favorites, bid counts, order counts, revenue (from `orders`), conversion view→order.
- **Consent:** banner stored in localStorage (`fc_analytics_consent`); events fire only after explicit opt-in; `consent` event records the choice. Self-hosted = no third-party cookies.

---

## 7. Metadata / SEO design (spec)

- **Shared helper** `lib/seo.ts`: `buildMetadata({ locale, page, title, description, path, ogType, noindex })` producing title template `%s | FrameCraft`, canonical `https://framecraft.com.np/{locale}{path}`, alternates `{en, ne}`, OG + Twitter card with `og:image` (dynamic route), per-locale strings from `messages/{locale}.json` `meta.*` namespace (extend en/ne).
- **`app/sitemap.ts`**: static routes + dynamic products/sellers/posts (queried from API), per-locale URLs, lastModified.
- **`app/robots.ts`**: allow all, sitemap URL.
- **JSON-LD**: rendered via a small `JsonLd` component injecting `<script type="application/ld+json">`; types: `LocalBusiness` (home — address/hours from settings), `Organization`+`WebSite`, `Product` with `Offer`/`Auction` (`endsAt`, `currentPrice`), `ItemList`, `Person` (sellers), `Article`/`BlogPosting`, `BreadcrumbList`.
- **OG image route** `app/og/route.tsx`: branded 1200×630 (walnut bg, gold rule, Bodoni headline) — evaluate `@vercel/og` vs a lightweight SVG→PNG approach; avoid heavy deps.
- **Perf:** audit LCP image preloads, ensure `next/image` everywhere, keep JSON-LD server-rendered (no client cost).

---

## 8. WhatsApp notifications (spec)

- **Preferred:** WhatsApp Business Cloud API — env vars `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TO` (studio number). Sends order status + bid-outbid + auction-won messages to user phone numbers.
- **Fallback (graceful):** if unconfigured, skip send and rely on in-app notifications only (log a warning once). No hard dependency.
- **Risk:** Meta approval + phone numbers required; treat as best-effort enhancement, never blocking.

---

## 9. Environment variables (new)

| Where | Var | Purpose |
|-------|-----|---------|
| backend | `DATABASE_URL` | Postgres (service host in compose) |
| backend | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TO` | WhatsApp Cloud API (optional) |
| frontend | `NEXT_PUBLIC_SITE_URL` | Canonical/OG base (default `https://framecraft.com.np`) |
| frontend | `NEXT_PUBLIC_API_URL` | Existing (already used) |
| frontend | `NEXT_PUBLIC_ANALYTICS` | Toggle tracker (default on) |
| root | `podman-compose.yaml` | All of the above wired |

---

## 10. Validation & quality gates (every loop)

1. `cd frontend && bun run typecheck` ✅
2. `cd backend && bun run typecheck` ✅
3. `cd backend && bun test` ✅ (auto-provisions `_test` DB)
4. Code review via `code-reviewer-deepseek-flash` on the loop's diff; fix findings.
5. Append the loop's plan + changes + validation results to `loop-log.md`.
6. **Loop 10 only:** `cd frontend && bun run build` (full production build) + full test suite + final review.

## 11. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| No git repo → no diff/rollback for `/review` | `git init` + baseline commit in foundation phase |
| Podman/podman-compose unavailable on the machine | Verify availability in foundation; fall back to documenting `podman run` commands + provide compose for `docker compose` too (same spec file works) |
| Dynamic OG image route adds deps/bundle weight | Evaluate options in loop 7; keep a static-fallback OG image |
| WhatsApp requires Meta setup/approval | Best-effort with graceful in-app fallback |
| 7 feature areas vs 5 feature loops | Combined into 5 loops (§5); seller analytics folded into analytics phase |
| Large event volume on `analytics_events` | Daily rollups + indexed queries; optional retention/cleanup job |

## 12. Out of scope (explicit)

- Microvisuals page (leave untouched — Q22)
- Auction power-ups (live auto-extend, sniping protection) — not selected
- Third-party analytics scripts (GA4/Plausible) — self-hosted chosen
- Third-party AI APIs for recommendations — in-house algorithmic chosen

## 13. Deliverables checklist

- [ ] `podman-compose.yaml` + `backend/Containerfile` + `frontend/Containerfile` + root `.env.example` + README runbook
- [ ] `git init` + baseline commit
- [ ] 10 loops implemented per §5, each validated per §10
- [ ] `loop-log.md` with 10 entries (plan, changes, validation results)
- [ ] Final: typechecks + `bun test` + full `next build` all green, full `/review` completed
