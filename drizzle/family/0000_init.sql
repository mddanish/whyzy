CREATE TABLE `child_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`age_band` text NOT NULL,
	`interests` text DEFAULT '' NOT NULL,
	`avatar_pet` text NOT NULL,
	`input_language` text DEFAULT 'en' NOT NULL,
	`daily_minutes` integer DEFAULT 30 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`child_id` text NOT NULL,
	`started_at` integer NOT NULL,
	FOREIGN KEY (`child_id`) REFERENCES `child_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`role` text NOT NULL,
	`text` text NOT NULL,
	`flagged` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `safety_events` (
	`id` text PRIMARY KEY NOT NULL,
	`child_id` text NOT NULL,
	`category` text NOT NULL,
	`action_taken` text NOT NULL,
	`seen_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`child_id`) REFERENCES `child_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`logging_enabled` integer DEFAULT false NOT NULL,
	`retention_days` integer DEFAULT 7 NOT NULL,
	`parent_pin_hash` text,
	`pin_failed_count` integer DEFAULT 0 NOT NULL,
	`pin_locked_until` integer,
	`consent_at` integer
);
--> statement-breakpoint
CREATE TABLE `usage` (
	`child_id` text NOT NULL,
	`day` text NOT NULL,
	`seconds` integer DEFAULT 0 NOT NULL,
	`message_count` integer DEFAULT 0 NOT NULL,
	`minute_bucket` integer DEFAULT 0 NOT NULL,
	`minute_count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`child_id`, `day`),
	FOREIGN KEY (`child_id`) REFERENCES `child_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
