// Loads content/seed/*.json into the content DB as drafts, then run
// `npm run content:validate` to check and publish them.
import { getContentDb } from "../src/db/content/client";
import { syncModules } from "../src/lib/content/library";
import { loadSeed } from "../src/lib/content/seed";

async function main() {
  const db = getContentDb();
  await syncModules(db);
  const { created, skipped } = await loadSeed(db);
  console.log(`Seed drafts created: ${created}, already present: ${skipped}.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
