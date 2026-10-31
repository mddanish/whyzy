import { Suspense } from "react";
import Link from "next/link";
import { Card, Loading } from "@/app/ui";
import { getFamilySettings, requireFamily } from "@/lib/dal";
import { PinForm, SettingsForm } from "./forms";

export default function SettingsPage() {
  return (
    <Card title="Settings">
      <Suspense fallback={<Loading />}>
        <Settings />
      </Suspense>
      <p className="mt-6 text-sm"><Link href="/parent" className="underline">Back</Link></p>
    </Card>
  );
}

async function Settings() {
  const { db } = await requireFamily();
  const s = await getFamilySettings(db);
  return (
    <>
      <h2 className="mb-3 text-lg font-semibold">Chat logs</h2>
      <SettingsForm loggingEnabled={s.loggingEnabled} retentionDays={s.retentionDays} />
      <h2 className="mb-1 text-lg font-semibold">Parent PIN</h2>
      <p className="mb-3 text-sm opacity-70">The PIN locks the way from child mode back to this area.</p>
      <PinForm hasPin={Boolean(s.parentPinHash)} />
    </>
  );
}
