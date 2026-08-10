# FrameCraft Evolution — Loop Log

Autonomous 10-loop plan → implement → review session. Spec: `framecraft-evolution-spec.md`.

## Foundation (before Loop 1) — Podman orchestration ✅
- `git init` + baseline commit `42ca518`.
- `backend/Containerfile` (bun, non-root, healthcheck) + `frontend/Containerfile` (bun deps, **real-Node build** — Bun's `next build` crashes in-container with SIGILL, standalone runner on node:22-alpine) + `.dockerignore` files.
- `podman-compose.yaml`: postgres + backend + frontend, healthchecks, `pgdata` named volume, `depends_on: condition: service_healthy` ordering, fully-qualified image refs.
- `frontend/next.config.ts` → `output: "standalone"`.
- `backend/src/index.ts` → PostgreSQL wait-retry loop at boot (cold-start safe).
- README Podman runbook + root `.env.example`.
- **Verified:** all 3 containers healthy, `/api/health` OK, homepage 200. DB backed up to `/tmp` before the legacy container was replaced.
- Commit `819104f`.

## Loop 1 — Search & filtering power-ups ✅
**Plan:** server-side sort/filter params + shop/frames UI with URL-synced filters.
**Changes:**
- Backend `GET /api/products`: `sort` (newest · price_asc · price_desc · most_bids · popular · ending_soon), `minPrice`/`maxPrice` (against effective price = current bid or list price), `inStock`.
- Backend `GET /api/frames`: `sort` (name_asc · name_desc · popular).
- Frontend shop: sort dropdown, min/max NPR price inputs, in-stock toggle, shareable URL query sync (`category/q/auction/sort/min/max/stock`, debounced), `Suspense` wrapper for `useSearchParams`.
- Frontend frames: sort dropdown.
- i18n: new `shopPage` + `framesPage` strings in en + ne.
- Tests: +5 (`products search & filtering power-ups`).
**Validation:** backend typecheck ✅ · frontend typecheck ✅ · `bun test` **64 pass / 0 fail** ✅
**Commit:** `2581a33` + review fixes `4b61bb6`

## Loop 2 — Reviews & ratings ✅
**Plan:** one review (1–5★) per user per product, seller replies, aggregate ratings on product + seller surfaces.
**Changes:**
- Backend: `product_reviews` table (UNIQUE(product_id, user_id), reply + replied_at); `reviews.ts` route — `GET /api/products/:id/reviews` (avg + list), `POST` (guarded, 409 on dup), `PUT /api/reviews/:id/reply` (product seller or admin), `DELETE` (author or admin).
- `products.ts`: avg_rating/review_count via LEFT JOIN on list + detail; `sellers.ts`: seller rating + review_count subqueries.
- Frontend: product page — star badge under title, full Reviews section (interactive star picker, form, list, seller reply box, delete own); ProductCard star badge; seller profile rating in stats.
- i18n: en + ne (`productPage`, `sellerProfile`).
- Tests: +6 (`reviews & ratings`). Fixed test DB drop list (new table) + admin-vs-seller fixture nuance.
**Validation:** backend typecheck ✅ · frontend typecheck ✅ · `bun test` **70 pass / 0 fail** ✅
**Commit:** `2bf173b` + review fixes `58d2ef3`

## Loop 3 — Order tracking timeline ✅
**Plan:** record every order status transition; show a visual timeline to customers + guest track-by-number.
**Changes:**
- Backend: `order_events` table; initial `pending` event written inside the order transaction; admin + seller PATCH record events on status change; `GET /api/orders/:id/events` (public, statuses only); `/api/my/orders` + admin `/api/orders` attach `events[]` (single batched query).
- Frontend: account Orders tab — vertical status timeline (gold nodes + connector, latest highlighted) under each order, plus a guest **Track an order** form (order number → public events endpoint).
- i18n: en + ne (`account`: timelineTitle/trackOrder/trackPlaceholder/track/notFound).
- Tests: +2 (`order tracking timeline`); added `order_events` to the test drop list.
- Fixed backend typecheck issues from `events: []` inference + `unknown` ids.
**Validation:** backend typecheck ✅ · frontend typecheck ✅ · `bun test` **72 pass / 0 fail** ✅
**Commit:** `5f3e614` + review fixes `242a5d1`

## Loop 10 — Auction ending-soon alerts

(placeholder — filled in below)

## Loop 9 — Marketplace pulse (live activity + fresh arrivals)

**What shipped**
- `GET /api/activity`: fresh arrivals (newest sellable products), recent
  auction wins (winner names), recent reviews, new sellers — no customer PII.
- Homepage: MarketplacePulse section — fresh-arrivals grid (ProductCards) +
  a LIVE activity feed (wins / reviews / new sellers with time-ago chips).
- i18n en/ne; +1 test (arrivals, wins, reviews and sellers all surfaced).

## Loop 8 — SEO & metadata power-up

**What shipped**
- Server wrappers for product / blog-post / seller pages: per-page
  `generateMetadata` (dynamic titles, descriptions, canonical URLs, OG tags)
  + JSON-LD (Product, BlogPosting, Person) rendered in initial HTML.
- `lib/seo.ts`: failure-tolerant fetchers (2.5s timeout, graceful fallback to
  generic metadata), JSON-LD builders, Organization schema.
- Layout: canonical + en/ne hreflang alternates, OG image, Organization JSON-LD.
- `sitemap.xml` (both locales + all products/posts/sellers, force-dynamic)
  and `robots.txt`.
- `API_INTERNAL_URL` compose env so server-side SEO fetches reach the backend
  by service name (localhost:3001 only works from the browser).

**Bug fixed (found by live smoke test)**
- `/api/sellers/:id` had a duplicated `FROM users u` (SELLER_LIST_SQL ended
  with FROM, detail query appended another) → 500 since Loop 2, hidden by
  client-side catch. Fixed + regression test (+1).

## Loop 7 — Admin site-wide analytics

**What shipped**
- `GET /api/admin/analytics` (admin only): site KPIs (revenue, orders, users
  by role, products, live auctions, bids, reviews, 14-day views), contiguous
  30-day revenue series, top-5 sellers by 90-day revenue, category breakdown,
  order-status distribution.
- Reuses the defensive item/pid JSON guards from Loop 6; revenue attribution
  is seller-aware (LATERAL sum matching product ownership).
- Admin console: Analytics tab (first) — KPI grid, 30-day revenue bars,
  top-sellers list, category revenue bars, order-status cards.
- i18n en/ne; +2 tests (KPIs + 30-day series + order landing on a day;
  non-admin 403).

**Notes**
- Revenue series is generated with `generate_series` in the DB timezone so the
  client never re-keys dates.

## Loop 6 — Seller analytics dashboard

**What shipped**
- `GET /api/seller/analytics` (seller/admin only): summary KPIs (revenue,
  order count, 14-day views, bids, avg rating, active products), top-5 products
  by revenue (with units/views/bids), 14-day views trend, 14-day orders trend.
- Revenue attribution via `jsonb_array_elements` on order items + ownership
  join — a seller only ever sees orders containing their own products.
- Dashboard: new Analytics tab (first) — KPI cards, rating/active-product
  cards, SVG 14-day bar chart with Views/Sales toggle, top-products table.
- i18n en/ne; +3 tests (revenue aggregation, cross-seller isolation, 403).

**Review fixes**
- Bounded fetch: lifetime totals via SQL aggregates (LATERAL SUM); only the
  last 90 days of orders are loaded for top products + sales trend.
- Contiguous 14-day series generated server-side (`generate_series`, DB
  timezone) — client no longer invents day keys (UTC mismatch removed).
- Defensive item parsing: SAFE_PID guards malformed productIds; invalid/empty
  items JSON falls back to `[]` instead of 500ing the endpoint.
- `activeProducts` now counts only live auctions (status = 'active').
- Items parsed once per order (single pass for revenue + daily totals).

**Notes**
- Cancelled orders are excluded from revenue/order counts.
- `viewed_at`/`created_at` are TEXT timestamps — cast to timestamp for day
  grouping; top products rank by the last 90 days, lifetime totals by SQL.

## Loop 5 — Trending now & picked for you (data-driven homepage)

**What shipped**
- `product_views` table + `POST /api/products/:id/view` (optional-auth view tracking).
- `GET /api/products/trending` — top-8 sellable products ranked by live score
  (2× views + 4× bids + 3× reviews over 14 days).
- `GET /api/products/recommendations?basedOn=1,2` — category co-occurrence
  recommendations, each tagged with the viewed product that drove it.
- `useBrowsingHistory` hook (localStorage + backend ping); product page records views.
- Homepage: TrendingNow section (LIVE pulse, rank badges, view/bid/review chips)
  + PickedForYou section (reason lines "Because you viewed X", clear-history).
- i18n en/ne; +5 tests (views feed trending, score ordering, recommendation
  reasons, unknown-base empty, 404 on missing product).

**Review fixes**
- Hydration safety: PickedForYou deferred until `mounted` (localStorage read on
  client would mismatch SSR).
- Anti-gaming: views deduped per identity per product per hour (signed-in →
  user_id, guest → localStorage visitor_id, anonymous → shared NULL bucket).
- `closeExpiredAuctions()` added to recommendations (consistency with trending).
- Shared `TRENDING_SELECT` constant (was duplicated between the two endpoints).
- Explicit `$n::int/text` casts in the view INSERT..SELECT (Postgres can't infer
  param types there); localStorage write moved out of the state updater.

**Notes**
- Bun.sql can't encode JS-array params → generated IN placeholders instead of `ANY($n::int[])`.
- Trending excludes out-of-stock fixed-price items; tests create their own
  products because earlier suites deplete seeded stock.

## Loop 4 — Notifications center (in-app + WhatsApp) ✅
**Plan:** in-app notification center fed by marketplace events; best-effort WhatsApp nudges.
**Changes:**
- Backend: `notifications` table; `notifications.ts` (shared `notify()` + `GET /api/me/notifications`, `PATCH /:id`, `PUT /read-all`); `lib/whatsapp.ts` (graceful Cloud-API helper, no-ops when unconfigured).
- Triggers: outbid (bids), auction won (auto-close + seller early-end), new order → sellers, order status → customer (+ WhatsApp to order phone), new follower, new comment → content owner, review received → seller.
- Frontend: `NotificationBell` in Navbar (desktop + mobile) — unread badge, 30s polling, dropdown list with type icons, mark-all-read, click-to-mark-read + navigate.
- i18n: en + ne (`account`: notifications/markAllRead/noNotifications).
- Tests: +3 (`notification center`); made the order-notify test self-sufficient (own product) to avoid stock depletion.
**Validation:** backend typecheck ✅ · frontend typecheck ✅ · `bun test` **75 pass / 0 fail** ✅
**Commit:** pending
