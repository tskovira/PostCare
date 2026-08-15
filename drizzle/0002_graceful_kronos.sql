CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text NOT NULL,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`entity_label` text NOT NULL,
	`occurred_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_events_owner_occurred_idx` ON `audit_events` (`owner_email`,`occurred_at`);