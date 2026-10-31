import "server-only";
import { eq } from "drizzle-orm";
import type { CentralDb } from "@/db/central/client";
import { families, users } from "@/db/central/schema";
import {
  createFamilyDatabase,
  dropFamilyDatabase,
  type FamilyDb,
  newFamilyDbName,
  openFamilyDb,
} from "@/lib/family-db";

export type Family = { id: string; dbName: string; dbUrl: string };

export async function findFamily(central: CentralDb, parentId: string): Promise<Family | null> {
  const row = await central
    .select({ id: families.id, dbName: families.tursoDbName, dbUrl: families.dbUrl })
    .from(families)
    .where(eq(families.ownerUserId, parentId))
    .get();
  return row && row.dbUrl ? row : null;
}

// Returns the parent's family, creating the family database if needed.
// Throws FamilySetupUnavailable when database creation is not configured.
export async function ensureFamily(central: CentralDb, parentId: string): Promise<Family> {
  const existing = await findFamily(central, parentId);
  if (existing) return existing;

  // A row with an empty URL means an earlier attempt failed half way.
  await central.delete(families).where(eq(families.ownerUserId, parentId));
  const dbName = newFamilyDbName();
  const dbUrl = await createFamilyDatabase(dbName);
  try {
    const [row] = await central
      .insert(families)
      .values({ ownerUserId: parentId, tursoDbName: dbName, dbUrl })
      .returning({ id: families.id });
    console.info(`[family] created family=${row.id}`);
    return { id: row.id, dbName, dbUrl };
  } catch (err) {
    await dropFamilyDatabase(dbName, dbUrl).catch(() => {});
    throw err;
  }
}

export function familyDb(family: Family): Promise<FamilyDb> {
  return openFamilyDb(family.dbName, family.dbUrl);
}

// Account deletion: drop the family database, then the parent's central rows.
// The access key stays spent (used_by is set to null by the foreign key).
export async function deleteParentAccount(central: CentralDb, parentId: string): Promise<void> {
  const row = await central
    .select({ dbName: families.tursoDbName, dbUrl: families.dbUrl })
    .from(families)
    .where(eq(families.ownerUserId, parentId))
    .get();
  if (row?.dbUrl) await dropFamilyDatabase(row.dbName, row.dbUrl);
  await central.delete(users).where(eq(users.id, parentId)); // cascades
  console.info(`[account] deleted user=${parentId}`);
}
