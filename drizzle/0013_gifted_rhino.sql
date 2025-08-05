ALTER TABLE "users" ADD COLUMN "theme" varchar(10) DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "do_not_disturb" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "silent_notifications" boolean DEFAULT false NOT NULL;