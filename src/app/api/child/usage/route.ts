import * as z from "zod";
import { addSeconds, usedSeconds } from "@/lib/chat/usage";
import { getChildContext } from "@/lib/dal";

const Body = z.object({ seconds: z.number().min(0).max(120) });

// Heartbeat from child mode while the page is visible. Returns time left today.
export async function POST(req: Request) {
  const ctx = await getChildContext();
  if (!ctx) return new Response(null, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  await addSeconds(ctx.db, ctx.child.id, parsed.data.seconds);
  const left = Math.max(0, ctx.child.dailyMinutes * 60 - (await usedSeconds(ctx.db, ctx.child.id)));
  return Response.json({ remainingSeconds: left });
}
