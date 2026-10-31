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
