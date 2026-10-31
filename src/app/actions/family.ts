"use server";

import { redirect } from "next/navigation";
import { eq, isNull } from "drizzle-orm";
import * as z from "zod";
import { auth, signOut } from "@/auth";
import { getCentralDb } from "@/db/central/client";
import { users } from "@/db/central/schema";
import { AGE_BANDS, childProfiles, INPUT_LANGUAGES, safetyEvents, settings } from "@/db/family/schema";
import { enterChildMode, getChildModeId, leaveChildMode } from "@/lib/child-mode";
import { getCurrentParent, getFamilySettings, requireFamily } from "@/lib/dal";
import { deleteParentAccount, ensureFamily, familyDb } from "@/lib/family";
import { hashPassword, verifyPassword } from "@/lib/password";
import { deleteAllLogs } from "@/lib/retention";
import { PET_SLUGS } from "@/lib/pets";
import { parseControls } from "@/lib/controls";

export type ActionState = { message?: string; ok?: boolean } | undefined;

const ChildSchema = z.object({
  id: z.string().optional(),
  displayName: z.string().trim().min(1, "Enter a first name or nickname.").max(30, "Keep the name under 30 characters."),
  ageBand: z.enum(AGE_BANDS, "Pick an age band."),
  interests: z.string().trim().max(200, "Keep interests under 200 characters.").default(""),
  avatarPet: z.enum(PET_SLUGS, "Pick a pet."),
  inputLanguage: z.enum(INPUT_LANGUAGES, "Pick a language."),
  dailyMinutes: z.coerce.number().int().min(5, "At least 5 minutes.").max(240, "At most 240 minutes."),
});

export async function saveChildAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { db } = await requireFamily();
  const parsed = ChildSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: parsed.error.issues[0].message };
  const controls = parseControls(formData);
  if (controls.whyzyEnabled && controls.allowedModules?.length === 0 && !controls.chatEnabled) {
    return { message: "Pick at least one module, or turn on chat." };
  }
  const { id, ...fields } = parsed.data;
  const values = { ...fields, ...controls };
  if (id) {
    await db.update(childProfiles).set(values).where(eq(childProfiles.id, id));
  } else {
    await db.insert(childProfiles).values(values);
  }
  redirect("/parent");
}

export async function deleteChildAction(formData: FormData): Promise<void> {
  const { db } = await requireFamily();
  const id = String(formData.get("id") ?? "");
  if (id) await db.delete(childProfiles).where(eq(childProfiles.id, id)); // cascades
  redirect("/parent");
}

const SettingsSchema = z.object({
  loggingEnabled: z.literal("on").optional(),
  retentionDays: z.coerce.number().int().min(1, "At least 1 day.").max(90, "At most 90 days."),
});

export async function saveSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { db } = await requireFamily();
  const parsed = SettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: parsed.error.issues[0].message };
  const loggingEnabled = parsed.data.loggingEnabled === "on";
  await db.update(settings).set({ loggingEnabled, retentionDays: parsed.data.retentionDays }).where(eq(settings.id, 1));
  if (!loggingEnabled) await deleteAllLogs(db); // off means nothing is kept
  return { ok: true, message: loggingEnabled ? "Saved." : "Saved. Logging is off and saved chats were deleted." };
}

async function checkAccountPassword(parentId: string, password: string): Promise<boolean> {
  const row = await getCentralDb()
    .select({ hash: users.passwordHash })
    .from(users)
    .where(eq(users.id, parentId))
    .get();
  return Boolean(row?.hash && (await verifyPassword(password, row.hash)));
}

const PinSchema = z
  .object({
    password: z.string().min(1, "Enter your account password.").max(128),
    pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4 to 6 digits."),
    pinConfirm: z.string(),
  })
  .refine((v) => v.pin === v.pinConfirm, "The two PINs do not match.");

export async function setPinAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { parent, db } = await requireFamily();
  const parsed = PinSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: parsed.error.issues[0].message };
  if (!(await checkAccountPassword(parent.id, parsed.data.password))) {
    return { message: "Account password is wrong." };
  }
  await db
    .update(settings)
    .set({ parentPinHash: await hashPassword(parsed.data.pin), pinFailedCount: 0, pinLockedUntil: null })
    .where(eq(settings.id, 1));
  return { ok: true, message: "PIN saved." };
}

export async function consentAction(formData: FormData): Promise<void> {
  const { db } = await requireFamily();
  if (formData.get("consent") === "on" && formData.get("disclosure") === "on") {
    await db.update(settings).set({ consentAt: new Date() }).where(eq(settings.id, 1));
  }
  redirect("/parent");
}

export async function startChildModeAction(formData: FormData): Promise<void> {
  const { parent, db } = await requireFamily();
  const s = await getFamilySettings(db);
  const childId = String(formData.get("childId") ?? "");
  const child = await db
    .select({ id: childProfiles.id, whyzyEnabled: childProfiles.whyzyEnabled })
    .from(childProfiles)
    .where(eq(childProfiles.id, childId))
    .get();
  if (!child || !child.whyzyEnabled || !s.parentPinHash || !s.consentAt) redirect("/parent");
  await enterChildMode(parent.id, child.id);
  console.info(`[child-mode] start child=${child.id}`);
  redirect("/child");
}

const MAX_PIN_TRIES = 5;
const LOCK_MS = 5 * 60 * 1000;

export async function unlockAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parent = await getCurrentParent();
  if (!(await getChildModeId(parent.id))) redirect("/parent");
  const db = await familyDb(await ensureFamily(getCentralDb(), parent.id));
  const s = await getFamilySettings(db);
  const now = new Date();
  if (s.pinLockedUntil && s.pinLockedUntil > now) {
    return { message: "Too many tries. Wait 5 minutes." };
  }
  const pin = String(formData.get("pin") ?? "");
  if (s.parentPinHash && /^\d{4,6}$/.test(pin) && (await verifyPassword(pin, s.parentPinHash))) {
    await db.update(settings).set({ pinFailedCount: 0, pinLockedUntil: null }).where(eq(settings.id, 1));
    await leaveChildMode();
    redirect("/parent");
  }
  const failed = s.pinFailedCount + 1;
  await db
    .update(settings)
    .set(
      failed >= MAX_PIN_TRIES
        ? { pinFailedCount: 0, pinLockedUntil: new Date(now.getTime() + LOCK_MS) }
        : { pinFailedCount: failed },
    )
    .where(eq(settings.id, 1));
  console.warn(`[pin] failed attempt user=${parent.id}`);
  return { message: "That PIN is not right." };
}

export async function deleteAccountAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  const parentId = session?.user?.id;
  if (!parentId) redirect("/login");
  if (formData.get("confirm") !== "DELETE") return { message: "Type DELETE to confirm." };
  if (!(await checkAccountPassword(parentId, String(formData.get("password") ?? "")))) {
    return { message: "Account password is wrong." };
  }
  await deleteParentAccount(getCentralDb(), parentId);
  await leaveChildMode();
  await signOut({ redirectTo: "/?deleted=1" });
  return undefined;
}

export async function markAlertsSeenAction(): Promise<void> {
  const { db } = await requireFamily();
  await db.update(safetyEvents).set({ seenAt: new Date() }).where(isNull(safetyEvents.seenAt));
  redirect("/parent/alerts");
}

export async function deleteLogsAction(): Promise<void> {
  const { db } = await requireFamily();
  await deleteAllLogs(db);
  redirect("/parent/logs");
}
