import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MockLanguageModelV4 } from "ai/test";
import { simulateReadableStream } from "ai";
import { childProfiles } from "@/db/family/schema";
import type { AgeBand, InputLanguage } from "@/db/family/schema";
import { openFamilyDb, type FamilyDb } from "@/lib/family-db";
import type { ModelRef } from "@/lib/chat/generate";

export async function tempFamily() {
  const dir = mkdtempSync(join(tmpdir(), "whyzy-chat-"));
  const db: FamilyDb = await openFamilyDb(`test-${Math.random().toString(16).slice(2)}`, `file:${join(dir, "f.db")}`);
  return { db, cleanup: () => { (db as unknown as { $client: { close(): void } }).$client.close(); rmSync(dir, { recursive: true, force: true }); } };
}

export async function addChild(db: FamilyDb, ageBand: AgeBand = "7-9", inputLanguage: InputLanguage = "en", dailyMinutes = 30) {
  const [c] = await db
    .insert(childProfiles)
    .values({ displayName: "Test Kid", ageBand, avatarPet: "boba", inputLanguage, dailyMinutes })
    .returning();
  return c;
}

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 1, text: 1, reasoning: undefined },
};

// A fake model that answers with fixed text and records how often it was called.
export function mockModel(answer: string | (() => string)) {
  const calls: unknown[] = [];
  const model = new MockLanguageModelV4({
    doStream: async (options) => {
      calls.push(options);
      const text = typeof answer === "function" ? answer() : answer;
      return {
        stream: simulateReadableStream({
          chunks: [
            { type: "text-start", id: "t" },
            { type: "text-delta", id: "t", delta: text },
            { type: "text-end", id: "t" },
            { type: "finish", finishReason: { unified: "stop", raw: undefined }, logprobs: undefined, usage },
          ],
        }),
      };
    },
  });
  const ref: () => ModelRef = () => ({ model });
  return { ref, calls };
}

export const json = (text: string, picture = "") => JSON.stringify({ text, picture });

// A fake model for generateText calls (content generator and validator).
export function mockGenerateModel(answer: string | (() => string)) {
  const calls: unknown[] = [];
  const model = new MockLanguageModelV4({
    doGenerate: async (options) => {
      calls.push(options);
      const text = typeof answer === "function" ? answer() : answer;
      return { content: [{ type: "text", text }], finishReason: { unified: "stop", raw: undefined }, usage, warnings: [] };
    },
  });
  return { model, calls };
}

export async function tempContentDb() {
  const { mkdtempSync: mk, rmSync: rm } = await import("node:fs");
  const { createClient: cc } = await import("@libsql/client");
  const { drizzle: dz } = await import("drizzle-orm/libsql");
  const { migrate } = await import("drizzle-orm/libsql/migrator");
  const schema = await import("@/db/content/schema");
  const { syncModules } = await import("@/lib/content/library");
  const dir = mk(join(tmpdir(), "whyzy-content-"));
  const db = dz(cc({ url: `file:${join(dir, "content.db")}` }), { schema });
  await migrate(db, { migrationsFolder: "drizzle/content" });
  await syncModules(db);
  return { db, cleanup: () => { (db as unknown as { $client: { close(): void } }).$client.close(); rm(dir, { recursive: true, force: true }); } };
}
