ALTER TABLE `child_profiles` ADD `whyzy_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `child_profiles` ADD `allowed_modules` text;--> statement-breakpoint
ALTER TABLE `child_profiles` ADD `chat_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `child_profiles` ADD `show_text` integer DEFAULT false NOT NULL;