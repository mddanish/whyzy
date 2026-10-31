"use client";

import { useActionState } from "react";
import { unlockAction } from "@/app/actions/family";
import { buttonClass, Field, Message } from "@/app/ui";

export function UnlockForm() {
  const [state, action, pending] = useActionState(unlockAction, undefined);
  return (
    <form action={action}>
      <Field label="Parent PIN" name="pin" type="password" inputMode="numeric" autoComplete="off" />
      <Message state={state} />
      <button className={buttonClass} disabled={pending}>Unlock</button>
    </form>
  );
}
