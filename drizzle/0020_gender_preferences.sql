ALTER TABLE "rides" ADD COLUMN "gender_policy" text DEFAULT 'mixed' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "rides" ADD CONSTRAINT "rides_gender_policy_check" CHECK ("rides"."gender_policy" in ('mixed', 'women_only', 'men_only'));--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_gender_check" CHECK ("users"."gender" is null or "users"."gender" in ('female', 'male'));