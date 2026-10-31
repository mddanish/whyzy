import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { messages, settings } from "@/db/family/schema";
import { modelConfig } from "@/lib/ai/model";
import { systemPrompt, PERSONA_LINE, INTRO_LINE } from "@/lib/ai/prompt";
import { parseLoose } from "@/lib/chat/generate";
import { FALLBACK, handleChildMessage, SLOW_DOWN, TIME_UP } from "@/lib/chat/service";
import { addSeconds, MAX_PER_MINUTE } from "@/lib/chat/usage";
import type { FamilyDb } from "@/lib/family-db";
import { addChild, json, mockModel, tempFamily } from "./support/helpers";

let db: FamilyDb;
let cleanup: () => void;
beforeEach(async () => ({ db, cleanup } = await tempFamily()));
afterEach(() => cleanup());

const s = async () => (await db.select().from(settings).get())!;
const ask = async (text: string, model = mockModel(json("The sky looks blue because of sunlight.", "sky")), child?: Awaited<ReturnType<typeof addChild>>) =>
  handleChildMessage({ db, child: child ?? (await addChild(db)), settings: await s(), chatId: "chat-00000001", turns: [{ role: "child", text }], model: model.ref });

describe("model config", () => {
  it("uses the free test model by default with no data-use flags", () => {
    expect(modelConfig("test", "nvidia/nemotron-3.5-lightning-free")).toEqual({ name: "nvidia/nemotron-3.5-lightning-free", providerOptions: {} });
  });
  it("blocks free models in the pilot and forces no-training, zero retention", () => {
    expect(() => modelConfig("pilot", "nvidia/nemotron-3.5-lightning-free")).toThrow(/test-only/);
    expect(modelConfig("pilot", "anthropic/claude-haiku-5.5").providerOptions).toEqual({
      gateway: { disallowPromptTraining: true, zeroDataRetention: true },
    });
  });
  it("blocks Gemini in every stage", () => {
    expect(() => modelConfig("test", "google/gemini-3-flash")).toThrow();
  });
});

describe("system prompt", () => {
  it("contains the fixed persona lines and English-only rule for every band", () => {
    for (const band of ["4-6", "7-9", "10-12", "13+"] as const) {
      const p = systemPrompt({ ageBand: band });
      expect(p).toContain(PERSONA_LINE);
      expect(p).toContain(INTRO_LINE);
      expect(p).toMatch(/Always reply in English/);
    }
    expect(systemPrompt({ ageBand: "4-6" })).toMatch(/4 to 6/);
  });
});

describe("chat service", () => {
  it("returns the structured reply", async () => {
    expect(await ask("Why is the sky blue?")).toEqual({ text: "The sky looks blue because of sunlight.", picture: "sky", kind: "reply" });
  });

  it("falls back to plain text when the model ignores JSON", () => {
    expect(parseLoose("Plants drink water.")).toEqual({ text: "Plants drink water.", picture: "" });
  });

  it("gives a safe fallback when the model fails", async () => {
    const broken = mockModel(() => { throw new Error("down"); });
    expect((await ask("Hello", broken)).text).toBe(FALLBACK);
  });

  it("stops at the daily time limit without calling the model", async () => {
    const child = await addChild(db, "7-9", "en", 5);
    for (let i = 0; i < 5; i++) await addSeconds(db, child.id, 60);
    const m = mockModel(json("hi"));
    expect(await ask("Hello", m, child)).toMatchObject({ text: TIME_UP, kind: "limit" });
    expect(m.calls).toHaveLength(0);
  });

  it("rate-limits each child", async () => {
    const child = await addChild(db);
    for (let i = 0; i < MAX_PER_MINUTE; i++) expect((await ask("Hi", undefined, child)).kind).toBe("reply");
    expect((await ask("Hi", undefined, child)).text).toBe(SLOW_DOWN);
  });

  it("stores messages only when logging is on", async () => {
    await ask("Why is the sky blue?");
    expect(await db.select().from(messages)).toHaveLength(0);
    await db.update(settings).set({ loggingEnabled: true }).where(eq(settings.id, 1));
    await ask("Why is the sky blue?");
    expect((await db.select().from(messages)).map((m) => m.role)).toEqual(["child", "whyzy"]);
  });
});
