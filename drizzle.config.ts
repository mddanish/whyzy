import { defineConfig } from "drizzle-kit";

// Generates SQL migrations only; apply them with `npm run db:migrate`.
export default defineConfig({
  dialect: "turso",
  schema: "./src/db/central/schema.ts",
  out: "./drizzle/central",
});
