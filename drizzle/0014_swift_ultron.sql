CREATE TABLE "api_throttle" (
	"provider" text PRIMARY KEY NOT NULL,
	"last_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geo_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"payload" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ride_geo" (
	"ride_id" uuid PRIMARY KEY NOT NULL,
	"origin_lat" integer NOT NULL,
	"origin_lng" integer NOT NULL,
	"meeting_lat" integer NOT NULL,
	"meeting_lng" integer NOT NULL,
	"dest_lat" integer NOT NULL,
	"dest_lng" integer NOT NULL,
	"distance_meters" integer,
	"duration_seconds" integer,
	"route_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ride_geo" ADD CONSTRAINT "ride_geo_ride_id_rides_id_fk" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "geo_cache_created_idx" ON "geo_cache" USING btree ("created_at");