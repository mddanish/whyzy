"use client";

import { useActionState } from "react";
import { saveSettingsAction, setPinAction } from "@/app/actions/family";
import { buttonClass, Field, Message } from "@/app/ui";

export function SettingsForm({ loggingEnabled, retentionDays }: { loggingEnabled: boolean; retentionDays: number }) {
  const [state, action, pending] = useActionState(saveSettingsAction, undefined);
  return (
    <form action={action} className="mb-8">
      <label className="mb-4 flex gap-2 text-sm font-medium">
        <input type="checkbox" name="loggingEnabled" defaultChecked={loggingEnabled} /> Keep chat logs so I can read them
      </label>
      <Field label="Delete logs after (days)" name="retentionDays" type="number" min={1} max={90} defaultValue={retentionDays} />
      <Message state={state} />
      <button className={buttonClass} disabled={pending}>{pending ? "Saving…" : "Save settings"}</button>
    </form>
  );
}

export function PinForm({ hasPin }: { hasPin: boolean }) {
  const [state, action, pending] = useActionState(setPinAction, undefined);
  return (
    <form action={action}>
      <Field label="Your account password" name="password" type="password" autoComplete="current-password" />
      <Field label={hasPin ? "New PIN (4 to 6 digits)" : "PIN (4 to 6 digits)"} name="pin" type="password" inputMode="numeric" autoComplete="off" />
      <Field label="Repeat PIN" name="pinConfirm" type="password" inputMode="numeric" autoComplete="off" />
      <Message state={state} />
      <button className={buttonClass} disabled={pending}>{pending ? "Saving…" : hasPin ? "Change PIN" : "Set PIN"}</button>
    </form>
  );
}
