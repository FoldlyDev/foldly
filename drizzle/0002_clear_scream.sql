CREATE TABLE "subscription_plans" (
	"plan_key" varchar(50) PRIMARY KEY NOT NULL,
	"plan_name" varchar(100) NOT NULL,
	"plan_description" text NOT NULL,
	"monthly_price_usd" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"yearly_price_usd" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"storage_limit_gb" integer NOT NULL,
	"max_file_size_mb" integer NOT NULL,
	"features" json NOT NULL,
	"included_features_list" json NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_mvp_enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"metadata" json,
	"internal_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_plans_plan_key_idx" ON "subscription_plans" USING btree ("plan_key");--> statement-breakpoint
CREATE INDEX "subscription_plans_is_active_idx" ON "subscription_plans" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "subscription_plans_is_mvp_enabled_idx" ON "subscription_plans" USING btree ("is_mvp_enabled");--> statement-breakpoint
CREATE INDEX "subscription_plans_sort_order_idx" ON "subscription_plans" USING btree ("sort_order");