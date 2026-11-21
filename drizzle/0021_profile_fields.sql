CREATE TABLE "user_avatars" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"content_type" text DEFAULT 'image/jpeg' NOT NULL,
	"data" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_avatars_size_check" CHECK (char_length("user_avatars"."data") <= 140000)
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "theme" text DEFAULT 'violet' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "interests" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "user_avatars" ADD CONSTRAINT "user_avatars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_bio_check" CHECK ("users"."bio" is null or char_length("users"."bio") <= 280);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_city_check" CHECK ("users"."city" is null or char_length("users"."city") <= 40);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_theme_check" CHECK ("users"."theme" in ('violet', 'sunset', 'mint', 'ocean', 'berry', 'gold'));--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_interests_check" CHECK (cardinality("users"."interests") <= 5);