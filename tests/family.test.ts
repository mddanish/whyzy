import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as central from "@/db/central/schema";
import { childProfiles, settings } from "@/db/family/schema";
import { generateAccessKey, registerParent, storeAccessKeys } from "@/lib/access-keys";
import { decodeChildCookie, encodeChildCookie } from "@/lib/child-mode";
import { deleteParentAccount, ensureFamily, familyDb } from "@/lib/family";

let dir: string;
let db: ReturnType<typeof drizzle<typeof central>>;

async function newParent(email = "parent@example.test") {
  const key = generateAccessKey();
  await storeAccessKeys(db, [key], new Date(Date.now() + 86_400_000));
  const r = await registerParent(db, { name: "Test Parent", email, passwordHash: "scrypt$x", accessKey: key });
  if (!r.ok) throw new Error("setup failed");
  return r.userId;
}

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), "whyzy-family-"));
  process.env.FAMILY_DB_LOCAL_DIR = join(dir, "families");
  process.env.AUTH_SECRET = "test-secret-not-real";
  db = drizzle(createClient({ url: `file:${join(dir, "central.db")}` }), { schema: central });
  await migrate(db, { migrationsFolder: "drizzle/central" });
});

afterEach(() => {
  db.$client.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("family databases", () => {
  it("creates one family database per parent, with default settings", async () => {
    const parentId = await newParent();
    const fam = await ensureFamily(db, parentId);
    expect(fam.dbName).toMatch(/^wz-fam-[0-9a-f]{16}$/);
    expect(fam.dbName).not.toContain("parent");
    expect(await ensureFamily(db, parentId)).toEqual(fam);

    const fdb = await familyDb(fam);
    const s = await fdb.select().from(settings).get();
    expect(s).toMatchObject({ loggingEnabled: false, retentionDays: 7, parentPinHash: null, consentAt: null });
  });

  it("stores child profiles with an age band, never a birth date", async () => {
    const fdb = await familyDb(await ensureFamily(db, await newParent()));
    await fdb.insert(childProfiles).values({ displayName: "Test Kid", ageBand: "4-6", avatarPet: "boba", inputLanguage: "hi" });
    const child = await fdb.select().from(childProfiles).get();
    expect(child).toMatchObject({ ageBand: "4-6", inputLanguage: "hi", dailyMinutes: 30 });
    expect(Object.keys(child!).join()).not.toMatch(/birth|dob/i);
  });

  it("account deletion drops the family database and central rows", async () => {
    const parentId = await newParent();
    const fam = await ensureFamily(db, parentId);
    const file = fam.dbUrl.slice("file:".length);
    expect(existsSync(file)).toBe(true);

    await deleteParentAccount(db, parentId);
    expect(existsSync(file)).toBe(false);
    expect(await db.select().from(central.users).where(eq(central.users.id, parentId))).toHaveLength(0);
    expect(await db.select().from(central.families)).toHaveLength(0);
    const key = await db.select().from(central.accessKeys).get();
    expect(key?.usedAt).not.toBeNull(); // key stays spent
  });
});

describe("child mode cookie", () => {
  it("accepts only an untampered cookie for the same parent", () => {
    const c = encodeChildCookie("p1", "c1");
    expect(decodeChildCookie(c, "p1")).toBe("c1");
    expect(decodeChildCookie(c, "p2")).toBeNull();
    expect(decodeChildCookie(c.replace("c1", "c2"), "p1")).toBeNull();
    expect(decodeChildCookie("junk", "p1")).toBeNull();
  });
});
