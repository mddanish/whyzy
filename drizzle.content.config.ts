import { defineConfig } from "drizzle-kit";

// Migrations for the content database. Apply with `npm run content:migrate`.
export default defineConfig({
  dialect: "turso",
  schema: "./src/db/content/schema.ts",
  out: "./drizzle/content",
});
