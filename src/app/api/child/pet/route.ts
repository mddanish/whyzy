import { eq } from "drizzle-orm";
import * as z from "zod";
import { childProfiles } from "@/db/family/schema";
import { getChildContext } from "@/lib/dal";
import { PET_SLUGS } from "@/lib/pets";

const Body = z.object({ pet: z.enum(PET_SLUGS) });

// The child picks their avatar from the approved list.
export async function POST(req: Request) {
  const ctx = await getChildContext();
  if (!ctx) return new Response(null, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  await ctx.db.update(childProfiles).set({ avatarPet: parsed.data.pet }).where(eq(childProfiles.id, ctx.child.id));
  return new Response(null, { status: 204 });
}
