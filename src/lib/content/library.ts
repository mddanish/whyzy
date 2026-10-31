import { createHash } from "node:crypto";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { ContentDb } from "@/db/content/client";
import { collections, itemParts, items, modules, type ItemSource, type ItemStatus } from "@/db/content/schema";
import type { AgeBand } from "@/db/family/schema";
import { MODULES } from "./modules";

// ---- Library sync (operator) ----

export async function syncModules(db: ContentDb): Promise<void> {
  for (const [i, m] of MODULES.entries()) {
    await db
      .insert(modules)
      .values({ ...m, sortOrder: i })
      .onConflictDoUpdate({ target: modules.id, set: { title: m.title, description: m.description, emoji: m.emoji, sortOrder: i } });
  }
}

export async function ensureCollection(
  db: ContentDb,
  c: { moduleId: string; slug: string; title: string; description?: string; emoji?: string; sortOrder?: number },
): Promise<string> {
  await db.insert(collections).values(c).onConflictDoNothing();
  const row = await db
    .select({ id: collections.id })
    .from(collections)
    .where(and(eq(collections.moduleId, c.moduleId), eq(collections.slug, c.slug)))
    .get();
  return row!.id;
}

// ---- Items and status changes ----

export function contentHash(title: string, parts: string[]): string {
  const norm = [title, ...parts].join("\n").toLowerCase().replace(/\s+/g, " ").trim();
  return createHash("sha256").update(norm).digest("hex");
}

export type NewItem = {
  collectionId: string;
  moduleId: string;
  title: string;
  ageBands: AgeBand[];
  parts: string[];
  tags?: string[];
  source?: ItemSource;
  agentVersion?: string;
  skillVersion?: string;
  model?: string;
};

// Stores a new item as a draft. Returns null if the same content already exists.
export async function createDraft(db: ContentDb, item: NewItem): Promise<string | null> {
  const { parts: rawParts, ...fields } = item;
  const parts = rawParts.map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0 || fields.ageBands.length === 0) throw new Error("item needs parts and age bands");
  const hash = contentHash(fields.title, parts);
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(items)
      .values({ ...fields, status: "draft", contentHash: hash })
      .onConflictDoNothing()
      .returning({ id: items.id });
    if (!row) return null;
    await tx.insert(itemParts).values(parts.map((text, idx) => ({ itemId: row.id, idx, text })));
    return row.id;
  });
}

const ALLOWED: Record<ItemStatus, ItemStatus[]> = {
  draft: ["validated", "rejected"],
  validated: ["published", "rejected"],
  published: ["unpublished"],
  unpublished: ["published"],
  rejected: [],
};

export async function setStatus(
  db: ContentDb,
  id: string,
  to: ItemStatus,
  extra: { rejectReason?: string; validatorModel?: string; validatorVerdict?: Record<string, unknown> } = {},
): Promise<void> {
  const row = await db.select({ status: items.status }).from(items).where(eq(items.id, id)).get();
  if (!row) throw new Error(`item ${id} not found`);
  if (!ALLOWED[row.status].includes(to)) throw new Error(`cannot move item ${id} from ${row.status} to ${to}`);
  await db
    .update(items)
    .set({ status: to, ...extra, ...(to === "published" ? { publishedAt: new Date() } : {}) })
    .where(eq(items.id, id));
}

// ---- Child-facing reads: published content only ----

const fitsBand = (band: AgeBand) => sql`exists (select 1 from json_each(${items.ageBands}) where value = ${band})`;
const visible = (band: AgeBand) => and(eq(items.status, "published"), fitsBand(band));

export type ModuleCard = { id: string; title: string; description: string; emoji: string; count: number };

export async function listModules(db: ContentDb, band: AgeBand, allowed?: string[]): Promise<ModuleCard[]> {
  const rows = await db
    .select({
      id: modules.id,
      title: modules.title,
      description: modules.description,
      emoji: modules.emoji,
      count: sql<number>`count(${items.id})`,
    })
    .from(modules)
    .innerJoin(items, and(eq(items.moduleId, modules.id), visible(band)))
    .where(and(eq(modules.enabled, true), allowed ? inArray(modules.id, allowed) : undefined))
    .groupBy(modules.id)
    .orderBy(asc(modules.sortOrder));
  return rows;
}

export async function listCollections(db: ContentDb, moduleId: string, band: AgeBand) {
  return db
    .select({
      id: collections.id,
      title: collections.title,
      description: collections.description,
      emoji: collections.emoji,
      count: sql<number>`count(${items.id})`,
    })
    .from(collections)
    .innerJoin(items, and(eq(items.collectionId, collections.id), visible(band)))
    .where(eq(collections.moduleId, moduleId))
    .groupBy(collections.id)
    .orderBy(asc(collections.sortOrder), asc(collections.title));
}

export async function listItems(db: ContentDb, collectionId: string, band: AgeBand) {
  return db
    .select({ id: items.id, title: items.title, tags: items.tags })
    .from(items)
    .where(and(eq(items.collectionId, collectionId), visible(band)))
    .orderBy(asc(items.publishedAt));
}

export async function getItem(db: ContentDb, id: string, band: AgeBand) {
  const item = await db
    .select({ id: items.id, title: items.title, moduleId: items.moduleId, collectionId: items.collectionId })
    .from(items)
    .where(and(eq(items.id, id), visible(band)))
    .get();
  if (!item) return null;
  const parts = await db
    .select({ text: itemParts.text })
    .from(itemParts)
    .where(eq(itemParts.itemId, id))
    .orderBy(asc(itemParts.idx));
  return { ...item, parts: parts.map((p) => p.text) };
}
