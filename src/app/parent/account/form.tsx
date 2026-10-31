"use client";

import { useActionState } from "react";
import { deleteAccountAction } from "@/app/actions/family";
import { dangerButtonClass, Field, Message } from "@/app/ui";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccountAction, undefined);
  return (
    <form action={action}>
      <Field label="Your account password" name="password" type="password" autoComplete="current-password" />
      <Field label="Type DELETE to confirm" name="confirm" autoComplete="off" />
      <Message state={state} />
      <button className={dangerButtonClass} disabled={pending}>{pending ? "Deleting…" : "Delete everything"}</button>
    </form>
  );
}
