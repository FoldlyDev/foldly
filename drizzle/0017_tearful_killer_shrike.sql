ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "settings" SET DEFAULT '{"theme":"system","doNotDisturb":false,"silentNotifications":false,"cloudStorage":{"google":{"connected":false,"lastSyncedAt":null},"microsoft":{"connected":false,"lastSyncedAt":null}}}'::jsonb;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "branding" json DEFAULT '{"enabled":false}'::json;--> statement-breakpoint
CREATE UNIQUE INDEX "users_id_email_idx" ON "users" USING btree ("id","email");--> statement-breakpoint
ALTER TABLE "links" DROP COLUMN "brand_enabled";--> statement-breakpoint
ALTER TABLE "links" DROP COLUMN "brand_color";