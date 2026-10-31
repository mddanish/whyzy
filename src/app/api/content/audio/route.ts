import { contentDbConfigured, getContentDb } from "@/db/content/client";
import { getItem } from "@/lib/content/library";
import { getPartAudio } from "@/lib/content/narrate";
import { allowedModuleIds } from "@/lib/controls";
import { getChildContext } from "@/lib/dal";

// Stored narration for one part of a card. 204 when none is stored yet;
// the browser then uses its on-device voice.
export async function GET(req: Request) {
  const ctx = await getChildContext();
  if (!ctx) return new Response(null, { status: 401 });
  if (!contentDbConfigured()) return new Response(null, { status: 204 });
  const q = new URL(req.url).searchParams;
  const itemId = (q.get("item") ?? "").slice(0, 64);
  const part = Number(q.get("part"));
  if (!itemId || !Number.isInteger(part) || part < 0 || part > 20) return new Response(null, { status: 400 });

  const db = getContentDb();
  // Same checks as reading the card: published, age band, allowed module.
  if (!(await getItem(db, itemId, ctx.child.ageBand, allowedModuleIds(ctx.child)))) {
    return new Response(null, { status: 404 });
  }
  const row = await getPartAudio(db, itemId, part);
  if (!row) return new Response(null, { status: 204 });
  return new Response(new Uint8Array(row.audio), {
    headers: { "Content-Type": row.mime, "Cache-Control": "private, max-age=86400" },
  });
}
