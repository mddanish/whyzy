import { gateway, generateText, type LanguageModel, Output } from "ai";
import { asc, eq } from "drizzle-orm";
import * as z from "zod";
import type { ContentDb } from "@/db/content/client";
import { itemParts, items } from "@/db/content/schema";
import { AGE_BANDS, type AgeBand } from "@/db/family/schema";
import { isBlockedModel } from "@/lib/ai/model";
import { moderateOutputRules } from "@/lib/safety/moderate";
import { validatorAgent } from "./agents";
import { setStatus } from "./library";

// Upper limits per age band (words per part, parts per item).
export const LIMITS: Record<AgeBand, { words: number; parts: number }> = {
  "4-6": { words: 30, parts: 4 },
  "7-9": { words: 60, parts: 5 },
  "10-12": { words: 90, parts: 6 },
  "13+": { words: 120, parts: 7 },
};

export type Check = { ok: true } | { ok: false; category: string };

const youngest = (bands: AgeBand[]) => AGE_BANDS.find((b) => bands.includes(b)) ?? "4-6";

// Step 1: the same rules as chat output moderation, plus length limits.
// Checked against the youngest age band the item is for.
export function checkContentRules(item: { title: string; parts: string[]; ageBands: AgeBand[] }): Check {
  const band = youngest(item.ageBands);
  const limit = LIMITS[band];
  if (item.parts.length === 0) return { ok: false, category: "empty" };
  if (item.parts.length > limit.parts) return { ok: false, category: "too_many_parts" };
  for (const text of [item.title, ...item.parts]) {
    if (text.split(/\s+/).length > limit.words) return { ok: false, category: "part_too_long" };
    const v = moderateOutputRules(text, band);
    if (!v.ok) return v;
  }
  return { ok: true };
}

const Verdict = z.object({
  safe: z.boolean(),
  ageFit: z.boolean(),
  category: z.string().optional().default(""),
  reason: z.string().optional().default(""),
});
export type Verdict = z.infer<typeof Verdict>;

export function validatorModelName(): string {
  const name = process.env.CONTENT_VALIDATOR_MODEL || process.env.MODERATION_MODEL;
  if (!name) throw new Error("Set CONTENT_VALIDATOR_MODEL (or MODERATION_MODEL)");
  if (isBlockedModel(name)) throw new Error(`Model ${name} is not allowed`);
  return name;
}

// Step 2: a separate LLM call checks safety and age fit. Fails closed.
export async function checkContentLlm(
  model: LanguageModel,
  item: { title: string; parts: string[]; ageBands: AgeBand[]; moduleId: string; source: string },
): Promise<{ check: Check; verdict: Verdict | { error: string } }> {
  try {
    const { output } = await generateText({
      model,
      instructions: validatorAgent().body,
      output: Output.object({ schema: Verdict }),
      prompt: JSON.stringify({
        module: item.moduleId,
        ageBands: item.ageBands,
        source: item.source,
        title: item.title,
        parts: item.parts,
      }),
      maxOutputTokens: 200,
      temperature: 0,
    });
    const ok = output.safe && output.ageFit;
    return {
      check: ok ? { ok: true } : { ok: false, category: `llm:${output.category || (output.safe ? "age_fit" : "unsafe")}` },
      verdict: output,
    };
  } catch (err) {
    return { check: { ok: false, category: "llm:validator_error" }, verdict: { error: (err as Error).name } };
  }
}

// "error": the validator could not run (network, quota, bad output). The item
// stays a draft, unpublished, so it can be checked again later.
export type PipelineResult = { id: string; status: "published" | "rejected" | "skipped" | "error"; category?: string };

// Runs both checks on one draft. Passing items are published at once
// (operator decision); failing items are rejected with the reason.
export async function validateAndPublish(
  db: ContentDb,
  id: string,
  validator: { model: LanguageModel; name: string },
): Promise<PipelineResult> {
  const row = await db.select().from(items).where(eq(items.id, id)).get();
  if (!row || row.status !== "draft") return { id, status: "skipped" };
  const parts = (
    await db.select({ text: itemParts.text }).from(itemParts).where(eq(itemParts.itemId, id)).orderBy(asc(itemParts.idx))
  ).map((p) => p.text);
  const item = { ...row, parts };

  const rules = checkContentRules(item);
  if (!rules.ok) {
    await setStatus(db, id, "rejected", { rejectReason: `rules:${rules.category}` });
    return { id, status: "rejected", category: `rules:${rules.category}` };
  }

  const { check, verdict } = await checkContentLlm(validator.model, item);
  if (!check.ok && check.category === "llm:validator_error") return { id, status: "error", category: check.category };
  if (!check.ok) {
    await setStatus(db, id, "rejected", { rejectReason: check.category, validatorModel: validator.name, validatorVerdict: verdict });
    return { id, status: "rejected", category: check.category };
  }
  await setStatus(db, id, "validated", { validatorModel: validator.name, validatorVerdict: verdict });
  await setStatus(db, id, "published");
  return { id, status: "published" };
}

export function defaultValidator() {
  const name = validatorModelName();
  return { model: gateway(name), name };
}
