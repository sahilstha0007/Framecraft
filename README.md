# Kala Bazaar — कला बजार

Nepal's online **art marketplace & social platform**: buy, bid and follow Nepali artists. A monorepo with a **Next.js frontend** and an **Elysia (Bun) REST API backend** on **PostgreSQL** (via built-in `Bun.sql`).

> **Portfolio demo notice:** This is a project build, not a live store. Payment gateways run in sandbox mode — no real money is charged and no orders are fulfilled. Interested in the project? See [the portfolio](https://sahiltuchheshrestha.com.np) or email [sahiltuchhe123@gmail.com](mailto:sahiltuchhe123@gmail.com).

## Structure

```
framecraft/
├── frontend/            Next.js 16 app — App Router, React 19, Tailwind v4
├── backend/             Elysia REST API on Bun — PostgreSQL (Bun.sql)
├── podman-compose.yaml  Full stack (postgres + backend + frontend) via Podman
├── backend/Containerfile
└── frontend/Containerfile
```

## What it is

Two products in one:

- **Art marketplace** — browse/search products by category, cart checkout with Nepali payment rails (**eSewa, Khalti**, Fonepay / bank / COD), and **live auctions** with min-increment bidding, countdowns and automatic winner selection.
- **Social platform** — public seller profiles & shops, seller **stories/blog**, follow / like / comment / star-reviews with seller replies, a trending ranker driven by real views/bids/reviews, and an in-app notification center.

### Roles

| Role | What they can do |
| ---- | ---------------- |
| **customer** | Browse & search the shop, buy, bid in auctions, follow/like/comment/review, manage account (orders, bids, saved, settings) |
| **seller** | Everything a customer can, plus a seller dashboard: list products (fixed-price or auctions), write stories, manage their own orders |
| **admin** | The owner console: analytics, orders, users (3 roles), product management, shop settings |

Registration is open self-signup with a buyer/seller choice. Rate limiting protects auth, payment and order routes (10–20 req/min/IP).

## Quick start

Requirements: [Bun](https://bun.com) ≥ 1.3, PostgreSQL ≥ 14 (local or via Podman).

### Backend (port 3001)

```bash
cd backend
bun install
cp .env.example .env        # DATABASE_URL, FRONTEND_ORIGIN, ADMIN_KEY…
bun run dev                 # auto-migrates + seeds on first start
```

Environment variables (see `.env.example`):

| Var | Purpose |
| --- | ------- |
| `DATABASE_URL` | PostgreSQL connection string |
| `FRONTEND_ORIGIN` | Comma-separated CORS allowlist, e.g. `http://localhost:3000,http://localhost:3100` |
| `ADMIN_KEY` | Required in production; guards `POST /api/auth/bootstrap-seller` |
| `SELLER_EMAIL` / `SELLER_PASSWORD` | Optional: provisions the first seller at boot |
| `KHALTI_SECRET_KEY`, `ESEWA_SECRET_KEY`, `ESEWA_PRODUCT_CODE` | Payment gateways (sandbox defaults work in dev) |

Production boots fail fast when `ADMIN_KEY` or `FRONTEND_ORIGIN` are missing.

### Frontend (port 3000)

```bash
cd frontend
bun install
bun run dev            # Next.js dev server
```

Demo data seeds one seller shop (`anita@paubhastudio.com.np` / `demo123456`), 13 products including three live auctions, and two blog stories. Images are self-hosted from `frontend/public/art/`.

## Tests

```bash
cd backend
bun run test           # spins up the API against scratch DB kalabazaar_test
                       # covers auth, orders, bids, payments verify, rate limits
```

Requires a local PostgreSQL reachable with `framecraft/framecraft` (the suite recreates `kalabazaar_test` on every run).

## Key pages

| Path | Purpose |
| ---- | ------- |
| `/shop` | Marketplace — category chips, search, **Auction-only toggle**, sort/filters (URL-synced) |
| `/products/[id]` | Product detail — fixed-price buy or live auction UI (bid history, countdown, min increment), likes, comments, reviews, seller follow |
| `/checkout` | Login-gated — eSewa/Khalti redirect or offline methods, gateway return handling |
| `/sellers` · `/sellers/[id]` | Artist directory & public profile (shop, stories, followers) |
| `/blog` · `/blog/[slug]` | Seller stories with comments |
| `/account` | Orders (with guest order tracking), my bids, saved, settings |
| `/dashboard` | Seller console — listings, stories, orders |
| `/admin` | Owner console — analytics, orders, users, settings |

Both **English** (default) and **नेपाली** are supported, with Bikram Sambat dates and Devanagari numerals in the Nepali locale.

## Full stack with Podman

```bash
cp .env.example .env            # optional — sensible defaults are baked in
podman-compose -f podman-compose.yaml up --build -d
podman-compose -f podman-compose.yaml ps
```

Healthchecks gate startup order (postgres → backend → frontend). Useful commands:

```bash
podman-compose -f podman-compose.yaml logs -f backend   # watch the API boot
podman-compose -f podman-compose.yaml exec backend bun run seed   # reseed demo content
podman-compose -f podman-compose.yaml down              # stop (data persists)
podman-compose -f podman-compose.yaml down -v           # stop + wipe the database
```

## Hosting

- **API — live:** https://kalabazaar-api.onrender.com (Render free web service `kalabazaar-api`, defined by `render.yaml`; `/api/health` responds 200). Postgres is the Neon free tier via `DATABASE_URL`.
- **Frontend — not deployed:** this repo has no linked Vercel project, and `framecraft.vercel.app` is an unrelated site. Follow [`DEPLOY.md`](DEPLOY.md) to publish the Next.js frontend (Vercel + Render + Neon, including the `render.yaml` blueprint and cross-site cookie/CORS settings).
- Local full-stack development stays on `podman-compose.yaml`; the cloud setup does not change it.
