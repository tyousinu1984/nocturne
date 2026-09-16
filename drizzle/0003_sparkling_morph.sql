CREATE TABLE "announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"title_en" text NOT NULL,
	"title_ja" text NOT NULL,
	"title_zh" text NOT NULL,
	"body_en" text NOT NULL,
	"body_ja" text NOT NULL,
	"body_zh" text NOT NULL,
	"created_at" text DEFAULT CURRENT_TIMESTAMP::text NOT NULL,
	"updated_at" text DEFAULT CURRENT_TIMESTAMP::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_profiles" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tier" text NOT NULL,
	"district" text NOT NULL,
	"status" text NOT NULL,
	"role_en" text NOT NULL,
	"role_ja" text NOT NULL,
	"role_zh" text NOT NULL,
	"short_note_en" text NOT NULL,
	"short_note_ja" text NOT NULL,
	"short_note_zh" text NOT NULL,
	"biography_en" text NOT NULL,
	"biography_ja" text NOT NULL,
	"biography_zh" text NOT NULL,
	"updated_at" text DEFAULT CURRENT_TIMESTAMP::text NOT NULL,
	CONSTRAINT "model_profiles_tier_valid" CHECK ("model_profiles"."tier" IN ('Muse', 'Signature', 'New')),
	CONSTRAINT "model_profiles_district_valid" CHECK ("model_profiles"."district" IN ('Aoyama', 'Ginza', 'Daikanyama')),
	CONSTRAINT "model_profiles_status_valid" CHECK ("model_profiles"."status" IN ('Tonight', 'This week', 'Private'))
);
