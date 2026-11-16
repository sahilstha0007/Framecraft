
# Kala Bazaar (formerly FrameCraft) — Project Structure

Nepali art marketplace & social platform. Monorepo with two independent workspaces:

- `frontend/` — **Next.js 16** app (App Router, React 19, Tailwind v4). Scripts: `bun run dev` (`next dev`, port 3000), `bun run build`, `bun run lint`, `bun run typecheck`. Marketplace-only UI; demo product images live in `frontend/public/art/`.
- `backend/` — **Elysia** REST API on Bun with **PostgreSQL via built-in `Bun.sql`** (`backend/src/db.ts`). Scripts: `bun run dev` (port 3001), `bun run test` (integration tests against scratch DB `kalabazaar_test`; needs local PostgreSQL `framecraft`/`framecraft`), `bun run seed`, `bun run typecheck`.

---

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- The API uses PostgreSQL through built-in `Bun.sql` (see `backend/src/db.ts`). Don't use `pg`, `postgres.js` or `bun:sqlite` here.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```
