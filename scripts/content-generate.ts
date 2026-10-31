// Operator-only content generation for one module and collection.
//   npm run content:generate -- <module> <collection> <age-band> <count>
// New items are stored as drafts, checked, and published if they pass.
import { getContentDb } from "../src/db/content/client";
import { AGE_BANDS, type AgeBand } from "../src/db/family/schema";
import { generateDrafts } from "../src/lib/content/generate";
import { defaultValidator, validateAndPublish } from "../src/lib/content/validate";

async function main() {
  const [moduleId, collectionSlug, band, n] = process.argv.slice(2);
  const count = Number(n ?? 3);
  if (!moduleId || !collectionSlug || !AGE_BANDS.includes(band as AgeBand) || !(count >= 1 && count <= 10)) {
    throw new Error("Usage: content:generate -- <module> <collection> <4-6|7-9|10-12|13+> <1-10>");
  }
  const db = getContentDb();
  const validator = defaultValidator();
  const ids = await generateDrafts(db, { moduleId, collectionSlug, ageBand: band as AgeBand, count });
  console.log(`Generated ${ids.length} new draft(s).`);
  for (const id of ids) {
    const r = await validateAndPublish(db, id, validator);
    console.log(`${r.status.toUpperCase()} ${id}${r.category ? ` (${r.category})` : ""}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
