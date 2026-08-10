import { app } from "./app";
import { config } from "./config";
import { migrate } from "./db";
import { seedIfEmpty } from "./db/seed";

await migrate();
await seedIfEmpty();

await app.listen(config.port);

const origin = app.server?.url?.origin ?? `http://localhost:${config.port}`;
console.log(`🦊 FrameCraft API running at ${origin}`);
console.log(`   Health check: ${origin}/api/health`);
console.log(`   Allowed CORS origin: ${config.frontendOrigin}`);
console.log(`   Database: ${config.databaseUrl}`);
