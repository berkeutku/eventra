CREATE TABLE "ticket_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" text NOT NULL,
	"code_hash" text NOT NULL,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ticket_verifications_code_hash_unique" UNIQUE("code_hash"),
	CONSTRAINT "ticket_verifications_user_event_unique" UNIQUE("user_id","event_id")
);
--> statement-breakpoint
ALTER TABLE "ticket_verifications" ADD CONSTRAINT "ticket_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_verifications" ADD CONSTRAINT "ticket_verifications_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ticket_verifications_event_id_idx" ON "ticket_verifications" USING btree ("event_id");