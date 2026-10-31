import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { conversations, messages, safetyEvents, settings, usage } from "@/db/family/schema";
import { indiaDay } from "@/lib/chat/usage";
import type { FamilyDb } from "@/lib/family-db";
import { applyRetention } from "@/lib/retention";
import { addChild, tempFamily } from "./support/helpers";

const DAY = 86_400_000;
let db: FamilyDb;
let cleanup: () => void;
beforeEach(async () => ({ db, cleanup } = await tempFamily()));
afterEach(() => cleanup());

describe("retention job", () => {
  it("deletes logs older than retention_days, old usage and old seen alerts", async () => {
    const now = new Date("2026-10-31T10:00:00Z");
    const child = await addChild(db);
    await db.update(settings).set({ retentionDays: 7 });
    await db.insert(conversations).values([
      { id: "old-conv", childId: child.id, startedAt: new Date(now.getTime() - 10 * DAY) },
      { id: "new-conv", childId: child.id, startedAt: new Date(now.getTime() - DAY) },
    ]);
    await db.insert(messages).values([
      { conversationId: "old-conv", role: "child", text: "made-up old text", createdAt: new Date(now.getTime() - 10 * DAY) },
      { conversationId: "new-conv", role: "child", text: "made-up new text", createdAt: new Date(now.getTime() - DAY) },
    ]);
    await db.insert(usage).values([
      { childId: child.id, day: indiaDay(new Date(now.getTime() - 40 * DAY)) },
      { childId: child.id, day: indiaDay(now) },
    ]);
    await db.insert(safetyEvents).values([
      { childId: child.id, category: "distress", actionTaken: "parent_alert", seenAt: now, createdAt: new Date(now.getTime() - 100 * DAY) },
      { childId: child.id, category: "distress", actionTaken: "parent_alert", createdAt: new Date(now.getTime() - 100 * DAY) },
    ]);

    expect(await applyRetention(db, now)).toEqual({ deletedMessages: 1 });
    expect((await db.select().from(messages)).map((m) => m.text)).toEqual(["made-up new text"]);
    expect((await db.select().from(conversations)).map((c) => c.id)).toEqual(["new-conv"]);
    expect(await db.select().from(usage)).toHaveLength(1);
    const events = await db.select().from(safetyEvents);
    expect(events).toHaveLength(1);
    expect(events[0].seenAt).toBeNull(); // unseen alerts are kept until the parent sees them
  });
});
