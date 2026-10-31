import "server-only";
import { and, eq, isNotNull, lt, notExists } from "drizzle-orm";
import { conversations, messages, safetyEvents, settings, usage } from "@/db/family/schema";
import type { FamilyDb } from "@/lib/family-db";
import { indiaDay } from "@/lib/chat/usage";

const DAY = 86_400_000;
export const USAGE_KEEP_DAYS = 30;
export const SEEN_ALERT_KEEP_DAYS = 90;

// Deletes chat logs older than the family's retention_days, empty
// conversations, old daily usage rows and old alerts the parent has seen.
export async function applyRetention(db: FamilyDb, now = new Date()) {
  const s = (await db.select().from(settings).where(eq(settings.id, 1)).get())!;
  const logCutoff = new Date(now.getTime() - s.retentionDays * DAY);
  const deletedMessages = await db.delete(messages).where(lt(messages.createdAt, logCutoff)).returning({ id: messages.id });
  await db
    .delete(conversations)
    .where(notExists(db.select({ id: messages.id }).from(messages).where(eq(messages.conversationId, conversations.id))));
  await db.delete(usage).where(lt(usage.day, indiaDay(new Date(now.getTime() - USAGE_KEEP_DAYS * DAY))));
  await db
    .delete(safetyEvents)
    .where(and(isNotNull(safetyEvents.seenAt), lt(safetyEvents.createdAt, new Date(now.getTime() - SEEN_ALERT_KEEP_DAYS * DAY))));
  return { deletedMessages: deletedMessages.length };
}

export async function deleteAllLogs(db: FamilyDb) {
  await db.delete(messages);
  await db.delete(conversations);
}
