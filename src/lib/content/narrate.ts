import { createHash } from "node:crypto";
import { and, asc, eq, notExists } from "drizzle-orm";
import type { ContentDb } from "@/db/content/client";
import { itemAudio, itemParts, items } from "@/db/content/schema";

export type Speech = { voice: string; mime: string; synthesize: (text: string) => Promise<ArrayBuffer> };

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

// Published items with at least one part that has no stored narration.
export async function itemsMissingAudio(db: ContentDb): Promise<string[]> {
  const rows = await db
    .selectDistinct({ id: items.id })
    .from(items)
    .innerJoin(itemParts, eq(itemParts.itemId, items.id))
    .where(
      and(
        eq(items.status, "published"),
        notExists(
          db
            .select({ i: itemAudio.itemId })
            .from(itemAudio)
            .where(and(eq(itemAudio.itemId, itemParts.itemId), eq(itemAudio.idx, itemParts.idx))),
        ),
      ),
    );
  return rows.map((r) => r.id);
}

// Makes narration once per part and stores it (operator only).
export async function narrateItem(db: ContentDb, itemId: string, speech: Speech): Promise<number> {
  const parts = await db.select().from(itemParts).where(eq(itemParts.itemId, itemId)).orderBy(asc(itemParts.idx));
  const done = new Set(
    (await db.select({ idx: itemAudio.idx }).from(itemAudio).where(eq(itemAudio.itemId, itemId))).map((r) => r.idx),
  );
  let made = 0;
  for (const p of parts) {
    if (done.has(p.idx)) continue;
    const audio = Buffer.from(await speech.synthesize(p.text));
    await db
      .insert(itemAudio)
      .values({ itemId, idx: p.idx, mime: speech.mime, audio, voice: speech.voice, textHash: hash(p.text) })
      .onConflictDoNothing();
    made++;
  }
  return made;
}

// Child-facing: the stored narration for one part of a published item.
export async function getPartAudio(db: ContentDb, itemId: string, idx: number) {
  return db
    .select({ mime: itemAudio.mime, audio: itemAudio.audio })
    .from(itemAudio)
    .innerJoin(items, eq(items.id, itemAudio.itemId))
    .where(and(eq(itemAudio.itemId, itemId), eq(itemAudio.idx, idx), eq(items.status, "published")))
    .get();
}

// Narrates every published item that is missing audio, with ElevenLabs.
// Returns zero counts (and does nothing) when ElevenLabs is not configured.
export async function narrateAll(db: ContentDb, speech?: Speech): Promise<{ items: number; parts: number }> {
  const s = speech ?? (await elevenLabsSpeechOrNull());
  if (!s) return { items: 0, parts: 0 };
  let parts = 0;
  const ids = await itemsMissingAudio(db);
  for (const id of ids) parts += await narrateItem(db, id, s);
  return { items: ids.length, parts };
}

async function elevenLabsSpeechOrNull(): Promise<Speech | null> {
  const { elevenLabsSpeech, ttsConfigured } = await import("@/lib/voice/tts");
  if (!ttsConfigured()) {
    console.warn("ElevenLabs is not configured (ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID); skipping narration.");
    return null;
  }
  return { voice: `elevenlabs:${process.env.ELEVENLABS_VOICE_ID}`, mime: "audio/mpeg", synthesize: (t) => elevenLabsSpeech(t) };
}
