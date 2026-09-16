CREATE TABLE "model_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"portfolio_url" text DEFAULT '' NOT NULL,
	"experience" text DEFAULT '' NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"staff_note" text DEFAULT '' NOT NULL,
	"created_at" text DEFAULT CURRENT_TIMESTAMP::text NOT NULL,
	"updated_at" text DEFAULT CURRENT_TIMESTAMP::text NOT NULL,
	CONSTRAINT "model_applications_status_valid" CHECK ("model_applications"."status" IN ('new', 'contacted', 'hired', 'rejected'))
);
--> statement-breakpoint
CREATE INDEX "idx_model_applications_status_created" ON "model_applications" USING btree ("status","created_at");