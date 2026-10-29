CREATE TABLE "signup_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "signup_attempts_created_idx" ON "signup_attempts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "signup_attempts_ip_idx" ON "signup_attempts" USING btree ("ip_hash","created_at");