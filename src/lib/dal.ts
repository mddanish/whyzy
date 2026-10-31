import "server-only";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getCentralDb } from "@/db/central/client";
import { users } from "@/db/central/schema";
import { childProfiles, settings } from "@/db/family/schema";
import { getChildModeId } from "@/lib/child-mode";
import { type Family, ensureFamily, familyDb } from "@/lib/family";
import { type FamilyDb, FamilySetupUnavailable } from "@/lib/family-db";

export type ParentUser = { id: string; name: string | null; email: string | null };

// Reads the session and confirms the parent still exists.
// Call only inside a <Suspense> boundary (request-time data).
export async function getCurrentParent(): Promise<ParentUser> {
  await connection(); // request-time only; never prerendered
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login");

  const user = await getCentralDb()
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, id))
    .get();
  if (!user) redirect("/login");
  return user;
}

export type ParentContext =
  | { parent: ParentUser; ready: true; family: Family; db: FamilyDb }
  | { parent: ParentUser; ready: false };

// For parent pages and actions. Sends the browser to the PIN screen while
// child mode is on. `ready` is false when family storage is not set up yet.
export async function getParentContext(): Promise<ParentContext> {
  const parent = await getCurrentParent();
  if (await getChildModeId(parent.id)) redirect("/unlock");
  try {
    const family = await ensureFamily(getCentralDb(), parent.id);
    return { parent, ready: true, family, db: await familyDb(family) };
  } catch (err) {
    if (err instanceof FamilySetupUnavailable) return { parent, ready: false };
    throw err;
  }
}

export async function requireFamily() {
  const ctx = await getParentContext();
  if (!ctx.ready) redirect("/parent");
  return ctx;
}

export async function getFamilySettings(db: FamilyDb) {
  return (await db.select().from(settings).where(eq(settings.id, 1)).get())!;
}

// For child mode pages and APIs. Returns null when there is no child session.
export async function getChildContext() {
  await connection();
  const session = await auth();
  const parentId = session?.user?.id;
  if (!parentId) return null;
  const childId = await getChildModeId(parentId);
  if (!childId) return null;
  try {
    const family = await ensureFamily(getCentralDb(), parentId);
    const db = await familyDb(family);
    const child = await db.select().from(childProfiles).where(eq(childProfiles.id, childId)).get();
    if (!child) return null;
    return { parentId, family, db, child, settings: await getFamilySettings(db) };
  } catch (err) {
    if (err instanceof FamilySetupUnavailable) return null;
    throw err;
  }
}
