CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`owner_email` text NOT NULL,
	`title` text NOT NULL,
	`health_area` text NOT NULL,
	`provider` text DEFAULT '' NOT NULL,
	`facility` text DEFAULT '' NOT NULL,
	`starts_at` text NOT NULL,
	`duration_minutes` integer DEFAULT 30 NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`preparation` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `appointments_owner_start_idx` ON `appointments` (`owner_user_id`,`starts_at`);