"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { buttonClass, Field } from "@/app/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action}>
      <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" />
      {state?.message && (
        <p role="alert" className="mb-4 text-sm text-red-600">{state.message}</p>
      )}
      <button className={buttonClass} disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
