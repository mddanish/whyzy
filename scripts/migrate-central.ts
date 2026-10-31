import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set");
  const db = drizzle(createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN }));
  await migrate(db, { migrationsFolder: "drizzle/central" });
  console.log("Central database migrated.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
