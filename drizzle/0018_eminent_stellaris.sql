ALTER TYPE "public"."notification_type" ADD VALUE 'ride_status';--> statement-breakpoint
CREATE TABLE "ride_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ride_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ride_shares_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "rides" ADD COLUMN "vehicle" text;--> statement-breakpoint
ALTER TABLE "rides" ADD COLUMN "status" text DEFAULT 'planned' NOT NULL;--> statement-breakpoint
ALTER TABLE "rides" ADD COLUMN "departed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "rides" ADD COLUMN "arrived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ride_shares" ADD CONSTRAINT "ride_shares_ride_id_rides_id_fk" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_shares" ADD CONSTRAINT "ride_shares_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ride_shares_ride_idx" ON "ride_shares" USING btree ("ride_id");--> statement-breakpoint
CREATE INDEX "ride_shares_expires_idx" ON "ride_shares" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "rides" ADD CONSTRAINT "rides_status_check" CHECK ("rides"."status" in ('planned', 'departed', 'arrived'));