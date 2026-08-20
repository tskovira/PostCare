CREATE TABLE `share_grants` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text NOT NULL,
	`token_hash` text NOT NULL,
	`label` text NOT NULL,
	`record_ids` text NOT NULL,
	`expires_at` text NOT NULL,
	`revoked_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_accessed_at` text,
	`access_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `share_grants_token_hash_unique` ON `share_grants` (`token_hash`);--> statement-breakpoint
CREATE INDEX `share_grants_owner_created_idx` ON `share_grants` (`owner_email`,`created_at`);--> statement-breakpoint
CREATE INDEX `share_grants_token_hash_idx` ON `share_grants` (`token_hash`);