# FrameCraft API

REST API for the FrameCraft studio + art marketplace, built with **[Elysia](https://elysiajs.com)** on **Bun**, persisted with SQLite via `bun:sqlite`.

## Run

```bash
bun install
cp .env.example .env   # optional — sensible dev defaults
bun run dev            # http://localhost:3001
```

On first start the database is migrated and seeded: the studio catalog (frames, gallery, services, testimonials, team, glass & mat options), the shop catalog, and a **demo seller** with auction items and stories.

## Scripts

| Script              | Description                       |
| ------------------- | --------------------------------- |
| `bun run dev`       | Start with hot reload             |
| `bun run start`     | Start without reload              |
| `bun run seed`      | Re-seed catalog + demo content    |
| `bun test`          | Run integration tests (58)        |
| `bun run typecheck` | TypeScript check (`tsc --noEmit`) |

> **Note:** `bun test` drops and recreates all tables in the dev database before running — point `DATABASE_URL` at a scratch database if you have data you care about.

## Configuration

| Env var           | Default                                  | Description                              |
| ----------------- | ---------------------------------------- | ---------------------------------------- |
| `PORT`            | `3001`                                   | API port                                 |
| `FRONTEND_ORIGIN` | `http://localhost:3000`                  | Allowed CORS origin                      |
| `DATABASE_URL`    | `file:./framecraft.db`                   | SQLite file (bun:sqlite)                 |
| `KHALTI_SECRET_KEY` | —                                      | Khalti gateway secret (sandbox: `dev.khalti.com`) |
| `ESEWA_MERCHANT_ID` | `EPAYTEST`                            | eSewa merchant id (sandbox default)      |
| `ESEWA_SECRET_KEY` | —                                       | eSewa HMAC secret key                    |

## Auth & roles

Session auth via httpOnly cookie (`fc_session`). Three roles:

- `customer` — browse, buy, bid, follow, like, comment
- `seller` — everything above + own shop (products, stories, orders)
- `admin` — the studio owner's full console

Registration is open self-signup (`role: "customer" | "seller"`); the seeded admin account is the studio owner.

## Endpoints

### System
- `GET /api` — endpoint index
- `GET /api/health` — health check

### Auth & account
- `POST /api/auth/register` — sign up (`name`, `email`, `password`, optional `role`, `shopName`, `bio`)
- `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me`
- `PUT /api/me/profile` — name, bio, avatar, shopName, location, website
- `PUT /api/me/password` — change password (needs current password)
- `GET /api/me/bids` — my bids (with winning status)
- `GET /api/me/likes` — my saved products

### Studio catalog (read-only, seeded)
- `GET /api/frames`, `/api/gallery`, `/api/services`, `/api/testimonials`, `/api/team`
- `GET /api/options/glass-types`, `/api/options/mat-options`
- `GET /api/frames/:id`, `/api/gallery/:id`, `/api/services/:id`

### Quote calculator
- `POST /api/quote` — compute a custom-frame price (frame + mat + glass × size factor × qty), optionally persisted
- `GET /api/quotes/:id` — fetch a persisted quote

### Shop
- `GET /api/products` — all products (auction-aware, `?category=`, `?search=`, `?auction=1`); lazy-closes expired auctions
- `GET /api/products/:id` — single product with seller info, current bid & bid count
- `POST /api/orders` — place an order (auth required). Server-side pricing, **atomic stock guard** (`UPDATE … WHERE stock >= qty` in a transaction) — overselling is impossible
- `GET /api/my/orders` — the signed-in customer's orders

### Auctions & bids
- `POST /api/products/:id/bid` — place a bid (auth, transactional; enforces min. increment, can't outbid yourself)
- `GET /api/products/:id/bids` — bid history
- `GET /api/products/:id/engagement` — like count + liked-by-me

### Social
- `POST` / `DELETE /api/products/:id/like` — like / unlike
- `POST` / `DELETE /api/sellers/:id/follow` — follow / unfollow
- `GET /api/sellers` — seller directory (`?search=`)
- `GET /api/sellers/:id` — public profile (followers, products, posts)
- `GET/POST /api/comments` — comments on products or posts (`targetType`, `targetId`); `DELETE /api/comments/:id`
- `GET /api/posts` · `GET /api/posts/:slug` — public stories feed + single post

### Seller shop (auth: seller)
- `GET/POST /api/seller/products`, `PUT/DELETE /api/seller/products/:id` — own products (auction fields)
- `POST /api/seller/products/:id/end` — end an auction early
- `GET /api/seller/posts` — own posts including drafts
- `POST/PUT/DELETE /api/posts` — publish / update / delete own posts
- `GET /api/seller/orders` · `PATCH /api/seller/orders/:id` — own shop orders + status updates

### Payments (sandbox-first)
- `POST /api/payments/checkout` — initiate Khalti (returns `payment_url`) or eSewa (returns form fields) for an order
- `GET /api/payments/khalti/verify?pidx=&orderId=` — server-side Khalti lookup verify
- `GET /api/payments/esewa/verify` — eSewa HMAC signature verify + success redirect

### Admin console (auth: admin)
- `GET/PATCH/DELETE /api/users` — every account; promote/demote between customer → seller → admin (self-mutation refused)
- `GET/PATCH /api/orders`, `GET/PATCH /api/bookings`, `GET/PATCH /api/quotes` — manage orders, bookings, quotes
- `GET/PUT /api/settings` — studio contact settings
- `POST/PUT/DELETE /api/products` — the studio's own shop catalog (with auction fields)
- `POST/PUT/DELETE /api/{gallery,frames,services,testimonials,team,glass-types,mat-options}` — content management

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
