import type { ModelMessage } from "ai";
import { eq } from "drizzle-orm";
import { conversations, messages, safetyEvents } from "@/db/family/schema";
import type { childProfiles, settings } from "@/db/family/schema";
import type { FamilyDb } from "@/lib/family-db";
import { ALERT_INTENTS, classifyInput } from "@/lib/safety/classify";
import { moderateOutputModel, moderateOutputRules, type ModerationResult } from "@/lib/safety/moderate";
import { stripPersonalDetails } from "@/lib/safety/pii";
import { FIXED_REPLY, OUTPUT_FALLBACK, PII_REMINDER } from "@/lib/safety/responses";
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
export const FALLBACK = OUTPUT_FALLBACK;

const MAX_TURNS = 10;
const MAX_CHARS = 500;

export async function handleChildMessage(opts: {
  db: FamilyDb;
  child: Child;
  settings: Settings;
  chatId: string;
  turns: Turn[];
  model: () => ModelRef;
  moderate?: (reply: string) => Promise<ModerationResult>;
  signal?: AbortSignal;
}): Promise<ChatResult> {
  const { db, child } = opts;
  const turns = opts.turns.slice(-MAX_TURNS).map((t) => ({ ...t, text: t.text.slice(0, MAX_CHARS) }));
  const input = turns.at(-1);
  if (!input || input.role !== "child" || !input.text.trim()) {
    return { text: FALLBACK, picture: "", kind: "fallback" };
  }

  const log = (text: string, reply: string, flagged: boolean) =>
    opts.settings.loggingEnabled ? logTurn(db, child.id, opts.chatId, text, reply, flagged) : undefined;

  // 1. Input filter: classify intent before anything else.
  const intent = classifyInput(input.text, child.ageBand);
  const clean = stripPersonalDetails(input.text, { childName: child.displayName });
  if (intent !== "allowed") {
    const alert = ALERT_INTENTS.includes(intent);
    if (intent !== "persona") await recordSafetyEvent(db, child.id, intent, alert ? "parent_alert" : "redirected");
    await log(clean.text, FIXED_REPLY[intent], intent !== "persona");
    const kind = alert ? "distress" : "redirect";
    return { text: FIXED_REPLY[intent], picture: "", kind };
  }

  if ((await usedSeconds(db, child.id)) >= child.dailyMinutes * 60) {
    return { text: TIME_UP, picture: "", kind: "limit" };
  }
  if (!(await takeMessageSlot(db, child.id))) {
    return { text: SLOW_DOWN, picture: "", kind: "slow_down" };
  }

  if (clean.found.length > 0) await recordSafetyEvent(db, child.id, "personal_info", "stripped");

  // Earlier turns: strip details again and drop any Whyzy turn that would
  // fail moderation (the client sends the history, so it is not trusted).
  const history: ModelMessage[] = [];
  for (const t of turns.slice(0, -1)) {
    if (t.role === "whyzy" && !moderateOutputRules(t.text, child.ageBand).ok) continue;
    if (t.role === "child" && classifyInput(t.text, child.ageBand) !== "allowed") continue;
    const text = t.role === "child" ? stripPersonalDetails(t.text, { childName: child.displayName }).text : t.text;
    history.push({ role: t.role === "child" ? "user" : "assistant", content: text });
  }
  history.push({ role: "user", content: clean.text });

  // 2. Model call with the age-band system prompt.
  let reply: { text: string; picture?: string };
  try {
    reply = await generateReply(opts.model(), {
      ageBand: child.ageBand,
      interests: child.interests,
      history,
      signal: opts.signal,
    });
  } catch (err) {
    console.error(`[chat] model error child=${child.id} type=${(err as Error)?.name ?? "unknown"}`);
    return { text: FALLBACK, picture: "", kind: "fallback" };
  }

  // 3. Output moderation before the child sees or hears anything.
  let verdict = moderateOutputRules(reply.text, child.ageBand);
  if (verdict.ok) verdict = await (opts.moderate ?? ((r) => moderateOutputModel(r, child.ageBand)))(reply.text);
  if (!verdict.ok) {
    await recordSafetyEvent(db, child.id, `output_${verdict.category}`, "replaced_with_fallback");
    await log(clean.text, FALLBACK, true);
    return { text: FALLBACK, picture: "", kind: "fallback" };
  }

  const picture = /^[a-z ]{0,30}$/i.test(reply.picture ?? "") ? (reply.picture ?? "").trim().toLowerCase() : "";
  const text = (clean.found.length > 0 ? PII_REMINDER : "") + reply.text.trim();
  await log(clean.text, text, clean.found.length > 0);
  return { text, picture, kind: "reply" };
}

export async function recordSafetyEvent(db: FamilyDb, childId: string, category: string, actionTaken: string) {
  await db.insert(safetyEvents).values({ childId, category, actionTaken });
  console.warn(`[safety] child=${childId} category=${category} action=${actionTaken}`);
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
