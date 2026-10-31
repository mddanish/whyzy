"use client";

import { useActionState } from "react";
import { signupAction } from "@/app/actions/auth";
import { buttonClass, Field } from "@/app/ui";

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, undefined);
  return (
    <form action={action}>
      <Field label="Access key" name="accessKey" autoComplete="off" defaultValue={state?.values?.accessKey} />
      <Field label="Your name" name="name" autoComplete="name" defaultValue={state?.values?.name} />
      <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} />
      <Field label="Password (10+ characters)" name="password" type="password" autoComplete="new-password" />
      {state?.message && (
        <p role="alert" className="mb-4 text-sm text-red-600">{state.message}</p>
      )}
      <button className={buttonClass} disabled={pending}>
        {pending ? "Creating account…" : "Create parent account"}
      </button>
    </form>
  );
}
