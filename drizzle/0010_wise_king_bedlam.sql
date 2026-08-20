CREATE TABLE `clinical_facts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`owner_email` text NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`severity` text DEFAULT 'unknown' NOT NULL,
	`reaction` text DEFAULT '' NOT NULL,
	`onset_date` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`confirming_provider` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `clinical_facts_owner_kind_idx` ON `clinical_facts` (`owner_user_id`,`kind`);