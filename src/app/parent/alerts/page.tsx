import { Suspense } from "react";
import Link from "next/link";
import { desc, eq, isNull } from "drizzle-orm";
import { markAlertsSeenAction } from "@/app/actions/family";
import { Card, Loading, secondaryButtonClass } from "@/app/ui";
import { childProfiles, safetyEvents } from "@/db/family/schema";
import { requireFamily } from "@/lib/dal";

const LABEL: Record<string, string> = {
  self_harm: "Talked about hurting themself",
  distress: "Sounded scared, sad or hurt",
  personal_info: "Shared a personal detail (removed before it was sent)",
  jailbreak: "Tried to change Whyzy's rules",
  secrets: "Asked Whyzy to keep a secret",
  strangers: "Asked to meet or share photos",
  medical: "Asked about medicine",
  violence: "Asked about violence or weapons",
  sexual: "Asked about sexual topics",
  substances: "Asked about alcohol, smoking or drugs",
  scary: "Asked for scary content",
  purchases: "Asked to buy something",
  links: "Asked for links or websites",
};

export default function AlertsPage() {
  return (
    <Card title="Safety alerts" wide>
      <p className="mb-6 text-sm opacity-70">
        What your child said is not shown here unless chat logs are on. Distress alerts mean your child may need you now.
      </p>
      <Suspense fallback={<Loading />}>
        <Alerts />
      </Suspense>
      <p className="mt-6 text-sm"><Link href="/parent" className="underline">Back</Link></p>
    </Card>
  );
}

async function Alerts() {
  const { db } = await requireFamily();
  const rows = await db
    .select({ e: safetyEvents, name: childProfiles.displayName })
    .from(safetyEvents)
    .innerJoin(childProfiles, eq(childProfiles.id, safetyEvents.childId))
    .orderBy(desc(safetyEvents.createdAt))
    .limit(200);
  const unseen = await db.select({ id: safetyEvents.id }).from(safetyEvents).where(isNull(safetyEvents.seenAt));
  if (rows.length === 0) return <p className="text-sm">No alerts. 🎉</p>;
  return (
    <>
      {unseen.length > 0 && (
        <form action={markAlertsSeenAction} className="mb-4">
          <button className={secondaryButtonClass}>Mark all as seen</button>
        </form>
      )}
      <ul className="flex flex-col gap-2">
        {rows.map(({ e, name }) => {
          const urgent = e.actionTaken === "parent_alert";
          const label = LABEL[e.category] ?? (e.category.startsWith("output_") ? "Whyzy's answer was blocked and replaced" : e.category);
          return (
            <li key={e.id} className={`rounded-lg border p-3 text-sm ${urgent ? "border-red-300 bg-red-50 text-red-950" : "border-black/10 dark:border-white/15"} ${e.seenAt ? "opacity-70" : ""}`}>
              <p className="font-medium">{urgent ? "⚠️ " : ""}{name}: {label}</p>
              <p className="text-xs opacity-70">{e.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}{e.seenAt ? " · seen" : ""}</p>
            </li>
          );
        })}
      </ul>
    </>
  );
}
