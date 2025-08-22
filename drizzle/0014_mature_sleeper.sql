ALTER TABLE "users" ADD COLUMN "settings" jsonb DEFAULT '{"theme":"system","doNotDisturb":false,"silentNotifications":false}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "theme";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "do_not_disturb";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "silent_notifications";