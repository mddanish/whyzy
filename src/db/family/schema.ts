import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Family database: one per family, in Mumbai. Holds child data only.
// No audio, no dates of birth, nothing learned from chats.

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());

export const AGE_BANDS = ["4-6", "7-9", "10-12", "13+"] as const;
export type AgeBand = (typeof AGE_BANDS)[number];
export const INPUT_LANGUAGES = ["en", "hi"] as const;
export type InputLanguage = (typeof INPUT_LANGUAGES)[number];

export const childProfiles = sqliteTable("child_profiles", {
  id: id(),
  displayName: text("display_name").notNull(),
  ageBand: text("age_band").$type<AgeBand>().notNull(),
  interests: text("interests").notNull().default(""),
  avatarPet: text("avatar_pet").notNull(),
  inputLanguage: text("input_language").$type<InputLanguage>().notNull().default("en"),
  dailyMinutes: integer("daily_minutes").notNull().default(30),
  // Parent controls (v2). The child gets only what is turned on here.
  whyzyEnabled: integer("whyzy_enabled", { mode: "boolean" }).notNull().default(false),
  allowedModules: text("allowed_modules", { mode: "json" }).$type<string[] | null>(), // null = all modules
  chatEnabled: integer("chat_enabled", { mode: "boolean" }).notNull().default(false),
  showText: integer("show_text", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

// Single row (id = 1).
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  loggingEnabled: integer("logging_enabled", { mode: "boolean" }).notNull().default(false),
  retentionDays: integer("retention_days").notNull().default(7),
  parentPinHash: text("parent_pin_hash"),
  pinFailedCount: integer("pin_failed_count").notNull().default(0),
  pinLockedUntil: integer("pin_locked_until", { mode: "timestamp_ms" }),
  consentAt: integer("consent_at", { mode: "timestamp_ms" }),
});

export const conversations = sqliteTable("conversations", {
  id: id(),
  childId: text("child_id")
    .notNull()
    .references(() => childProfiles.id, { onDelete: "cascade" }),
  startedAt: integer("started_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const messages = sqliteTable("messages", {
  id: id(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").$type<"child" | "whyzy">().notNull(),
  text: text("text").notNull(),
  flagged: integer("flagged", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

export const safetyEvents = sqliteTable("safety_events", {
  id: id(),
  childId: text("child_id")
    .notNull()
    .references(() => childProfiles.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  actionTaken: text("action_taken").notNull(),
  seenAt: integer("seen_at", { mode: "timestamp_ms" }),
  createdAt: createdAt(),
});

// Daily totals only, for time limits and rate limits. Kept 30 days at most.
export const usage = sqliteTable(
  "usage",
  {
    childId: text("child_id")
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    day: text("day").notNull(), // YYYY-MM-DD, India time
    seconds: integer("seconds").notNull().default(0),
    messageCount: integer("message_count").notNull().default(0),
    minuteBucket: integer("minute_bucket").notNull().default(0),
    minuteCount: integer("minute_count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.childId, t.day] })],
);
