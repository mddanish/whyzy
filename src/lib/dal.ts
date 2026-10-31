import "server-only";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getCentralDb } from "@/db/central/client";
import { users } from "@/db/central/schema";

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
