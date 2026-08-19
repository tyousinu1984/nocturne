CREATE TABLE "attendance_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"artist_slug" text NOT NULL,
	"service_date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"submitted_by" text,
	"reviewed_by" text,
	"note" text DEFAULT '' NOT NULL,
	"rejection_reason" text,
	"cancellation_reason" text,
	"created_by" text NOT NULL,
	"last_event_key" text NOT NULL,
	"submitted_at" text,
	"reviewed_at" text,
	"published_at" text,
	"cancelled_at" text,
	"created_at" text DEFAULT CURRENT_TIMESTAMP::text NOT NULL,
	"updated_at" text DEFAULT CURRENT_TIMESTAMP::text NOT NULL,
	CONSTRAINT "attendance_entries_time_order" CHECK ("attendance_entries"."start_time" < "attendance_entries"."end_time"),
	CONSTRAINT "attendance_entries_version_positive" CHECK ("attendance_entries"."version" >= 1),
	CONSTRAINT "attendance_entries_status_valid" CHECK ("attendance_entries"."status" IN ('draft', 'pending', 'approved', 'published', 'rejected', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "attendance_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "attendance_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"attendance_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"request_fingerprint" text NOT NULL,
	"action" text NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"actor_user_id" text NOT NULL,
	"entry_version" integer NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"result_snapshot" text NOT NULL,
	"created_at" text DEFAULT CURRENT_TIMESTAMP::text NOT NULL,
	CONSTRAINT "attendance_events_action_valid" CHECK ("attendance_events"."action" IN ('create', 'save_draft', 'submit', 'approve', 'reject', 'publish', 'cancel')),
	CONSTRAINT "attendance_events_to_status_valid" CHECK ("attendance_events"."to_status" IN ('draft', 'pending', 'approved', 'published', 'rejected', 'cancelled')),
	CONSTRAINT "attendance_events_from_status_valid" CHECK ("attendance_events"."from_status" IS NULL OR "attendance_events"."from_status" IN ('draft', 'pending', 'approved', 'published', 'rejected', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "cast_account_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "cast_account_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"account_id" text NOT NULL,
	"action" text NOT NULL,
	"actor_user_id" text NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"created_at" text DEFAULT CURRENT_TIMESTAMP::text NOT NULL,
	CONSTRAINT "cast_account_events_action_valid" CHECK ("cast_account_events"."action" IN ('create', 'rotate_credential', 'enable', 'disable', 'login'))
);
--> statement-breakpoint
CREATE TABLE "cast_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"artist_slug" text NOT NULL,
	"display_name" text NOT NULL,
	"credential_hash" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"session_version" integer DEFAULT 1 NOT NULL,
	"last_login_at" text,
	"created_at" text DEFAULT CURRENT_TIMESTAMP::text NOT NULL,
	"updated_at" text DEFAULT CURRENT_TIMESTAMP::text NOT NULL,
	CONSTRAINT "cast_accounts_status_valid" CHECK ("cast_accounts"."status" IN ('active', 'disabled')),
	CONSTRAINT "cast_accounts_session_version_positive" CHECK ("cast_accounts"."session_version" >= 1)
);
--> statement-breakpoint
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_attendance_id_attendance_entries_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendance_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cast_account_events" ADD CONSTRAINT "cast_account_events_account_id_cast_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."cast_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_attendance_entries_active_artist_date" ON "attendance_entries" USING btree ("artist_slug","service_date") WHERE "attendance_entries"."status" NOT IN ('rejected', 'cancelled');--> statement-breakpoint
CREATE INDEX "idx_attendance_entries_public" ON "attendance_entries" USING btree ("artist_slug","service_date","start_time") WHERE "attendance_entries"."status" = 'published';--> statement-breakpoint
CREATE INDEX "idx_attendance_entries_status_date" ON "attendance_entries" USING btree ("status","service_date");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_attendance_events_idempotency" ON "attendance_events" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_attendance_events_entry_created" ON "attendance_events" USING btree ("attendance_id","created_at","id");--> statement-breakpoint
CREATE INDEX "idx_cast_account_events_account_created" ON "cast_account_events" USING btree ("account_id","created_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_cast_accounts_artist_slug" ON "cast_accounts" USING btree ("artist_slug");--> statement-breakpoint
CREATE INDEX "idx_cast_accounts_status" ON "cast_accounts" USING btree ("status");