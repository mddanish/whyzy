CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`module_id` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`emoji` text DEFAULT '✨' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_module_slug` ON `collections` (`module_id`,`slug`);--> statement-breakpoint
CREATE TABLE `item_parts` (
	`item_id` text NOT NULL,
	`idx` integer NOT NULL,
	`text` text NOT NULL,
	PRIMARY KEY(`item_id`, `idx`),
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`collection_id` text NOT NULL,
	`module_id` text NOT NULL,
	`title` text NOT NULL,
	`age_bands` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`source` text DEFAULT 'generated' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`reject_reason` text,
	`agent_version` text,
	`skill_version` text,
	`model` text,
	`validator_model` text,
	`validator_verdict` text,
	`content_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`published_at` integer,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `items_collection_status` ON `items` (`collection_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `items_content_hash` ON `items` (`content_hash`);--> statement-breakpoint
CREATE TABLE `modules` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`emoji` text NOT NULL,
	`sort_order` integer NOT NULL,
	`enabled` integer DEFAULT true NOT NULL
);
