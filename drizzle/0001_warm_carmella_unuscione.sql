CREATE TABLE "subscription_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"from_plan" varchar(50),
	"to_plan" varchar(50),
	"source" varchar(50) NOT NULL,
	"metadata" json,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscription_events" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscription_tiers" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_subscriptions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "subscription_events" CASCADE;--> statement-breakpoint
DROP TABLE "subscription_tiers" CASCADE;--> statement-breakpoint
DROP TABLE "user_subscriptions" CASCADE;--> statement-breakpoint
DROP INDEX "users_subscription_idx";--> statement-breakpoint
ALTER TABLE "subscription_analytics" ADD CONSTRAINT "subscription_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subscription_analytics_user_id_idx" ON "subscription_analytics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscription_analytics_event_type_idx" ON "subscription_analytics" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "subscription_analytics_occurred_at_idx" ON "subscription_analytics" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "subscription_analytics_from_plan_idx" ON "subscription_analytics" USING btree ("from_plan");--> statement-breakpoint
CREATE INDEX "subscription_analytics_to_plan_idx" ON "subscription_analytics" USING btree ("to_plan");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "subscription_tier";--> statement-breakpoint
DROP TYPE "public"."subscription_tier";