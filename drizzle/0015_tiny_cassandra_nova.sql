CREATE TABLE "ride_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"passenger_id" uuid NOT NULL,
	"destination" text NOT NULL,
	"preferred_time" time,
	"seats" integer DEFAULT 1 NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ride_requests_user_event_unique" UNIQUE("passenger_id","event_id"),
	CONSTRAINT "ride_requests_seats_check" CHECK ("ride_requests"."seats" between 1 and 4)
);
--> statement-breakpoint
ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_passenger_id_users_id_fk" FOREIGN KEY ("passenger_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ride_requests_event_idx" ON "ride_requests" USING btree ("event_id","created_at");