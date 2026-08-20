CREATE TABLE `health_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`owner_email` text NOT NULL,
	`allergies` text DEFAULT '[]' NOT NULL,
	`medications` text DEFAULT '[]' NOT NULL,
	`conditions` text DEFAULT '[]' NOT NULL,
	`blood_type` text DEFAULT '' NOT NULL,
	`primary_provider` text DEFAULT '' NOT NULL,
	`emergency_name` text DEFAULT '' NOT NULL,
	`emergency_relationship` text DEFAULT '' NOT NULL,
	`emergency_phone` text DEFAULT '' NOT NULL,
	`reviewed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `health_profiles_owner_idx` ON `health_profiles` (`owner_user_id`);