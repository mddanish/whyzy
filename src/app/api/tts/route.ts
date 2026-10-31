import * as z from "zod";
import { getChildContext } from "@/lib/dal";
import { stripPersonalDetails } from "@/lib/safety/pii";
import { verify } from "@/lib/sign";
import { elevenLabsSpeech, ttsConfigured } from "@/lib/voice/tts";

export const maxDuration = 20;

const Body = z.object({ text: z.string().min(1).max(1200), sig: z.string().min(10).max(100) });

// 200 audio/mpeg from ElevenLabs, or 204 when the browser should use its own
// on-device voice. Audio is never stored.
export async function POST(req: Request) {
  const ctx = await getChildContext();
  if (!ctx) return new Response(null, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  const { text, sig } = parsed.data;
  // Only replies this server produced (and moderated) for this child.
  if (!verify(text, `tts:${ctx.child.id}`, sig)) return new Response(null, { status: 403 });
  if (!ttsConfigured()) return new Response(null, { status: 204 });

  const clean = stripPersonalDetails(text, { childName: ctx.child.displayName }).text;
  try {
    const audio = await elevenLabsSpeech(clean, req.signal);
    return new Response(audio, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  } catch (err) {
    console.error(`[tts] error child=${ctx.child.id} type=${(err as Error).message}`);
    return new Response(null, { status: 204 });
  }
}
