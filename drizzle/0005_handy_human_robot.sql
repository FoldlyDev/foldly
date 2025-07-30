ALTER TABLE "subscription_plans" ALTER COLUMN "sort_order" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "is_active" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "storage_used" bigint DEFAULT 0 NOT NULL;