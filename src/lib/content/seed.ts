import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ContentDb } from "@/db/content/client";
import type { ItemSource } from "@/db/content/schema";
import type { AgeBand } from "@/db/family/schema";
import { createDraft, ensureCollection } from "./library";
import { MODULES } from "./modules";

export type SeedItem = { collection: string; title: string; ageBands: AgeBand[]; parts: string[]; tags: string[]; source: ItemSource };
export type SeedFile = { module: string; version: number; items: SeedItem[] };

const DIR = join(process.cwd(), "content", "seed");

export function readSeedFiles(): SeedFile[] {
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(DIR, f), "utf8")) as SeedFile);
}

// Stores seed items as drafts. They are published only after the same
// checks as generated content (npm run content:validate).
export async function loadSeed(db: ContentDb): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;
  for (const file of readSeedFiles()) {
    const mod = MODULES.find((m) => m.id === file.module);
    if (!mod) throw new Error(`Unknown module in seed: ${file.module}`);
    for (const it of file.items) {
      const col = mod.collections.find((c) => c.slug === it.collection);
      if (!col) throw new Error(`Unknown collection in seed: ${file.module}/${it.collection}`);
      const collectionId = await ensureCollection(db, { moduleId: mod.id, slug: col.slug, title: col.title });
      const id = await createDraft(db, {
        collectionId,
        moduleId: mod.id,
        title: it.title,
        ageBands: it.ageBands,
        parts: it.parts,
        tags: it.tags,
        source: it.source,
        agentVersion: `seed-v${file.version}`,
        model: "hand-written",
      });
      if (id) created++;
      else skipped++;
    }
  }
  return { created, skipped };
}
