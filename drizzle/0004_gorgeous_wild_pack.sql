DROP INDEX "subscription_plans_plan_key_idx";--> statement-breakpoint
DROP INDEX "subscription_plans_is_active_idx";--> statement-breakpoint
DROP INDEX "subscription_plans_is_mvp_enabled_idx";--> statement-breakpoint
DROP INDEX "subscription_plans_sort_order_idx";--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'subscription_plans'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "subscription_plans" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "plan_description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "monthly_price_usd" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "yearly_price_usd" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "yearly_price_usd" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "is_active" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "sort_order" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "highlight_features" jsonb;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "feature_descriptions" jsonb;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "is_popular" boolean DEFAULT false;--> statement-breakpoint
CREATE INDEX "idx_subscription_plans_plan_key" ON "subscription_plans" USING btree ("plan_key");--> statement-breakpoint
CREATE INDEX "idx_subscription_plans_active" ON "subscription_plans" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_subscription_plans_sort_order" ON "subscription_plans" USING btree ("sort_order");--> statement-breakpoint
ALTER TABLE "subscription_plans" DROP COLUMN "max_file_size_mb";--> statement-breakpoint
ALTER TABLE "subscription_plans" DROP COLUMN "features";--> statement-breakpoint
ALTER TABLE "subscription_plans" DROP COLUMN "included_features_list";--> statement-breakpoint
ALTER TABLE "subscription_plans" DROP COLUMN "is_mvp_enabled";--> statement-breakpoint
ALTER TABLE "subscription_plans" DROP COLUMN "metadata";--> statement-breakpoint
ALTER TABLE "subscription_plans" DROP COLUMN "internal_notes";--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD CONSTRAINT "subscription_plans_plan_key_unique" UNIQUE("plan_key");