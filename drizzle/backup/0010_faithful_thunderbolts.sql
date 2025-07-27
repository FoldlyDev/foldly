CREATE TABLE "subscription_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"subscription_id" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"from_tier_key" varchar(50),
	"to_tier_key" varchar(50) NOT NULL,
	"reason" varchar(255),
	"source" varchar(50) NOT NULL,
	"clerk_event_id" varchar(100),
	"stripe_event_id" varchar(100),
	"metadata" json,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tier_key" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"price_monthly" numeric(10, 2),
	"price_yearly" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"storage_limit" bigint NOT NULL,
	"features" json NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"allow_upgrade_from" json DEFAULT '["free"]'::json NOT NULL,
	"allow_downgrade_to" json DEFAULT '["free"]'::json NOT NULL,
	"grandfathering_enabled" boolean DEFAULT false NOT NULL,
	"clerk_plan_id" varchar(100),
	"stripe_price_id_monthly" varchar(100),
	"stripe_price_id_yearly" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_tiers_tier_key_unique" UNIQUE("tier_key")
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tier_id" uuid NOT NULL,
	"status" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"billing_cycle" varchar(20),
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"clerk_subscription_id" varchar(100),
	"clerk_plan_id" varchar(100),
	"stripe_subscription_id" varchar(100),
	"stripe_customer_id" varchar(100),
	"is_grandfathered" boolean DEFAULT false NOT NULL,
	"grandfathered_features" json,
	"current_storage_used" bigint DEFAULT 0 NOT NULL,
	"current_storage_limit" bigint NOT NULL,
	"last_usage_calculated_at" timestamp with time zone,
	"trial_ends_at" timestamp with time zone,
	"promo_code" varchar(50),
	"discount_percent" numeric(5, 2),
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"canceled_at" timestamp with time zone,
	"metadata" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_tier_id_subscription_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."subscription_tiers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subscription_events_user_id_idx" ON "subscription_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscription_events_subscription_id_idx" ON "subscription_events" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "subscription_events_event_type_idx" ON "subscription_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "subscription_events_occurred_at_idx" ON "subscription_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "subscription_events_clerk_event_idx" ON "subscription_events" USING btree ("clerk_event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_tiers_tier_key_idx" ON "subscription_tiers" USING btree ("tier_key");--> statement-breakpoint
CREATE INDEX "subscription_tiers_active_idx" ON "subscription_tiers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "subscription_tiers_sort_idx" ON "subscription_tiers" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "subscription_tiers_clerk_plan_idx" ON "subscription_tiers" USING btree ("clerk_plan_id");--> statement-breakpoint
CREATE INDEX "user_subscriptions_user_id_idx" ON "user_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_subscriptions_tier_id_idx" ON "user_subscriptions" USING btree ("tier_id");--> statement-breakpoint
CREATE INDEX "user_subscriptions_status_idx" ON "user_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_subscriptions_active_idx" ON "user_subscriptions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "user_subscriptions_clerk_sub_idx" ON "user_subscriptions" USING btree ("clerk_subscription_id");--> statement-breakpoint
CREATE INDEX "user_subscriptions_stripe_sub_idx" ON "user_subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "user_subscriptions_current_period_idx" ON "user_subscriptions" USING btree ("current_period_start","current_period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "user_subscriptions_active_user_idx" ON "user_subscriptions" USING btree ("user_id","is_active") WHERE is_active = true;