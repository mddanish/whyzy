import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ContentDb } from "@/db/content/client";
import { items } from "@/db/content/schema";
import type { AgeBand } from "@/db/family/schema";
import { moduleAgent, moduleSkill, validatorAgent } from "@/lib/content/agents";
import { generateDrafts } from "@/lib/content/generate";
import { createDraft, ensureCollection, getItem } from "@/lib/content/library";
import { MODULES } from "@/lib/content/modules";
import { loadSeed, readSeedFiles } from "@/lib/content/seed";
import { checkContentRules, validateAndPublish } from "@/lib/content/validate";
import { mockGenerateModel, tempContentDb } from "./support/helpers";

let db: ContentDb;
let cleanup: () => void;
beforeEach(async () => ({ db, cleanup } = await tempContentDb()));
afterEach(() => cleanup());

const SAFE = JSON.stringify({ safe: true, ageFit: true, category: "", reason: "" });
const UNSAFE = JSON.stringify({ safe: false, ageFit: true, category: "scary", reason: "Frightening for the age band." });
const validator = (answer: string | (() => string)) => {
  const m = mockGenerateModel(answer);
  return { v: { model: m.model, name: "test-validator" }, calls: m.calls };
};

async function draft(parts: string[], ageBands: AgeBand[] = ["4-6"], title = "A Kind Cat") {
  const collectionId = await ensureCollection(db, { moduleId: "stories", slug: "animal-stories", title: "Animal stories" });
  return (await createDraft(db, { collectionId, moduleId: "stories", title, ageBands, parts }))!;
}

describe("agents and skills", () => {
  it.each(MODULES.map((m) => [m.id, m] as const))("%s has a versioned AGENT.md and SKILL.md", (_id, m) => {
    expect(moduleAgent(m.id).version).toBe("1");
    const skill = moduleSkill(m.id);
    expect(skill.version).toBe("1");
    for (const c of m.collections) expect(skill.body).toContain(`\`${c.slug}\``);
    expect(moduleAgent(m.id).body).toMatch(/## Never/);
  });
  it("has a validator agent", () => {
    expect(validatorAgent().body).toMatch(/"safe"/);
  });
});

describe("seed content", () => {
  const seed = readSeedFiles();
  it("covers every module", () => {
    expect(seed.map((f) => f.module).sort()).toEqual(MODULES.map((m) => m.id).sort());
  });
  it.each(seed.flatMap((f) => f.items.map((i) => [`${f.module}: ${i.title}`, i] as const)))("%s passes the rule check", (_n, i) => {
    expect(checkContentRules(i)).toEqual({ ok: true });
  });
  it("loads as drafts only, once", async () => {
    const first = await loadSeed(db);
    expect(first.created).toBeGreaterThanOrEqual(24);
    expect((await loadSeed(db)).created).toBe(0);
    const statuses = new Set((await db.select({ s: items.status }).from(items)).map((r) => r.s));
    expect([...statuses]).toEqual(["draft"]);
  });
});

describe("validation pipeline", () => {
  it("publishes an item that passes both checks, with the verdict stored", async () => {
    const id = await draft(["The cat shared her milk with a little kitten."]);
    const { v } = validator(SAFE);
    expect(await validateAndPublish(db, id, v)).toEqual({ id, status: "published" });
    const row = await db.select().from(items).where(eq(items.id, id)).get();
    expect(row).toMatchObject({ status: "published", validatorModel: "test-validator", validatorVerdict: { safe: true } });
    expect(await getItem(db, id, "4-6")).not.toBeNull();
  });

  it("rejects an item the LLM validator fails", async () => {
    const id = await draft(["The cat looked at the dark sky."]);
    const { v } = validator(UNSAFE);
    expect(await validateAndPublish(db, id, v)).toMatchObject({ status: "rejected", category: "llm:scary" });
    expect(await getItem(db, id, "4-6")).toBeNull();
  });

  it("rejects when the content is not right for the age band", async () => {
    const id = await draft(["The cat thought about photosynthesis."]);
    const { v } = validator(JSON.stringify({ safe: true, ageFit: false, category: "", reason: "" }));
    expect(await validateAndPublish(db, id, v)).toMatchObject({ status: "rejected", category: "llm:age_fit" });
  });

  it("fails closed when the validator errors: the item stays an unpublished draft", async () => {
    const id = await draft(["The cat napped in the sun."]);
    const { v } = validator(() => { throw new Error("down"); });
    expect(await validateAndPublish(db, id, v)).toMatchObject({ status: "error", category: "llm:validator_error" });
    expect((await db.select().from(items).where(eq(items.id, id)).get())?.status).toBe("draft");
    expect(await getItem(db, id, "4-6")).toBeNull();
  });

  it("fails closed when the validator returns junk", async () => {
    const id = await draft(["The cat napped in the shade."]);
    const { v } = validator("I think it is fine");
    expect((await validateAndPublish(db, id, v)).status).toBe("error");
    expect(await getItem(db, id, "4-6")).toBeNull();
  });

  it("skips items that are not drafts", async () => {
    const id = await draft(["The cat played."]);
    const { v } = validator(SAFE);
    await validateAndPublish(db, id, v);
    expect((await validateAndPublish(db, id, v)).status).toBe("skipped");
  });
});

type ContentCase = { id: string; ageBands: AgeBand[]; title: string; parts: string[] };
const contentCases = (JSON.parse(readFileSync("tests/redteam/content-cases.json", "utf8")) as { version: number; items: ContentCase[] }).items;

describe("red team: unsafe content never publishes", () => {
  it.each(contentCases.map((c) => [c.id, c] as const))("%s is rejected by rules, before the LLM", async (_id, c) => {
    const id = await draft(c.parts, c.ageBands, c.title);
    const { v, calls } = validator(SAFE); // even a validator that says "safe" cannot save it
    const r = await validateAndPublish(db, id, v);
    expect(r.status).toBe("rejected");
    expect(r.category).toMatch(/^rules:/);
    expect(calls).toHaveLength(0);
  });
});

describe("generation", () => {
  it("stores generated items as drafts with metadata and skips duplicates", async () => {
    const batch = JSON.stringify({
      items: [
        { title: "Puddle Jump", parts: ["Riya jumped in a puddle. Splash!"], tags: ["rain"] },
        { title: "Puddle Jump", parts: ["Riya jumped in a puddle. Splash!"], tags: ["rain"] },
      ],
    });
    const g = mockGenerateModel(batch);
    const ids = await generateDrafts(db, { moduleId: "stories", collectionSlug: "adventure-stories", ageBand: "4-6", count: 2 }, { model: g.model, name: "test-generator" });
    expect(ids).toHaveLength(1);
    const row = await db.select().from(items).where(eq(items.id, ids[0])).get();
    expect(row).toMatchObject({ status: "draft", agentVersion: "1", skillVersion: "1", model: "test-generator", ageBands: ["4-6"], source: "generated" });
    expect(JSON.stringify(g.calls[0])).toContain("Stories agent");
  });

  it("refuses unknown modules", async () => {
    const g = mockGenerateModel("{}");
    await expect(generateDrafts(db, { moduleId: "nope", collectionSlug: "x", ageBand: "4-6", count: 1 }, { model: g.model, name: "t" })).rejects.toThrow();
  });
});
