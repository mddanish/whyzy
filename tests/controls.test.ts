import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ContentDb } from "@/db/content/client";
import { childProfiles } from "@/db/family/schema";
import { createDraft, ensureCollection, getItem, listItems, listModules, setStatus } from "@/lib/content/library";
import { MODULES } from "@/lib/content/modules";
import { allowedModuleIds, chatAllowed, type Controls, moduleAllowed, parseControls } from "@/lib/controls";
import type { FamilyDb } from "@/lib/family-db";
import { addChild, tempContentDb, tempFamily } from "./support/helpers";

const form = (entries: [string, string][]) => {
  const f = new FormData();
  for (const [k, v] of entries) f.append(k, v);
  return f;
};

describe("parent controls", () => {
  it("default to Whyzy off, chat off, audio only", async () => {
    const { db, cleanup } = await tempFamily();
    try {
      const child = await addChild(db as FamilyDb);
      const row = (await db.select().from(childProfiles).where(eq(childProfiles.id, child.id)).get())!;
      expect(row).toMatchObject({ whyzyEnabled: false, chatEnabled: false, showText: false, allowedModules: null });
      expect(allowedModuleIds(row)).toEqual([]);
      expect(chatAllowed(row)).toBe(false);
    } finally {
      cleanup();
    }
  });

  it("parses the form: all modules ticked means null (all)", () => {
    const all = parseControls(form([["whyzyEnabled", "on"], ...MODULES.map((m) => ["modules", m.id] as [string, string])]));
    expect(all).toEqual({ whyzyEnabled: true, allowedModules: null, chatEnabled: false, showText: false });
    const some = parseControls(form([["whyzyEnabled", "on"], ["modules", "stories"], ["modules", "not-a-module"], ["chatEnabled", "on"], ["showText", "on"]]));
    expect(some).toEqual({ whyzyEnabled: true, allowedModules: ["stories"], chatEnabled: true, showText: true });
  });

  it("the master switch turns everything off", () => {
    const off: Controls = { whyzyEnabled: false, allowedModules: null, chatEnabled: true, showText: true };
    expect(allowedModuleIds(off)).toEqual([]);
    expect(chatAllowed(off)).toBe(false);
    expect(moduleAllowed(off, "stories")).toBe(false);
  });

  it("chat needs both Whyzy and chat on", () => {
    expect(chatAllowed({ whyzyEnabled: true, allowedModules: null, chatEnabled: false, showText: false })).toBe(false);
    expect(chatAllowed({ whyzyEnabled: true, allowedModules: [], chatEnabled: true, showText: false })).toBe(true);
  });
});

describe("content respects allowed modules", () => {
  let db: ContentDb;
  let cleanup: () => void;
  beforeEach(async () => ({ db, cleanup } = await tempContentDb()));
  afterEach(() => cleanup());

  it("hides items from modules the parent did not allow", async () => {
    const collectionId = await ensureCollection(db, { moduleId: "poems", slug: "nature-poems", title: "Nature poems" });
    const id = (await createDraft(db, { collectionId, moduleId: "poems", title: "Rain", ageBands: ["4-6"], parts: ["Pitter patter, rain on the roof."] }))!;
    await setStatus(db, id, "validated");
    await setStatus(db, id, "published");

    const onlyStories = allowedModuleIds({ whyzyEnabled: true, allowedModules: ["stories"], chatEnabled: false, showText: false });
    expect(await listModules(db, "4-6", onlyStories)).toEqual([]);
    expect(await listItems(db, collectionId, "4-6", onlyStories)).toEqual([]);
    expect(await getItem(db, id, "4-6", onlyStories)).toBeNull();

    const withPoems = allowedModuleIds({ whyzyEnabled: true, allowedModules: ["poems"], chatEnabled: false, showText: false });
    expect(await getItem(db, id, "4-6", withPoems)).not.toBeNull();
  });
});
