CREATE TYPE "public"."event_category" AS ENUM('concert', 'match', 'theatre');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('driver', 'passenger');--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" "event_category" NOT NULL,
	"city" text NOT NULL,
	"venue" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ride_passengers" (
	"ride_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ride_passengers_ride_id_user_id_pk" PRIMARY KEY("ride_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "rides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"driver_id" uuid NOT NULL,
	"origin" text NOT NULL,
	"destination" text NOT NULL,
	"meeting_point" text NOT NULL,
	"departure_time" time NOT NULL,
	"duration_minutes" integer NOT NULL,
	"seats" integer NOT NULL,
	"total_cost" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rides_seats_check" CHECK ("rides"."seats" between 1 and 6),
	CONSTRAINT "rides_duration_check" CHECK ("rides"."duration_minutes" between 5 and 600),
	CONSTRAINT "rides_cost_check" CHECK ("rides"."total_cost" between 0 and 5000)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ride_passengers" ADD CONSTRAINT "ride_passengers_ride_id_rides_id_fk" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_passengers" ADD CONSTRAINT "ride_passengers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rides" ADD CONSTRAINT "rides_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rides" ADD CONSTRAINT "rides_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rides_event_id_idx" ON "rides" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "rides_driver_id_idx" ON "rides" USING btree ("driver_id");