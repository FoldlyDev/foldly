ALTER TABLE "users" ALTER COLUMN "subscription_tier" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "subscription_tier" SET DEFAULT 'free'::text;--> statement-breakpoint
DROP TYPE "public"."subscription_tier";--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'pro', 'business');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "subscription_tier" SET DEFAULT 'free'::"public"."subscription_tier";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "subscription_tier" SET DATA TYPE "public"."subscription_tier" USING "subscription_tier"::"public"."subscription_tier";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "storage_limit" SET DEFAULT 1073741824;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "storage_used" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "storage_limit" bigint DEFAULT 524288000 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "files_uploaded" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_quota_warning_at" timestamp with time zone;