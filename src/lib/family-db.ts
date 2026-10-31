import "server-only";
import { mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "@/db/family/schema";
import {
  createDatabase,
  createDatabaseToken,
  deleteDatabase,
  ensureMumbaiGroup,
  isPlatformConfigured,
} from "@/lib/turso-platform";

export type FamilyDb = LibSQLDatabase<typeof schema>;

// Where family databases live:
// - FAMILY_DB_LOCAL_DIR set: local SQLite files (development and tests only).
// - otherwise: one Turso database per family in Mumbai, via the Platform API.
const localDir = () => process.env.FAMILY_DB_LOCAL_DIR;

export class FamilySetupUnavailable extends Error {
  constructor() {
    super("family_db_unavailable");
  }
}

export function familyStorageReady(): boolean {
  return Boolean(localDir()) || isPlatformConfigured();
}

const MIGRATIONS = resolve(process.cwd(), "drizzle/family");

export function newFamilyDbName(): string {
  return `wz-fam-${randomBytes(8).toString("hex")}`;
}

// Creates an empty family database and applies migrations. Returns its URL.
export async function createFamilyDatabase(name: string): Promise<string> {
  let url: string;
  const dir = localDir();
  if (dir) {
    mkdirSync(dir, { recursive: true });
    url = `file:${join(dir, `${name}.db`)}`;
  } else {
    if (!isPlatformConfigured()) throw new FamilySetupUnavailable();
    const group = await ensureMumbaiGroup();
    const { hostname } = await createDatabase(name, group.name);
    url = `libsql://${hostname}`;
  }
  await openFamilyDb(name, url);
  return url;
}

export async function dropFamilyDatabase(name: string, url: string): Promise<void> {
  clients.delete(name);
  if (url.startsWith("file:")) {
    rmSync(url.slice("file:".length), { force: true });
    return;
  }
  await deleteDatabase(name);
}

type Cached = { db: FamilyDb; expires: number };
const clients = new Map<string, Cached>();
const TOKEN_TTL_MS = 20 * 60 * 60 * 1000; // tokens are issued for 1 day

// Opens a family database, applying any pending migrations once per instance.
export async function openFamilyDb(name: string, url: string): Promise<FamilyDb> {
  const cached = clients.get(name);
  if (cached && cached.expires > Date.now()) return cached.db;

  let authToken: string | undefined;
  if (!url.startsWith("file:")) {
    if (!isPlatformConfigured()) throw new FamilySetupUnavailable();
    authToken = await createDatabaseToken(name, "1d");
  }
  const db = drizzle(createClient({ url, authToken }), { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  await db.insert(schema.settings).values({ id: 1 }).onConflictDoNothing();
  clients.set(name, { db, expires: Date.now() + TOKEN_TTL_MS });
  return db;
}
