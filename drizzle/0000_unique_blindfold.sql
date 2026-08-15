CREATE TABLE `health_records` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`record_date` text NOT NULL,
	`provider` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'Entered by you' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `health_records_owner_date_idx` ON `health_records` (`owner_email`,`record_date`);