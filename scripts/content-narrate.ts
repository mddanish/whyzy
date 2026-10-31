// Makes narration audio once for every published card part that has none,
// with ElevenLabs (ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID). Operator only.
//   npm run content:narrate
import { getContentDb } from "../src/db/content/client";
import { narrateAll } from "../src/lib/content/narrate";

async function main() {
  const { items, parts } = await narrateAll(getContentDb());
  console.log(`Narrated ${parts} part(s) across ${items} item(s).`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
