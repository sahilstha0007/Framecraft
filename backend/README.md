# Kala Bazaar API

REST API for the Kala Bazaar art marketplace, built with **[Elysia](https://elysiajs.com)** on **Bun**, persisted with **PostgreSQL** via built-in `Bun.sql`.

## Run

```bash
bun install
cp .env.example .env   # DATABASE_URL, FRONTEND_ORIGIN, ADMIN_KEY…
bun run dev            # http://localhost:3001
```

On first start the database is migrated and seeded: the shop catalog (13 products incl. three live auctions) and a **demo seller** (`anita@paubhastudio.com.np` / `demo123456`) with two blog stories. Legacy studio tables (frames, gallery, bookings, quotes, …) are dropped automatically on boot.

## Scripts

| Script              | Description                       |
| ------------------- | --------------------------------- |
| `bun run dev`       | Start with hot reload             |
| `bun run start`     | Start without reload              |
| `bun run seed`      | Re-seed catalog + demo content    |
| `bun run test`      | Integration tests — boots the real server against scratch DB `kalabazaar_test`; covers auth, orders, bids, payments verify, rate limiting (needs local PostgreSQL `framecraft`/`framecraft`) |
| `bun run typecheck` | TypeScript check (`tsc --noEmit`) |

## Configuration

| Env var           | Default                                  | Description                              |
| ----------------- | ---------------------------------------- | ---------------------------------------- |
| `PORT`            | `3001`                                   | API port                                 |
| `FRONTEND_ORIGIN` | `http://localhost:3000`                  | Comma-separated CORS allowlist; required in production |
| `DATABASE_URL`    | `postgres://framecraft:framecraft@localhost:5432/framecraft` | PostgreSQL connection string |
| `ADMIN_KEY`       | `dev-admin-key`                          | Guards seller bootstrap; **required in production** |
| `SELLER_EMAIL` / `SELLER_PASSWORD` | —                       | Provisions the first seller account at boot |
| `KHALTI_SECRET_KEY` | —                                      | Khalti gateway secret (sandbox: `dev.khalti.com`) |
| `ESEWA_PRODUCT_CODE` | `EPAYTEST`                           | eSewa merchant code (sandbox default)    |
| `ESEWA_SECRET_KEY` | sandbox test key                        | eSewa HMAC secret key                    |

Production (`NODE_ENV=production`) refuses to boot without `ADMIN_KEY` + `FRONTEND_ORIGIN`.

## Auth & roles

Session auth via httpOnly cookie (`fc_session`). Three roles:

- `customer` — browse, buy, bid, follow, like, comment, review
- `seller` — everything above + own shop (products, stories, orders)
- `admin` — the owner console

Registration is open self-signup (`role: "customer" | "seller"`).

## Endpoints

Full machine-readable index: `GET /api`. Highlights:

### System
- `GET /api` · `GET /api/health`

### Auth & account
- `POST /api/auth/register` — sign up (`name`, `email`, `password`, optional `role`, `shopName`, `bio`)
- `POST /api/auth/login` · `POST /api/auth/logout` (deletes the session server-side) · `GET /api/auth/me`
- `PUT /api/me/profile` · `PUT /api/me/password`
- `GET /api/me/bids` · `GET /api/me/likes` · `GET /api/me/notifications`

### Shop & auctions
- `GET /api/products` — auction-aware (`?category=`, `?search=`, `?auction=1`); lazy-closes expired auctions
- `GET /api/products/:id` — with seller info, current bid & bid count
- `POST /api/products/:id/bid` — transactional; enforces min. increment, no self-outbidding
- `GET /api/products/:id/bids` · `GET /api/products/:id/engagement`
- `POST /api/orders` — server-side pricing, **atomic stock guard** (`UPDATE … WHERE stock >= qty`)
- `GET /api/my/orders` · `GET /api/orders/:id/events` (guest order tracking)

### Social
- `POST`/`DELETE /api/products/:id/like` · `POST`/`DELETE /api/sellers/:id/follow`
- `GET /api/sellers` · `GET /api/sellers/:id`
- `GET/POST /api/comments` (`targetType`: product \| post)
- `GET /api/posts` · `GET /api/posts/:slug`
- `GET/POST /api/products/:id/reviews` · `PUT /api/reviews/:id/reply` (seller only)

### Seller shop (auth: seller)
- `GET/POST/PUT/DELETE /api/seller/products(:id)` · `POST /api/seller/products/:id/end`
- `GET /api/seller/posts` · `POST/PUT/DELETE /api/posts`
- `GET /api/seller/orders` · `PATCH /api/seller/orders/:id`
- `GET /api/seller/analytics`

### Payments (sandbox-first)
- `POST /api/payments/checkout` — Khalti (`payment_url`) or eSewa (form fields)
- `GET /api/payments/verify/khalti?pidx=` — server-side lookup verify
- `GET /api/payments/verify/esewa?data=` — HMAC signature verify + redirect

### Admin (auth: admin)
- `GET /api/admin/analytics` — revenue, orders, users, trending, category breakdown
- `GET/PATCH/DELETE /api/users(:id)` — roles & removal (self-mutation refused)
- `GET/PATCH /api/orders(:id)` · `GET/PUT /api/settings`
- `POST/PUT/DELETE /api/products(:id)` — marketplace catalog CRUD

## Rate limits

Fixed-window per IP: `POST /api/auth/login` 10/min · `/api/auth/register`, `/api/payments/*`, `POST /api/orders` 20/min → `429` beyond that.

## Example

```bash
# Register a customer, then place an order
curl -c cj -X POST localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada","email":"ada@b.com","password":"secret1"}'

curl -b cj -X POST localhost:3001/api/orders \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":1,"quantity":2}],"address":"Patan, Lalitpur","paymentMethod":"eSewa"}'
```
