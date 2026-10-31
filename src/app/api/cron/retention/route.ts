import { timingSafeEqual } from "node:crypto";
import { getCentralDb } from "@/db/central/client";
import { families } from "@/db/central/schema";
import { familyDb } from "@/lib/family";
import { applyRetention } from "@/lib/retention";

export const maxDuration = 300;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

// Daily retention job (Vercel Cron, vercel.json). Logs counts and IDs only.
export async function GET(req: Request) {
  if (!authorized(req)) return new Response(null, { status: 401 });
  const rows = await getCentralDb()
    .select({ id: families.id, dbName: families.tursoDbName, dbUrl: families.dbUrl })
    .from(families);
  let failed = 0;
  for (const f of rows) {
    if (!f.dbUrl) continue;
    try {
      const { deletedMessages } = await applyRetention(await familyDb(f));
      if (deletedMessages) console.info(`[retention] family=${f.id} deleted_messages=${deletedMessages}`);
    } catch {
      failed++;
      console.error(`[retention] failed family=${f.id}`);
    }
  }
  return Response.json({ families: rows.length, failed });
}
