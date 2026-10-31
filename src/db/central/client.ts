import "server-only";
import { createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type CentralDb = LibSQLDatabase<typeof schema>;

let db: CentralDb | undefined;

export function getCentralDb(): CentralDb {
  if (!db) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) throw new Error("TURSO_DATABASE_URL is not set");
    db = drizzle(
      createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN }),
      { schema },
    );
  }
  return db;
}
