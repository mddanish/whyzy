// Usage: npm run keys:create -- [count] [days]
// Prints new pilot access keys once. Only their hashes are stored.
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/db/central/schema";
import { generateAccessKey, storeAccessKeys } from "../src/lib/access-keys";

async function main() {
  const count = Number(process.argv[2] ?? 1);
  const days = Number(process.argv[3] ?? 30);
  if (!(count >= 1 && count <= 50) || !(days >= 1 && days <= 365)) {
    throw new Error("count must be 1–50 and days 1–365");
  }
  // Same precedence as src/db/central/client.ts.
  const url = process.env.CENTRAL_DB_URL || process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set");
  const authToken = process.env.CENTRAL_DB_URL ? process.env.CENTRAL_DB_TOKEN : process.env.TURSO_AUTH_TOKEN;
  const db = drizzle(createClient({ url, authToken }), { schema });

  const keys = Array.from({ length: count }, generateAccessKey);
  const expiresAt = new Date(Date.now() + days * 86_400_000);
  await storeAccessKeys(db, keys, expiresAt);

  console.log(`Created ${count} key(s), expiring ${expiresAt.toISOString()}. Share each with one family:`);
  for (const k of keys) console.log(k);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
