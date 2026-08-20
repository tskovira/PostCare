CREATE TABLE `deletion_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`owner_email` text NOT NULL,
	`requested_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`scheduled_for` text NOT NULL,
	`cancelled_at` text,
	`completed_at` text
);
--> statement-breakpoint
CREATE INDEX `deletion_requests_owner_idx` ON `deletion_requests` (`owner_user_id`,`requested_at`);