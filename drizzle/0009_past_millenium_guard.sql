ALTER TYPE "public"."event_category" ADD VALUE 'party';--> statement-breakpoint
ALTER TYPE "public"."event_category" ADD VALUE 'workshop';--> statement-breakpoint
ALTER TYPE "public"."event_category" ADD VALUE 'kids';--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"fetched_count" integer,
	"inserted_count" integer,
	"updated_count" integer,
	"skipped_count" integer,
	"deactivated_count" integer,
	"error_code" text
);
--> statement-breakpoint
ALTER TABLE "rides" DROP CONSTRAINT "rides_event_id_events_id_fk";
--> statement-breakpoint
ALTER TABLE "ticket_verifications" DROP CONSTRAINT "ticket_verifications_event_id_events_id_fk";
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "source" text DEFAULT 'demo' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "ticket_url" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "organizer" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "price_text" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "source_category" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "city_key" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "last_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "missed_runs" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "sync_runs_started_idx" ON "sync_runs" USING btree ("source","started_at");--> statement-breakpoint
ALTER TABLE "rides" ADD CONSTRAINT "rides_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_verifications" ADD CONSTRAINT "ticket_verifications_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_active_starts_idx" ON "events" USING btree ("is_active","starts_at");--> statement-breakpoint
CREATE INDEX "events_city_key_idx" ON "events" USING btree ("city_key");--> statement-breakpoint
CREATE INDEX "events_category_idx" ON "events" USING btree ("category");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_source_external_unique" UNIQUE("source","external_id");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_source_check" CHECK ("events"."source" in ('demo', 'biletimgo'));