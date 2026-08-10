# FrameCraft

Premium Custom Framing Studio — and a marketplace & social platform for art. A monorepo with a **Next.js frontend** and an **Elysia (Bun) REST API backend**.

## Structure

```
framecraft/
├── frontend/   Next.js 16 app — App Router, React 19, Tailwind v4, Three.js
└── backend/    Elysia REST API on Bun — bun:sqlite persistence
```

## What it is

FrameCraft is three products in one:

- **Framing studio** — the original business: custom frame builder with live pricing, appointments, gallery, services, testimonials and contact.
- **Art marketplace** — customers browse and search products, buy via cart + checkout with Nepali payment gateways (eSewa & Khalti, sandbox-first), and **bid in auctions** on one-of-a-kind pieces.
- **Social platform** — every seller has a public profile and shop, can publish **stories/blog posts**, and customers can **follow sellers, like products and comment** on pieces and posts.

### Roles

| Role | What they can do |
| ---- | ---------------- |
| **customer** | Browse & search the shop, buy, bid in auctions, follow/like/comment, manage their account (orders, bids, saved, settings) |
| **seller** | Everything a customer can, plus a seller dashboard: list products (fixed-price or auctions), write stories, manage their own orders |
| **admin** | The studio owner: full admin console — users (3 roles), products, orders, bookings, quotes, gallery/frames/services content, shop settings |

Registration is open self-signup with a buyer/seller choice; the studio owner is the seeded `admin` account.

## Quick start

### Backend (port 3001)

```bash
cd backend
bun install
cp .env.example .env   # optional
bun run dev            # starts the API
```

The API auto-migrates and seeds the catalog (plus a demo seller, auctions and stories) on first start. See `backend/README.md` for the full endpoint list.

### Frontend (port 3000)

```bash
cd frontend
bun install
bun run dev            # Next.js dev server
```

## Key pages

| Path | Purpose |
| ---- | ------- |
| `/shop` | Marketplace — filter by category or **Auctions**, search products |
| `/products/[id]` | Product detail — fixed-price buy, or the live auction UI (bid history, countdown, min. increment), likes & comments, seller card with follow |
| `/checkout` | Login-gated checkout — eSewa / Khalti redirect or offline methods |
| `/sellers` · `/sellers/[id]` | Seller directory & public profile (shop, stories, followers) |
| `/blog` · `/blog/[slug]` | Seller stories with comments |
| `/account` | Customer hub — Orders, My bids, Saved, Settings (profile + password + become a seller) |
| `/dashboard` | Seller console — products, stories, orders |
| `/admin` | Studio admin console — users, products, orders, bookings, quotes, content, settings |

Both **English** (default) and **Nepali** are supported, with Bikram Sambat dates and Devanagari numerals in the Nepali locale.

## Requirements

- [Bun](https://bun.com) ≥ 1.3 (Node is used under the hood by Next.js)
