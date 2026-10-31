import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

async function main() {
  // Same precedence as src/db/central/client.ts.
  const url = process.env.CENTRAL_DB_URL || process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set");
  const authToken = process.env.CENTRAL_DB_URL ? process.env.CENTRAL_DB_TOKEN : process.env.TURSO_AUTH_TOKEN;
  const db = drizzle(createClient({ url, authToken }));
  await migrate(db, { migrationsFolder: "drizzle/central" });
  console.log("Central database migrated.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
