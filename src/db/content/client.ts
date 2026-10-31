import { createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type ContentDb = LibSQLDatabase<typeof schema>;

// CONTENT_DB_URL / CONTENT_DB_TOKEN: the content database in Mumbai
// (file: URL for local development and tests).
export function contentDbConfigured(): boolean {
  return Boolean(process.env.CONTENT_DB_URL);
}

let db: ContentDb | undefined;

export function getContentDb(): ContentDb {
  if (!db) {
    const url = process.env.CONTENT_DB_URL;
    if (!url) throw new Error("CONTENT_DB_URL is not set");
    db = drizzle(createClient({ url, authToken: process.env.CONTENT_DB_TOKEN }), { schema });
  }
  return db;
}
