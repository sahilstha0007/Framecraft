import { Elysia } from "elysia";

export const healthRoutes = new Elysia({ prefix: "/api/health" }).get("/", () => ({
  status: "ok",
  service: "framecraft-api",
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
}));
