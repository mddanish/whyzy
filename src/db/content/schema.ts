import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type { AgeBand } from "@/db/family/schema";

// Content database: the shared card library (no child data), in Mumbai.
// Children only ever receive items with status "published".

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());

export const ITEM_STATUSES = ["draft", "validated", "published", "rejected", "unpublished"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];
export const ITEM_SOURCES = ["generated", "traditional"] as const;
export type ItemSource = (typeof ITEM_SOURCES)[number];

export const modules = sqliteTable("modules", {
  id: text("id").primaryKey(), // slug, e.g. "stories"
  title: text("title").notNull(),
  description: text("description").notNull(),
  emoji: text("emoji").notNull(),
  sortOrder: integer("sort_order").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
});

export const collections = sqliteTable(
  "collections",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    moduleId: text("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    emoji: text("emoji").notNull().default("✨"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("collections_module_slug").on(t.moduleId, t.slug)],
);

export const items = sqliteTable(
  "items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    moduleId: text("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    ageBands: text("age_bands", { mode: "json" }).$type<AgeBand[]>().notNull(),
    tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
    source: text("source").$type<ItemSource>().notNull().default("generated"),
    status: text("status").$type<ItemStatus>().notNull().default("draft"),
    rejectReason: text("reject_reason"),
    // Generation metadata (FR-66)
    agentVersion: text("agent_version"),
    skillVersion: text("skill_version"),
    model: text("model"),
    validatorModel: text("validator_model"),
    validatorVerdict: text("validator_verdict", { mode: "json" }).$type<Record<string, unknown>>(),
    contentHash: text("content_hash").notNull(),
    createdAt: createdAt(),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
  },
  (t) => [
    index("items_collection_status").on(t.collectionId, t.status),
    uniqueIndex("items_content_hash").on(t.contentHash),
  ],
);

// A content card is played part by part (story pages, rhyme verses).
export const itemParts = sqliteTable(
  "item_parts",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    idx: integer("idx").notNull(),
    text: text("text").notNull(),
  },
  (t) => [primaryKey({ columns: [t.itemId, t.idx] })],
);
