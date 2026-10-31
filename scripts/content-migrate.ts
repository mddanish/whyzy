// Applies content DB migrations and syncs the module list.
//   npm run content:migrate
import { migrate } from "drizzle-orm/libsql/migrator";
import { getContentDb } from "../src/db/content/client";
import { syncModules } from "../src/lib/content/library";

async function main() {
  const db = getContentDb();
  await migrate(db, { migrationsFolder: "drizzle/content" });
  await syncModules(db);
  console.log("Content database migrated and modules synced.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
