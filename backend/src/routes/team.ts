import { Elysia } from "elysia";
import { all } from "../db";

export const teamRoutes = new Elysia({ prefix: "/api/team" }).get("/", async () => {
  const rows = await all("SELECT * FROM team_members ORDER BY id");
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    bio: r.bio,
    image: r.image,
    experience: r.experience,
  }));
});
