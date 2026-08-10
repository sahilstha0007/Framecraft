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
**Commit:** pending
