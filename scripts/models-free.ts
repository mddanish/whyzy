// Lists OpenRouter's free models and checks which ones actually answer with
// this API key (many ask for billing or a data policy change). Test only:
// made-up prompt, no child data. Writes docs/FREE_MODELS.md.
//   OPENROUTER_API_KEY=... npm run models:free
import { writeFileSync } from "node:fs";

const API = "https://openrouter.ai/api/v1";
const PROMPT = 'Reply as JSON only: {"text": "<one short sentence for a 6 year old about why the sky is blue>", "picture": "sky"}';

type Model = { id: string; name: string; context_length?: number; pricing?: { prompt?: string; completion?: string }; architecture?: { input_modalities?: string[]; output_modalities?: string[] } };
type Result = { id: string; ok: boolean; ms: number; json: boolean; note: string };

const isFree = (m: Model) => m.id.endsWith(":free") || (m.pricing?.prompt === "0" && m.pricing?.completion === "0");
const textOut = (m: Model) => !m.architecture?.output_modalities || m.architecture.output_modalities.includes("text");

async function check(id: string, key: string): Promise<Result> {
  const t = Date.now();
  try {
    const res = await fetch(`${API}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Title": "Whyzy model check" },
      body: JSON.stringify({ model: id, messages: [{ role: "user", content: PROMPT }], max_tokens: 1500, temperature: 0 }),
      signal: AbortSignal.timeout(60_000),
    });
    const body = (await res.json().catch(() => ({}))) as {
      error?: { code?: number; message?: string };
      choices?: { message?: { content?: string } }[];
    };
    const ms = Date.now() - t;
    if (!res.ok || body.error) {
      return { id, ok: false, ms, json: false, note: `${res.status} ${(body.error?.message ?? "").slice(0, 120)}` };
    }
    const text = body.choices?.[0]?.message?.content ?? "";
    let json = false;
    try {
      json = typeof JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "").text === "string";
    } catch {}
    return { id, ok: text.trim().length > 0, ms, json, note: text.trim() ? "" : "empty reply" };
  } catch (err) {
    return { id, ok: false, ms: Date.now() - t, json: false, note: (err as Error).name };
  }
}

async function main() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");
  const all = ((await (await fetch(`${API}/models`)).json()) as { data: Model[] }).data;
  const free = all.filter((m) => isFree(m) && textOut(m)).sort((a, b) => a.id.localeCompare(b.id));
  console.log(`${free.length} free text models. Checking each…`);
  const results: Result[] = [];
  for (const m of free) {
    const r = await check(m.id, key);
    results.push(r);
    console.log(`${r.ok ? "OK  " : "FAIL"} ${m.id} ${r.ms}ms${r.json ? " json" : ""} ${r.note}`);
  }
  const blocked = (id: string) => (id.startsWith("google/") ? " (blocked: Gemini/Google terms)" : "");
  const rows = results.map(
    (r) => `| \`${r.id}\`${blocked(r.id)} | ${r.ok ? "yes" : "no"} | ${r.ok ? (r.json ? "yes" : "no") : "-"} | ${r.ms} | ${r.note.replace(/\|/g, "/")} |`,
  );
  writeFileSync(
    "docs/FREE_MODELS.md",
    `# Free OpenRouter models (test phase only)\n\nChecked ${new Date().toISOString().slice(0, 10)} with \`npm run models:free\`. Made-up prompt only. Free models may keep prompts for training: never use them with real children's data.\n\n| Model | Works | Valid JSON | ms | Note |\n|---|---|---|---|---|\n${rows.join("\n")}\n`,
  );
  console.log("Wrote docs/FREE_MODELS.md");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
