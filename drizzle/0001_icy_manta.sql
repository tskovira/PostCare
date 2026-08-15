CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text NOT NULL,
	`object_key` text NOT NULL,
	`title` text NOT NULL,
	`file_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`health_area` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`uploaded_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `documents_object_key_unique` ON `documents` (`object_key`);--> statement-breakpoint
CREATE INDEX `documents_owner_uploaded_idx` ON `documents` (`owner_email`,`uploaded_at`);