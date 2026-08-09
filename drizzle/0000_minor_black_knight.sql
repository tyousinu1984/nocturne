CREATE TABLE `attendance_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`artist_slug` text NOT NULL,
	`service_date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`submitted_by` text,
	`reviewed_by` text,
	`note` text DEFAULT '' NOT NULL,
	`rejection_reason` text,
	`cancellation_reason` text,
	`created_by` text NOT NULL,
	`last_event_key` text NOT NULL,
	`submitted_at` text,
	`reviewed_at` text,
	`published_at` text,
	`cancelled_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "attendance_entries_time_order" CHECK("attendance_entries"."start_time" < "attendance_entries"."end_time"),
	CONSTRAINT "attendance_entries_version_positive" CHECK("attendance_entries"."version" >= 1),
	CONSTRAINT "attendance_entries_status_valid" CHECK("attendance_entries"."status" IN ('draft', 'pending', 'approved', 'published', 'rejected', 'cancelled'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_attendance_entries_active_artist_date` ON `attendance_entries` (`artist_slug`,`service_date`) WHERE "attendance_entries"."status" NOT IN ('rejected', 'cancelled');--> statement-breakpoint
CREATE INDEX `idx_attendance_entries_public` ON `attendance_entries` (`artist_slug`,`service_date`,`start_time`) WHERE "attendance_entries"."status" = 'published';--> statement-breakpoint
CREATE INDEX `idx_attendance_entries_status_date` ON `attendance_entries` (`status`,`service_date`);--> statement-breakpoint
CREATE TABLE `attendance_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`attendance_id` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`request_fingerprint` text NOT NULL,
	`action` text NOT NULL,
	`from_status` text,
	`to_status` text NOT NULL,
	`actor_user_id` text NOT NULL,
	`entry_version` integer NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`attendance_id`) REFERENCES `attendance_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "attendance_events_action_valid" CHECK("attendance_events"."action" IN ('create', 'save_draft', 'submit', 'approve', 'reject', 'publish', 'cancel')),
	CONSTRAINT "attendance_events_to_status_valid" CHECK("attendance_events"."to_status" IN ('draft', 'pending', 'approved', 'published', 'rejected', 'cancelled')),
	CONSTRAINT "attendance_events_from_status_valid" CHECK("attendance_events"."from_status" IS NULL OR "attendance_events"."from_status" IN ('draft', 'pending', 'approved', 'published', 'rejected', 'cancelled'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_attendance_events_idempotency` ON `attendance_events` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `idx_attendance_events_entry_created` ON `attendance_events` (`attendance_id`,`created_at`,`id`);--> statement-breakpoint
PRAGMA optimize;
