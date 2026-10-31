import { and, eq, sql } from "drizzle-orm";
import type { FamilyDb } from "@/lib/family-db";
import { usage } from "@/db/family/schema";

// India time (UTC+5:30), so a child's day resets at local midnight.
export function indiaDay(now = new Date()): string {
  return new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

export const MAX_PER_MINUTE = 8;
export const MAX_PER_DAY = 300;

async function row(db: FamilyDb, childId: string, day: string) {
  await db.insert(usage).values({ childId, day }).onConflictDoNothing();
  return (await db.select().from(usage).where(and(eq(usage.childId, childId), eq(usage.day, day))).get())!;
}

export async function usedSeconds(db: FamilyDb, childId: string, now = new Date()): Promise<number> {
  return (await row(db, childId, indiaDay(now))).seconds;
}

// Adds active time (capped per call so a stuck client cannot add much).
export async function addSeconds(db: FamilyDb, childId: string, seconds: number, now = new Date()) {
  const day = indiaDay(now);
  await row(db, childId, day);
  const add = Math.max(0, Math.min(60, Math.round(seconds)));
  await db
    .update(usage)
    .set({ seconds: sql`${usage.seconds} + ${add}` })
    .where(and(eq(usage.childId, childId), eq(usage.day, day)));
}

// Per-child rate limit. Returns false when the child should slow down.
export async function takeMessageSlot(db: FamilyDb, childId: string, now = new Date()): Promise<boolean> {
  const day = indiaDay(now);
  const r = await row(db, childId, day);
  const bucket = Math.floor(now.getTime() / 60_000);
  const minuteCount = r.minuteBucket === bucket ? r.minuteCount : 0;
  if (minuteCount >= MAX_PER_MINUTE || r.messageCount >= MAX_PER_DAY) return false;
  await db
    .update(usage)
    .set({ messageCount: r.messageCount + 1, minuteBucket: bucket, minuteCount: minuteCount + 1 })
    .where(and(eq(usage.childId, childId), eq(usage.day, day)));
  return true;
}
