import type { ModelMessage } from "ai";
import { eq } from "drizzle-orm";
import { conversations, messages } from "@/db/family/schema";
import type { childProfiles, settings } from "@/db/family/schema";
import type { FamilyDb } from "@/lib/family-db";
import { generateReply, type ModelRef } from "./generate";
import { takeMessageSlot, usedSeconds } from "./usage";

type Child = typeof childProfiles.$inferSelect;
type Settings = typeof settings.$inferSelect;

export type Turn = { role: "child" | "whyzy"; text: string };
export type ChatResult = {
  text: string;
  picture: string;
  kind: "reply" | "redirect" | "distress" | "fallback" | "limit" | "slow_down";
};

export const SLOW_DOWN = "Let's take a little breath. Ask me again in a moment!";
export const TIME_UP = "That's all for today! Great job learning. Let's talk again tomorrow.";
export const FALLBACK = "Hmm, let's talk about something else. What animal do you like?";

const MAX_TURNS = 10;
const MAX_CHARS = 500;

export async function handleChildMessage(opts: {
  db: FamilyDb;
  child: Child;
  settings: Settings;
  chatId: string;
  turns: Turn[];
  model: () => ModelRef;
  signal?: AbortSignal;
}): Promise<ChatResult> {
  const { db, child } = opts;
  const turns = opts.turns.slice(-MAX_TURNS).map((t) => ({ ...t, text: t.text.slice(0, MAX_CHARS) }));
  const input = turns.at(-1);
  if (!input || input.role !== "child" || !input.text.trim()) {
    return { text: FALLBACK, picture: "", kind: "fallback" };
  }

  if ((await usedSeconds(db, child.id)) >= child.dailyMinutes * 60) {
    return { text: TIME_UP, picture: "", kind: "limit" };
  }
  if (!(await takeMessageSlot(db, child.id))) {
    return { text: SLOW_DOWN, picture: "", kind: "slow_down" };
  }

  const history: ModelMessage[] = turns.map((t) => ({
    role: t.role === "child" ? "user" : "assistant",
    content: t.text,
  }));

  let result: ChatResult;
  try {
    const reply = await generateReply(opts.model(), {
      ageBand: child.ageBand,
      interests: child.interests,
      history,
      signal: opts.signal,
    });
    result = { text: reply.text, picture: reply.picture ?? "", kind: "reply" };
  } catch (err) {
    console.error(`[chat] model error child=${child.id} type=${(err as Error)?.name ?? "unknown"}`);
    result = { text: FALLBACK, picture: "", kind: "fallback" };
  }

  if (opts.settings.loggingEnabled) await logTurn(db, child.id, opts.chatId, input.text, result.text, false);
  return result;
}

export async function logTurn(
  db: FamilyDb,
  childId: string,
  chatId: string,
  childText: string,
  replyText: string,
  flagged: boolean,
) {
  const existing = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.id, chatId)).get();
  if (!existing) await db.insert(conversations).values({ id: chatId, childId });
  await db.insert(messages).values([
    { conversationId: chatId, role: "child", text: childText, flagged },
    { conversationId: chatId, role: "whyzy", text: replyText, flagged: false },
  ]);
}
