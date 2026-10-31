import { gateway, generateText, type LanguageModel, Output } from "ai";
import * as z from "zod";
import type { AgeBand } from "@/db/family/schema";
import { matches, normalize, RULES } from "./rules";

export type ModerationResult = { ok: true } | { ok: false; category: string };

// Things a reply must never do, beyond the topic rules.
const REPLY_RULES: { category: string; re: RegExp }[] = [
  { category: "claims_human", re: /\bi(?:'m| am) (?:a |an )?(?:real )?(?:person|human|boy|girl|man|woman|kid|child)\b/i },
  { category: "claims_friend", re: /\bi(?:'m| am) your (?:best |real )?friend\b|\bbest friends?\b/i },
  { category: "asks_personal", re: /\b(?:what(?:'s| is) your (?:address|school|phone|full name|last name|surname)|where do you live|which school|send (?:me )?(?:a )?(?:photo|picture))\b/i },
  { category: "secrets", re: /\b(?:our (?:little )?secret|keep (?:it|this) (?:a )?secret|don'?t tell (?:your |anyone)|just between us)\b/i },
  { category: "meeting", re: /\b(?:meet (?:you|me|up)|come over|visit you|see you in person)\b/i },
  { category: "dosage", re: /\b\d+\s?(?:mg|ml|milligrams?|tablets?|pills?)\b/i },
  { category: "not_english", re: /[ऀ-ॿ]/ },
];

const TOPIC_RULES = ["violence", "sexual", "substances", "medical", "links", "purchases", "self_harm"] as const;

export function moderateOutputRules(reply: string, ageBand: AgeBand): ModerationResult {
  const text = normalize(reply);
  if (!text) return { ok: false, category: "empty" };
  if (text.length > 1200) return { ok: false, category: "too_long" };
  for (const { category, re } of REPLY_RULES) if (re.test(text)) return { ok: false, category };
  for (const t of TOPIC_RULES) if (matches(RULES[t], text)) return { ok: false, category: t };
  if (ageBand !== "13+" && matches(RULES.scary, text)) return { ok: false, category: "scary" };
  return { ok: true };
}

const Verdict = z.object({ safe: z.boolean(), category: z.string().optional().default("") });

// Optional second check by a moderation model (MODERATION_MODEL). Fails closed.
export async function moderateOutputModel(
  reply: string,
  ageBand: AgeBand,
  model: LanguageModel | undefined = process.env.MODERATION_MODEL ? gateway(process.env.MODERATION_MODEL) : undefined,
): Promise<ModerationResult> {
  if (!model) return { ok: true };
  try {
    const { output } = await generateText({
      model,
      output: Output.object({ schema: Verdict }),
      instructions:
        `You review replies from a children's assistant for a child aged ${ageBand}. ` +
        "Unsafe: violence, weapons, sexual content, scary content, medicine or dosage advice, contact with strangers, " +
        "purchases, links, secrets from parents, asking for personal details, claiming to be a person or a friend, " +
        'or anything harmful for a child. Answer JSON {"safe": boolean, "category": string}.',
      prompt: `Reply to review:\n"""${reply.slice(0, 1500)}"""`,
      maxOutputTokens: 60,
      temperature: 0,
    });
    return output.safe ? { ok: true } : { ok: false, category: `model:${output.category || "unsafe"}` };
  } catch {
    return { ok: false, category: "moderation_error" };
  }
}
