import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/central/schema";
import {
  generateAccessKey,
  hashAccessKey,
  registerParent,
  storeAccessKeys,
} from "@/lib/access-keys";

let dir: string;
let db: ReturnType<typeof drizzle<typeof schema>>;
const DAY = 86_400_000;
const parent = (accessKey: string, email = "parent@example.test") => ({
  name: "Test Parent",
  email,
  passwordHash: "scrypt$test",
  accessKey,
});

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), "whyzy-test-"));
  db = drizzle(createClient({ url: `file:${join(dir, "central.db")}` }), { schema });
  await migrate(db, { migrationsFolder: "drizzle/central" });
});

afterEach(() => {
  db.$client.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("access keys", () => {
  it("stores only the hash, never the key", async () => {
    const key = generateAccessKey();
    await storeAccessKeys(db, [key], new Date(Date.now() + DAY));
    const rows = await db.select().from(schema.accessKeys);
    expect(rows).toHaveLength(1);
    expect(rows[0].keyHash).toBe(hashAccessKey(key));
    expect(JSON.stringify(rows)).not.toContain(key);
  });

  it("registers a parent and spends the key", async () => {
    const key = generateAccessKey();
    await storeAccessKeys(db, [key], new Date(Date.now() + DAY));
    const result = await registerParent(db, parent(key, "  Parent@Example.TEST "));
    expect(result.ok).toBe(true);

    const user = await db.select().from(schema.users).get();
    expect(user?.email).toBe("parent@example.test");
    const row = await db.select().from(schema.accessKeys).get();
    expect(row?.usedBy).toBe(user?.id);
    expect(row?.usedAt).not.toBeNull();
  });

  it("rejects an unknown key without creating a user", async () => {
    expect(await registerParent(db, parent("wz_unknown"))).toEqual({ ok: false, error: "invalid_key" });
    expect(await db.select().from(schema.users)).toHaveLength(0);
  });

  it("rejects an expired key", async () => {
    const key = generateAccessKey();
    await storeAccessKeys(db, [key], new Date(Date.now() - 1000));
    expect(await registerParent(db, parent(key))).toEqual({ ok: false, error: "invalid_key" });
  });

  it("allows each key only once", async () => {
    const key = generateAccessKey();
    await storeAccessKeys(db, [key], new Date(Date.now() + DAY));
    expect((await registerParent(db, parent(key, "a@example.test"))).ok).toBe(true);
    expect(await registerParent(db, parent(key, "b@example.test"))).toEqual({ ok: false, error: "invalid_key" });
  });

  it("keeps a key spent after its parent is deleted", async () => {
    const key = generateAccessKey();
    await storeAccessKeys(db, [key], new Date(Date.now() + DAY));
    const result = await registerParent(db, parent(key, "a@example.test"));
    if (!result.ok) throw new Error("setup failed");
    await db.delete(schema.users).where(eq(schema.users.id, result.userId));
    expect(await registerParent(db, parent(key, "b@example.test"))).toEqual({ ok: false, error: "invalid_key" });
  });

  it("rejects a taken email and leaves the key unspent", async () => {
    const [k1, k2] = [generateAccessKey(), generateAccessKey()];
    await storeAccessKeys(db, [k1, k2], new Date(Date.now() + DAY));
    await registerParent(db, parent(k1));
    expect(await registerParent(db, parent(k2))).toEqual({ ok: false, error: "email_taken" });
    const k2Row = await db
      .select()
      .from(schema.accessKeys)
      .where(eq(schema.accessKeys.keyHash, hashAccessKey(k2)))
      .get();
    expect(k2Row?.usedAt).toBeNull();
  });
});
