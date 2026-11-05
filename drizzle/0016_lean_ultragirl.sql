ALTER TYPE "public"."notification_type" ADD VALUE 'ride_message';--> statement-breakpoint
CREATE TABLE "ride_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ride_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ride_messages_body_check" CHECK (char_length("ride_messages"."body") between 1 and 500)
);
--> statement-breakpoint
ALTER TABLE "ride_messages" ADD CONSTRAINT "ride_messages_ride_id_rides_id_fk" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_messages" ADD CONSTRAINT "ride_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ride_messages_ride_time_idx" ON "ride_messages" USING btree ("ride_id","created_at");--> statement-breakpoint
CREATE INDEX "ride_messages_created_idx" ON "ride_messages" USING btree ("created_at");