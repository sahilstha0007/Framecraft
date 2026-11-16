# Free-tier deployment: Vercel + Render + Neon

Three free accounts, no credit card required for the tiers used here:

| Part | Service | Free tier | URL |
| ---- | ------- | --------- | --- |
| Frontend (Next.js) | **Vercel Hobby** | 100 GB transfer, 1M CDN requests/mo | `https://<project>.vercel.app` |
| API (Bun/Elysia) | **Render free web service** | 750 instance-hours/mo, 512 MB | `https://kalabazaar-api.onrender.com` |
| Postgres | **Neon Free** | 1 GB storage, 100 CU-hours/mo, permanent (not a trial) | pooled connection string |

`render.yaml` in this repo defines the API service, so Render can create it from a blueprint. The frontend is deployed separately because Vercel builds the `frontend/` subdirectory.

> **Cloudflare:** free Cloudflare gives DNS/proxy and HTTPS, but the domain itself costs money. With free `vercel.app` / `onrender.com` subdomains you already get HTTPS — skip Cloudflare until you own a domain. If you later buy one, add it to Cloudflare, then set it as a custom domain in Vercel and Render.

## 1. Push the code

This repo's `origin` is already `git@github.com:sahilstha0007/Framecraft.git`. Commit the working changes and push to the branch you want deployed (the deploy config above expects it). Both Vercel and Render watch that repo.

## 2. Neon (database)

1. Sign up at <https://neon.com/signup> (free, no card).
2. Create a project; note the default branch is your database.
3. Copy the **pooled** connection string from the connection picker. It looks like
   `postgresql://user:pass@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`.
4. Keep `?sslmode=require` — the API needs TLS. Save it for step 3.

The API runs `migrate()` and `seedIfEmpty()` on first boot, so the schema and demo catalog are created automatically.

## 3. Render (API)

1. Sign up at <https://dashboard.render.com/register> (Hobby workspace is free).
2. **New → Blueprint** → connect the GitHub repo → select `render.yaml`.
3. Fill the prompted values:
   - `DATABASE_URL` — the Neon pooled string from step 2.
   - `ADMIN_KEY` — a long random string you'll remember (used to create the admin account).
   - `SELLER_EMAIL` / `SELLER_PASSWORD` — your seller login; these create the first seller on boot. Leave blank if you only want a customer account.
   - `FRONTEND_ORIGIN` — put `http://localhost:3000` for now; **update it to your Vercel URL in step 4**.
   - `KHALTI_SECRET_KEY`, `ESEWA_SECRET_KEY`, `ESEWA_PRODUCT_CODE` — leave blank to use the sandbox defaults.
4. Deploy and wait for `https://kalabazaar-api.onrender.com/api/health` to return JSON.

`SESSION_SAMESITE=None` is already set in the blueprint. Without it, login would silently break because the frontend and API are on different sites.

## 4. Vercel (frontend)

1. Sign up at <https://vercel.com/signup> with GitHub.
2. **Add New → Project** → import the same repo.
3. Set **Root Directory = `frontend`** (important — the Next.js app is not at the repo root). Framework should be detected as Next.js.
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://kalabazaar-api.onrender.com`
   - `NEXT_PUBLIC_SITE_URL` = `https://<your-project>.vercel.app` (no trailing slash — used for canonical/OG URLs)
5. Deploy. Then go back to Render → API service → Environment → set `FRONTEND_ORIGIN` to that exact Vercel URL and save (this triggers a redeploy).

`NEXT_PUBLIC_*` values are baked at build time, so changing them requires a redeploy. The API origin is read at runtime.

## 5. First login / admin

- **Seller:** the `SELLER_EMAIL` / `SELLER_PASSWORD` from step 3 work at `/login`.
- **Admin:** once the API is live, create the admin account with your `ADMIN_KEY`:

  ```bash
  curl -X POST https://kalabazaar-api.onrender.com/api/auth/bootstrap-seller \
    -H 'Content-Type: application/json' \
    -H 'x-admin-key: YOUR_ADMIN_KEY' \
    -d '{"name":"Owner","email":"you@example.com","password":"a-long-password"}'
  ```

  Then sign in at `/login` with that email.

## 6. Verify

- `/en/shop` shows products and auctions.
- Register a customer, log in, add to cart, place a COD order (no payment keys needed).
- Seller dashboard `/dashboard` and admin console `/admin` load.
- Check the browser console has no CORS or cookie errors.

## Gotchas

- **Cold starts:** a free Render web service sleeps after 15 minutes idle and takes about a minute to wake on the next request. First visit after a quiet period will be slow. Neon similarly scales to zero after 5 minutes (adds a few hundred ms).
- **Free ≠ production:** Render free instances have no persistent disk and can restart any time. All durable data lives in Neon, so restarts are safe, but this stack is for a demo/portfolio, not real customer traffic.
- **Vercel Hobby** is intended for personal/non-commercial projects. Check its terms before accepting real payments.
- **Payment gateways** are in sandbox mode with the default values. Real eSewa/Khalti require merchant keys and callback URLs registered with the gateway.
- **CORS must match exactly:** `FRONTEND_ORIGIN` is the browser origin (scheme + host + port), no trailing slash.
- Local development still uses `podman-compose.yaml` — none of the cloud config changes that.
