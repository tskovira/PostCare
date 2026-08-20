CREATE TABLE `health_record_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`owner_email` text NOT NULL,
	`version_number` integer NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`record_date` text NOT NULL,
	`provider` text NOT NULL,
	`notes` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `record_versions_owner_record_idx` ON `health_record_versions` (`owner_email`,`record_id`);--> statement-breakpoint
ALTER TABLE `health_records` ADD `deleted_at` text;