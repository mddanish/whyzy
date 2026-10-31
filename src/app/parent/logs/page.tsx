import { Suspense } from "react";
import Link from "next/link";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { deleteLogsAction } from "@/app/actions/family";
import { Card, Loading, secondaryButtonClass } from "@/app/ui";
import { childProfiles, conversations, messages } from "@/db/family/schema";
import { getFamilySettings, requireFamily } from "@/lib/dal";

export default function LogsPage() {
  return (
    <Card title="Chat logs" wide>
      <Suspense fallback={<Loading />}>
        <Logs />
      </Suspense>
      <p className="mt-6 text-sm"><Link href="/parent" className="underline">Back</Link></p>
    </Card>
  );
}

const fmt = (d: Date) => d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

async function Logs() {
  const { db } = await requireFamily();
  const s = await getFamilySettings(db);
  const convs = await db
    .select({ id: conversations.id, startedAt: conversations.startedAt, name: childProfiles.displayName })
    .from(conversations)
    .innerJoin(childProfiles, eq(childProfiles.id, conversations.childId))
    .orderBy(desc(conversations.startedAt))
    .limit(50);
  const msgs = convs.length
    ? await db.select().from(messages).where(inArray(messages.conversationId, convs.map((c) => c.id))).orderBy(asc(messages.createdAt))
    : [];

  return (
    <>
      <p className="mb-4 text-sm opacity-70">
        {s.loggingEnabled
          ? `Logging is on. Messages are deleted automatically after ${s.retentionDays} days. Personal details are removed before they are saved.`
          : "Logging is off, so new chats are not saved. Turn it on in Settings."}
      </p>
      {convs.length === 0 && <p className="text-sm">No saved chats.</p>}
      {convs.map((c) => (
        <section key={c.id} className="mb-4 rounded-lg border border-black/10 p-3 dark:border-white/15">
          <h2 className="mb-2 text-sm font-semibold">{c.name} · {fmt(c.startedAt)}</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {msgs.filter((m) => m.conversationId === c.id).map((m) => (
              <li key={m.id} className={m.role === "child" ? "" : "pl-4 opacity-80"}>
                <span className="font-medium">{m.role === "child" ? c.name : "Whyzy"}:</span> {m.text}
                {m.flagged && <span className="ml-1 text-xs text-red-600">(flagged)</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {convs.length > 0 && (
        <form action={deleteLogsAction}>
          <button className={`${secondaryButtonClass} text-red-600`}>Delete all chat logs now</button>
        </form>
      )}
    </>
  );
}
