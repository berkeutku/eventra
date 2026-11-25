ALTER TYPE "public"."notification_type" ADD VALUE 'profile_moderated';--> statement-breakpoint
ALTER TABLE "user_reports" DROP CONSTRAINT "user_reports_reason_check";--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reason_check" CHECK ("user_reports"."reason" in ('no_show', 'unsafe', 'harassment', 'wrong_info', 'other', 'profile'));