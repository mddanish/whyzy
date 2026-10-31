import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/content/schema";
import type { ContentDb } from "@/db/content/client";
import {
  createDraft,
  ensureCollection,
  getItem,
  listCollections,
  listItems,
  listModules,
  setStatus,
  syncModules,
} from "@/lib/content/library";
import { MODULES } from "@/lib/content/modules";

let dir: string;
let db: ContentDb;

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), "whyzy-content-"));
  db = drizzle(createClient({ url: `file:${join(dir, "content.db")}` }), { schema });
  await migrate(db, { migrationsFolder: "drizzle/content" });
  await syncModules(db);
});
afterEach(() => {
  (db as unknown as { $client: { close(): void } }).$client.close();
  rmSync(dir, { recursive: true, force: true });
});

async function story(title: string, ageBands: ("4-6" | "7-9" | "10-12" | "13+")[] = ["4-6", "7-9"]) {
  const collectionId = await ensureCollection(db, { moduleId: "stories", slug: "animals", title: "Animal stories", emoji: "🐘" });
  const id = await createDraft(db, {
    collectionId,
    moduleId: "stories",
    title,
    ageBands,
    parts: ["Once upon a time a small elephant found a red ball.", "She shared it with her friends. The end."],
    tags: ["sharing"],
  });
  return { id: id!, collectionId };
}

async function publish(id: string) {
  await setStatus(db, id, "validated", { validatorModel: "test-validator", validatorVerdict: { safe: true } });
  await setStatus(db, id, "published");
}

describe("content library", () => {
  it("syncs all modules", async () => {
    expect((await db.select().from(schema.modules)).map((m) => m.id)).toEqual(MODULES.map((m) => m.id));
    await syncModules(db); // idempotent
    expect(await db.select().from(schema.modules)).toHaveLength(MODULES.length);
  });

  it("shows children published items only", async () => {
    const { id, collectionId } = await story("The red ball");
    expect(await listModules(db, "4-6")).toEqual([]);
    expect(await getItem(db, id, "4-6")).toBeNull();

    await setStatus(db, id, "validated");
    expect(await listItems(db, collectionId, "4-6")).toEqual([]); // validated is not enough

    await setStatus(db, id, "published");
    expect((await listModules(db, "4-6")).map((m) => [m.id, m.count])).toEqual([["stories", 1]]);
    expect((await listCollections(db, "stories", "4-6")).map((c) => c.title)).toEqual(["Animal stories"]);
    expect((await listItems(db, collectionId, "4-6")).map((i) => i.title)).toEqual(["The red ball"]);
    const item = await getItem(db, id, "4-6");
    expect(item?.parts).toHaveLength(2);
    expect(item?.parts[0]).toMatch(/^Once upon a time/);
  });

  it("filters by age band", async () => {
    const { id } = await story("Big kid story", ["10-12"]);
    await publish(id);
    expect(await listModules(db, "4-6")).toEqual([]);
    expect(await getItem(db, id, "4-6")).toBeNull();
    expect(await getItem(db, id, "10-12")).not.toBeNull();
  });

  it("can restrict modules to the ones a parent allows", async () => {
    const { id } = await story("The red ball");
    await publish(id);
    expect(await listModules(db, "7-9", ["poems"])).toEqual([]);
    expect(await listModules(db, "7-9", ["stories"])).toHaveLength(1);
  });

  it("unpublishing hides an item at once", async () => {
    const { id } = await story("The red ball");
    await publish(id);
    await setStatus(db, id, "unpublished");
    expect(await getItem(db, id, "4-6")).toBeNull();
  });

  it("never publishes drafts or rejected items", async () => {
    const { id } = await story("The red ball");
    await expect(setStatus(db, id, "published")).rejects.toThrow(/draft to published/);
    await setStatus(db, id, "rejected", { rejectReason: "scary" });
    await expect(setStatus(db, id, "validated")).rejects.toThrow();
    const row = await db.select().from(schema.items).get();
    expect(row).toMatchObject({ status: "rejected", rejectReason: "scary" });
  });

  it("skips duplicate content", async () => {
    await story("The red ball");
    const collectionId = await ensureCollection(db, { moduleId: "stories", slug: "animals", title: "Animal stories" });
    const dup = await createDraft(db, {
      collectionId,
      moduleId: "stories",
      title: "The Red Ball",
      ageBands: ["4-6"],
      parts: ["Once upon a time a small elephant  found a red ball.", "She shared it with her friends. The end."],
    });
    expect(dup).toBeNull();
  });
});
