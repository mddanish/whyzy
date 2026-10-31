import { defineConfig } from "drizzle-kit";

// Migrations for every family database. Applied by the app when a family
// database is created or first opened (src/lib/family-db.ts).
export default defineConfig({
  dialect: "turso",
  schema: "./src/db/family/schema.ts",
  out: "./drizzle/family",
});
