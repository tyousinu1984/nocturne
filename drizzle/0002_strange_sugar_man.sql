CREATE TABLE `cast_account_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` text NOT NULL,
	`action` text NOT NULL,
	`actor_user_id` text NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `cast_accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "cast_account_events_action_valid" CHECK("cast_account_events"."action" IN ('create', 'rotate_credential', 'enable', 'disable', 'login'))
);
--> statement-breakpoint
CREATE INDEX `idx_cast_account_events_account_created` ON `cast_account_events` (`account_id`,`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `cast_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`artist_slug` text NOT NULL,
	`display_name` text NOT NULL,
	`credential_hash` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`session_version` integer DEFAULT 1 NOT NULL,
	`last_login_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "cast_accounts_status_valid" CHECK("cast_accounts"."status" IN ('active', 'disabled')),
	CONSTRAINT "cast_accounts_session_version_positive" CHECK("cast_accounts"."session_version" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_cast_accounts_artist_slug` ON `cast_accounts` (`artist_slug`);--> statement-breakpoint
CREATE INDEX `idx_cast_accounts_status` ON `cast_accounts` (`status`);