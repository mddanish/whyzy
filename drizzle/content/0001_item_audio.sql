CREATE TABLE `item_audio` (
	`item_id` text NOT NULL,
	`idx` integer NOT NULL,
	`mime` text NOT NULL,
	`audio` blob NOT NULL,
	`voice` text NOT NULL,
	`text_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`item_id`, `idx`),
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade
);
