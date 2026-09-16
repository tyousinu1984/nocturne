CREATE TABLE "booking_inquiries" (
	"id" text PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"event_name" text NOT NULL,
	"event_date" text NOT NULL,
	"event_location" text NOT NULL,
	"headcount" integer DEFAULT 1 NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"staff_note" text DEFAULT '' NOT NULL,
	"created_at" text DEFAULT CURRENT_TIMESTAMP::text NOT NULL,
	"updated_at" text DEFAULT CURRENT_TIMESTAMP::text NOT NULL,
	CONSTRAINT "booking_inquiries_status_valid" CHECK ("booking_inquiries"."status" IN ('new', 'contacted', 'confirmed', 'cancelled')),
	CONSTRAINT "booking_inquiries_headcount_positive" CHECK ("booking_inquiries"."headcount" >= 1)
);
--> statement-breakpoint
CREATE INDEX "idx_booking_inquiries_status_created" ON "booking_inquiries" USING btree ("status","created_at");