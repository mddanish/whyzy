// Checks every draft (rules, then the LLM validator) and publishes the ones
// that pass; the rest are rejected with the reason. Prints IDs and results only.
//   npm run content:validate
import { eq } from "drizzle-orm";
import { getContentDb } from "../src/db/content/client";
import { narrateAll } from "../src/lib/content/narrate";
import { items } from "../src/db/content/schema";
import { defaultValidator, validateAndPublish } from "../src/lib/content/validate";

async function main() {
  const db = getContentDb();
  const validator = defaultValidator();
  const drafts = await db.select({ id: items.id }).from(items).where(eq(items.status, "draft"));
  const tally = { published: 0, rejected: 0, skipped: 0, error: 0 };
  const pause = Number(process.env.VALIDATE_DELAY_MS ?? 0); // free tiers rate-limit
  for (const { id } of drafts) {
    if (pause) await new Promise((r) => setTimeout(r, pause));
    const r = await validateAndPublish(db, id, validator);
    tally[r.status]++;
    console.log(`${r.status.toUpperCase()} ${id}${r.category ? ` (${r.category})` : ""}`);
  }
  console.log(`Done: ${JSON.stringify(tally)}`);
  // Narration is made once per published item (no-op without ElevenLabs).
  const narrated = await narrateAll(db);
  console.log(`Narrated ${narrated.parts} part(s).`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
