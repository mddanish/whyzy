import "server-only";
import { createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type CentralDb = LibSQLDatabase<typeof schema>;

let db: CentralDb | undefined;

// CENTRAL_DB_URL / CENTRAL_DB_TOKEN, when set, win over TURSO_DATABASE_URL /
// TURSO_AUTH_TOKEN. The Vercel Turso integration points TURSO_* at a fresh
// branch database for each deployment, so production sets CENTRAL_DB_* to
// the main database to keep its data across deploys.
export function centralDbConfig(): { url: string; authToken?: string } {
  const url = process.env.CENTRAL_DB_URL || process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set");
  const authToken = process.env.CENTRAL_DB_URL ? process.env.CENTRAL_DB_TOKEN : process.env.TURSO_AUTH_TOKEN;
  return { url, authToken };
}

export function getCentralDb(): CentralDb {
  db ??= drizzle(createClient(centralDbConfig()), { schema });
  return db;
}
