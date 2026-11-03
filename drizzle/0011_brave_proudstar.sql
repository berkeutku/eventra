CREATE TABLE "ride_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ride_id" uuid,
	"rater_id" uuid NOT NULL,
	"ratee_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ride_ratings_unique" UNIQUE("ride_id","rater_id","ratee_id"),
	CONSTRAINT "ride_ratings_score_check" CHECK ("ride_ratings"."score" between 1 and 5),
	CONSTRAINT "ride_ratings_not_self_check" CHECK ("ride_ratings"."rater_id" <> "ride_ratings"."ratee_id")
);
--> statement-breakpoint
CREATE TABLE "user_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"reported_id" uuid NOT NULL,
	"ride_id" uuid,
	"reason" text NOT NULL,
	"details" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_reports_unique" UNIQUE("reporter_id","reported_id","ride_id"),
	CONSTRAINT "user_reports_reason_check" CHECK ("user_reports"."reason" in ('no_show', 'unsafe', 'harassment', 'wrong_info', 'other')),
	CONSTRAINT "user_reports_status_check" CHECK ("user_reports"."status" in ('open', 'reviewed', 'dismissed')),
	CONSTRAINT "user_reports_not_self_check" CHECK ("user_reports"."reporter_id" <> "user_reports"."reported_id")
);
--> statement-breakpoint
ALTER TABLE "ride_ratings" ADD CONSTRAINT "ride_ratings_ride_id_rides_id_fk" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_ratings" ADD CONSTRAINT "ride_ratings_rater_id_users_id_fk" FOREIGN KEY ("rater_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_ratings" ADD CONSTRAINT "ride_ratings_ratee_id_users_id_fk" FOREIGN KEY ("ratee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reported_id_users_id_fk" FOREIGN KEY ("reported_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_ride_id_rides_id_fk" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ride_ratings_ratee_idx" ON "ride_ratings" USING btree ("ratee_id");--> statement-breakpoint
CREATE INDEX "user_reports_reported_idx" ON "user_reports" USING btree ("reported_id");--> statement-breakpoint
CREATE INDEX "user_reports_reporter_time_idx" ON "user_reports" USING btree ("reporter_id","created_at");