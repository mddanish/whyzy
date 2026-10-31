import { Suspense } from "react";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { consentAction, startChildModeAction } from "@/app/actions/family";
import { buttonClass, Card, Loading, secondaryButtonClass } from "@/app/ui";
import { and, eq, isNull } from "drizzle-orm";
import { childProfiles, safetyEvents } from "@/db/family/schema";
import { getFamilySettings, getParentContext } from "@/lib/dal";
import { getPet } from "@/lib/pets";

export default function ParentPage() {
  return (
    <Card title="Parent area" wide>
      <Suspense fallback={<Loading />}>
        <ParentHome />
      </Suspense>
    </Card>
  );
}

async function ParentHome() {
  const ctx = await getParentContext();
  const signOut = (
    <form action={signOutAction} className="mt-8">
      <button className="text-sm underline">Sign out</button>
    </form>
  );
  if (!ctx.ready) {
    return (
      <>
        <p className="mb-2">Hi {ctx.parent.name ?? "there"}!</p>
        <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Your family space is not ready yet. The Whyzy team is finishing setup. Please check back soon.
        </p>
        {signOut}
      </>
    );
  }
  const { parent, db } = ctx;
  const s = await getFamilySettings(db);
  const children = await db.select().from(childProfiles).orderBy(childProfiles.createdAt);

  if (!s.consentAt) return <><ConsentGate name={parent.name} />{signOut}</>;
  const urgent = await db
    .select({ id: safetyEvents.id })
    .from(safetyEvents)
    .where(and(isNull(safetyEvents.seenAt), eq(safetyEvents.actionTaken, "parent_alert")));
  const unseen = await db.select({ id: safetyEvents.id }).from(safetyEvents).where(isNull(safetyEvents.seenAt));

  return (
    <>
      <p className="mb-6">Hi {parent.name ?? "there"}!</p>
      {urgent.length > 0 && (
        <Link href="/parent/alerts" role="alert" className="mb-4 block rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-900">
          ⚠️ Whyzy noticed your child may be upset or unsafe ({urgent.length}). Please check on them now. Open alerts →
        </Link>
      )}
      {!s.parentPinHash && (
        <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Set a parent PIN in <Link href="/parent/settings" className="underline">Settings</Link> before your child uses Whyzy.
        </p>
      )}
      <h2 className="mb-3 text-lg font-semibold">Children</h2>
      {children.length === 0 && <p className="mb-4 text-sm opacity-70">No child profiles yet.</p>}
      <ul className="mb-4 flex flex-col gap-3">
        {children.map((c) => {
          const pet = getPet(c.avatarPet);
          return (
            <li key={c.id} className="flex items-center gap-3 rounded-xl border border-black/10 p-3 dark:border-white/15">
              <span className="text-3xl" aria-hidden>{pet.emoji}</span>
              <div className="flex-1">
                <p className="font-medium">{c.displayName}</p>
                <p className="text-xs opacity-70">
                  Age {c.ageBand} · {c.inputLanguage === "hi" ? "Hindi" : "English"} · {c.dailyMinutes} min a day
                </p>
                <p className="text-xs opacity-70">
                  {c.whyzyEnabled
                    ? `Whyzy on · ${c.allowedModules === null ? "all modules" : `${c.allowedModules.length} module(s)`} · chat ${c.chatEnabled ? "on" : "off"} · ${c.showText ? "text shown" : "audio only"}`
                    : "Whyzy off"}
                </p>
              </div>
              <Link href={`/parent/children/${c.id}`} className={secondaryButtonClass}>Edit</Link>
              <form action={startChildModeAction}>
                <input type="hidden" name="childId" value={c.id} />
                <button className={secondaryButtonClass} disabled={!s.parentPinHash || !c.whyzyEnabled} title={c.whyzyEnabled ? undefined : "Turn on Whyzy for this child first"}>Start child mode</button>
              </form>
            </li>
          );
        })}
      </ul>
      <Link href="/parent/children/new" className={`${buttonClass} block text-center`}>Add a child</Link>
      <nav className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/parent/alerts" className={secondaryButtonClass}>Safety alerts{unseen.length > 0 ? ` (${unseen.length})` : ""}</Link>
        <Link href="/parent/logs" className={secondaryButtonClass}>Chat logs</Link>
        <Link href="/parent/settings" className={secondaryButtonClass}>Settings and PIN</Link>
        <Link href="/parent/account" className={secondaryButtonClass}>Delete account</Link>
      </nav>
      {signOut}
    </>
  );
}

function ConsentGate({ name }: { name: string | null }) {
  return (
    <form action={consentAction}>
      <p className="mb-4">Hi {name ?? "there"}! Before your child uses Whyzy, please read and confirm:</p>
      <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-950" role="dialog" aria-label="About Whyzy">
        <p className="mb-2 font-semibold">Whyzy is an AI, not a person.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Whyzy is a computer program. Its answers can be wrong.</li>
          <li>Every message passes safety checks, but no filter is perfect. Stay nearby.</li>
          <li>Your child&apos;s voice is turned into text on this device. Audio is never stored.</li>
          <li>Chat logs are off unless you turn them on. You can delete everything at any time.</li>
        </ul>
      </div>
      <label className="mb-3 flex gap-2 text-sm">
        <input type="checkbox" name="disclosure" required /> I understand Whyzy is an AI computer helper, not a person.
      </label>
      <label className="mb-6 flex gap-2 text-sm">
        <input type="checkbox" name="consent" required /> I am the parent or guardian, and I have signed the Whyzy pilot consent form.
      </label>
      <button className={buttonClass}>Confirm</button>
    </form>
  );
}
