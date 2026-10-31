import { gateway, generateText, type LanguageModel, Output } from "ai";
import { eq } from "drizzle-orm";
import * as z from "zod";
import type { ContentDb } from "@/db/content/client";
import { items } from "@/db/content/schema";
import type { AgeBand } from "@/db/family/schema";
import { DEFAULT_TEST_MODEL, isBlockedModel } from "@/lib/ai/model";
import { moduleAgent, moduleSkill } from "./agents";
import { createDraft, ensureCollection } from "./library";
import { MODULES } from "./modules";

const Batch = z.object({
  items: z.array(
    z.object({
      title: z.string().min(1).max(80),
      parts: z.array(z.string().min(1).max(800)).min(1).max(8),
      tags: z.array(z.string().max(30)).max(5).optional().default([]),
    }),
  ),
});

export function generatorModelName(): string {
  const name = process.env.CONTENT_MODEL || process.env.WHYZY_MODEL || DEFAULT_TEST_MODEL;
  if (isBlockedModel(name)) throw new Error(`Model ${name} is not allowed`);
  return name;
}

// Operator-only. Generates a batch with the module's agent and skill and
// stores each new item as a draft. Never runs while a child uses the app.
export async function generateDrafts(
  db: ContentDb,
  opts: { moduleId: string; collectionSlug: string; ageBand: AgeBand; count: number },
  generator: { model: LanguageModel; name: string } = { model: gateway(generatorModelName()), name: generatorModelName() },
): Promise<string[]> {
  const mod = MODULES.find((m) => m.id === opts.moduleId);
  const col = mod?.collections.find((c) => c.slug === opts.collectionSlug);
  if (!mod || !col) throw new Error(`Unknown module or collection: ${opts.moduleId}/${opts.collectionSlug}`);
  const agent = moduleAgent(mod.id);
  const skill = moduleSkill(mod.id);
  const collectionId = await ensureCollection(db, { moduleId: mod.id, slug: col.slug, title: col.title });
  const existing = (await db.select({ title: items.title }).from(items).where(eq(items.collectionId, collectionId))).map((r) => r.title);

  const { output } = await generateText({
    model: generator.model,
    instructions: `${agent.body}\n\n${skill.body}`,
    output: Output.object({ schema: Batch }),
    prompt: [
      `Collection: ${col.title}.`,
      `Age band: ${opts.ageBand}.`,
      `Write ${Math.min(opts.count, 10)} new items.`,
      existing.length ? `Existing titles (do not repeat): ${existing.slice(-50).join("; ")}.` : "",
    ].join("\n"),
    temperature: 0.8,
  });

  const ids: string[] = [];
  for (const it of output.items.slice(0, opts.count)) {
    const id = await createDraft(db, {
      collectionId,
      moduleId: mod.id,
      title: it.title,
      ageBands: [opts.ageBand],
      parts: it.parts,
      tags: it.tags,
      source: "generated",
      agentVersion: agent.version,
      skillVersion: skill.version,
      model: generator.name,
    });
    if (id) ids.push(id);
  }
  return ids;
}
