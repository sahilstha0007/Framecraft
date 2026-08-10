import { app } from "./app";
import { config } from "./config";
import { db, migrate } from "./db";
import { seedIfEmpty } from "./db/seed";

// Wait for PostgreSQL to accept connections before migrating — the container
// may start before the database is ready even with compose healthchecks.
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    await db.unsafe("SELECT 1");
    break;
  } catch (err) {
    if (attempt === 29) throw err;
    console.log(`[boot] waiting for PostgreSQL… (${attempt + 1}/30)`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

await migrate();
await seedIfEmpty();

await app.listen(config.port);

const origin = app.server?.url?.origin ?? `http://localhost:${config.port}`;
console.log(`🦊 FrameCraft API running at ${origin}`);
console.log(`   Health check: ${origin}/api/health`);
console.log(`   Allowed CORS origin: ${config.frontendOrigin}`);
console.log(`   Database: ${config.databaseUrl}`);
