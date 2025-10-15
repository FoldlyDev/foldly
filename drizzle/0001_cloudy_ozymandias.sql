ALTER TABLE "users" RENAME COLUMN "settings" TO "user_settings";--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "link_config" jsonb DEFAULT '{"notifyOnUpload":true,"customMessage":null,"requiresName":false}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "links" DROP COLUMN "custom_message";--> statement-breakpoint
ALTER TABLE "links" DROP COLUMN "requires_name";--> statement-breakpoint
ALTER TABLE "links" DROP COLUMN "requires_message";