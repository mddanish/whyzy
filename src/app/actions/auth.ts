"use server";

import { AuthError } from "next-auth";
import * as z from "zod";
import { signIn, signOut } from "@/auth";
import { getCentralDb } from "@/db/central/client";
import { registerParent } from "@/lib/access-keys";
import { hashPassword } from "@/lib/password";

export type FormState =
  | { message?: string; values?: Record<string, string> }
  | undefined;

// Echo back non-secret fields so the form keeps them after an error.
function keep(formData: FormData, fields: string[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f, String(formData.get(f) ?? "")]));
}

const SignupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80),
  email: z.email("Enter a valid email.").trim().toLowerCase(),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters.")
    .max(128, "Password must be at most 128 characters."),
  accessKey: z.string().trim().min(1, "Enter your access key."),
});

const LoginSchema = z.object({
  email: z.email("Enter a valid email.").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password.").max(128),
});

export async function signupAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = keep(formData, ["name", "email", "accessKey"]);
  const parsed = SignupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: parsed.error.issues[0].message, values };
  const { name, email, password, accessKey } = parsed.data;

  const result = await registerParent(getCentralDb(), {
    name,
    email,
    accessKey,
    passwordHash: await hashPassword(password),
  });
  if (!result.ok) {
    return {
      values,
      message:
        result.error === "invalid_key"
          ? "This access key is not valid, has expired or was already used."
          : "An account with this email already exists. Sign in instead.",
    };
  }

  // Throws a redirect to /parent on success.
  await signIn("credentials", { email, password, redirectTo: "/parent" });
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = keep(formData, ["email"]);
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: parsed.error.issues[0].message, values };

  try {
    await signIn("credentials", { ...parsed.data, redirectTo: "/parent" });
  } catch (err) {
    if (err instanceof AuthError) return { message: "Email or password is wrong.", values };
    throw err; // redirect on success
  }
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
