CREATE TABLE `auth_identities` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_subject` text NOT NULL,
	`email_at_link` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_identities_provider_subject_idx` ON `auth_identities` (`provider`,`provider_subject`);--> statement-breakpoint
CREATE INDEX `auth_identities_user_idx` ON `auth_identities` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`primary_email` text NOT NULL,
	`display_name` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_primary_email_idx` ON `users` (`primary_email`);--> statement-breakpoint
DROP INDEX `audit_events_owner_occurred_idx`;--> statement-breakpoint
ALTER TABLE `audit_events` ADD `owner_user_id` text;--> statement-breakpoint
CREATE INDEX `audit_events_owner_user_occurred_idx` ON `audit_events` (`owner_user_id`,`occurred_at`);--> statement-breakpoint
DROP INDEX `documents_owner_uploaded_idx`;--> statement-breakpoint
ALTER TABLE `documents` ADD `owner_user_id` text;--> statement-breakpoint
CREATE INDEX `documents_owner_user_uploaded_idx` ON `documents` (`owner_user_id`,`uploaded_at`);--> statement-breakpoint
DROP INDEX `record_versions_owner_record_idx`;--> statement-breakpoint
ALTER TABLE `health_record_versions` ADD `owner_user_id` text;--> statement-breakpoint
CREATE INDEX `record_versions_owner_user_record_idx` ON `health_record_versions` (`owner_user_id`,`record_id`);--> statement-breakpoint
DROP INDEX `health_records_owner_date_idx`;--> statement-breakpoint
ALTER TABLE `health_records` ADD `owner_user_id` text;--> statement-breakpoint
CREATE INDEX `health_records_owner_user_date_idx` ON `health_records` (`owner_user_id`,`record_date`);--> statement-breakpoint
DROP INDEX `share_grants_owner_created_idx`;--> statement-breakpoint
ALTER TABLE `share_grants` ADD `owner_user_id` text;--> statement-breakpoint
CREATE INDEX `share_grants_owner_user_created_idx` ON `share_grants` (`owner_user_id`,`created_at`);