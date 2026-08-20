CREATE TABLE `medications` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`owner_email` text NOT NULL,
	`name` text NOT NULL,
	`dosage` text DEFAULT '' NOT NULL,
	`frequency` text DEFAULT '' NOT NULL,
	`instructions` text DEFAULT '' NOT NULL,
	`prescribing_provider` text DEFAULT '' NOT NULL,
	`start_date` text DEFAULT '' NOT NULL,
	`end_date` text DEFAULT '' NOT NULL,
	`refill_date` text DEFAULT '' NOT NULL,
	`pharmacy` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `medications_owner_status_idx` ON `medications` (`owner_user_id`,`status`);