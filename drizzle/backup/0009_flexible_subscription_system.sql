-- Migration: Flexible Subscription System for Foldly
-- Description: Adds subscription_tiers, user_subscriptions, and subscription_events tables
-- Date: 2025-01-XX
-- Breaking changes: None (purely additive)

-- =============================================================================
-- CREATE SUBSCRIPTION TIERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS "subscription_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tier_key" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"price_monthly" numeric(10,2),
	"price_yearly" numeric(10,2),
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

-- Create indexes for subscription_tiers
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_tiers_tier_key_idx" ON "subscription_tiers" ("tier_key");
CREATE INDEX IF NOT EXISTS "subscription_tiers_active_idx" ON "subscription_tiers" ("is_active");
CREATE INDEX IF NOT EXISTS "subscription_tiers_sort_idx" ON "subscription_tiers" ("sort_order");
CREATE INDEX IF NOT EXISTS "subscription_tiers_clerk_plan_idx" ON "subscription_tiers" ("clerk_plan_id");

-- =============================================================================
-- CREATE USER SUBSCRIPTIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS "user_subscriptions" (
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
	"discount_percent" numeric(5,2),
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"canceled_at" timestamp with time zone,
	"metadata" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_tier_id_subscription_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "subscription_tiers"("id") ON DELETE restrict ON UPDATE no action;

-- Create indexes for user_subscriptions
CREATE INDEX IF NOT EXISTS "user_subscriptions_user_id_idx" ON "user_subscriptions" ("user_id");
CREATE INDEX IF NOT EXISTS "user_subscriptions_tier_id_idx" ON "user_subscriptions" ("tier_id");
CREATE INDEX IF NOT EXISTS "user_subscriptions_status_idx" ON "user_subscriptions" ("status");
CREATE INDEX IF NOT EXISTS "user_subscriptions_active_idx" ON "user_subscriptions" ("is_active");
CREATE INDEX IF NOT EXISTS "user_subscriptions_clerk_sub_idx" ON "user_subscriptions" ("clerk_subscription_id");
CREATE INDEX IF NOT EXISTS "user_subscriptions_stripe_sub_idx" ON "user_subscriptions" ("stripe_subscription_id");
CREATE INDEX IF NOT EXISTS "user_subscriptions_current_period_idx" ON "user_subscriptions" ("current_period_start","current_period_end");
CREATE UNIQUE INDEX IF NOT EXISTS "user_subscriptions_active_user_idx" ON "user_subscriptions" ("user_id","is_active") WHERE "is_active" = true;

-- =============================================================================
-- CREATE SUBSCRIPTION EVENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS "subscription_events" (
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

-- Add foreign key constraints
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "user_subscriptions"("id") ON DELETE cascade ON UPDATE no action;

-- Create indexes for subscription_events
CREATE INDEX IF NOT EXISTS "subscription_events_user_id_idx" ON "subscription_events" ("user_id");
CREATE INDEX IF NOT EXISTS "subscription_events_subscription_id_idx" ON "subscription_events" ("subscription_id");
CREATE INDEX IF NOT EXISTS "subscription_events_event_type_idx" ON "subscription_events" ("event_type");
CREATE INDEX IF NOT EXISTS "subscription_events_occurred_at_idx" ON "subscription_events" ("occurred_at");
CREATE INDEX IF NOT EXISTS "subscription_events_clerk_event_idx" ON "subscription_events" ("clerk_event_id");

-- =============================================================================
-- INSERT DEFAULT SUBSCRIPTION TIERS
-- =============================================================================

-- Insert Free Tier
INSERT INTO "subscription_tiers" (
  "tier_key", "name", "description", "price_monthly", "price_yearly",
  "storage_limit", "features", "is_active", "is_public", "sort_order",
  "allow_upgrade_from", "allow_downgrade_to", "grandfathering_enabled"
) VALUES (
  'free',
  'Free',
  'Perfect for getting started with generous storage and unlimited links',
  NULL,
  NULL,
  53687091200, -- 50GB in bytes
  '{
    "unlimitedLinks": true,
    "premiumShortLinks": false,
    "passwordProtectedLinks": false,
    "qrCodeGeneration": false,
    "fileSizeRestrictions": false,
    "fileTypeRestrictions": false,
    "customUsername": true,
    "basicColorCustomization": true,
    "customBannerBranding": false,
    "removeFoldlyBranding": false,
    "filePreviewThumbnails": true,
    "emailNotifications": true,
    "oneDriveIntegration": true,
    "googleDriveIntegration": true,
    "prioritySupport": false
  }'::json,
  true,
  true,
  1,
  '[]'::json,
  '[]'::json,
  true
) ON CONFLICT ("tier_key") DO NOTHING;

-- Insert Pro Tier
INSERT INTO "subscription_tiers" (
  "tier_key", "name", "description", "price_monthly", "price_yearly",
  "storage_limit", "features", "is_active", "is_public", "sort_order",
  "allow_upgrade_from", "allow_downgrade_to", "grandfathering_enabled"
) VALUES (
  'pro',
  'Pro',
  'Advanced features for power users with premium branding options',
  12.00,
  120.00,
  537109504000, -- 500GB in bytes
  '{
    "unlimitedLinks": true,
    "premiumShortLinks": true,
    "passwordProtectedLinks": true,
    "qrCodeGeneration": true,
    "fileSizeRestrictions": true,
    "fileTypeRestrictions": true,
    "customUsername": true,
    "basicColorCustomization": true,
    "customBannerBranding": true,
    "removeFoldlyBranding": true,
    "filePreviewThumbnails": true,
    "emailNotifications": true,
    "oneDriveIntegration": true,
    "googleDriveIntegration": true,
    "prioritySupport": false
  }'::json,
  true,
  true,
  2,
  '["free"]'::json,
  '["free"]'::json,
  false
) ON CONFLICT ("tier_key") DO NOTHING;

-- Insert Business Tier (initially not public)
INSERT INTO "subscription_tiers" (
  "tier_key", "name", "description", "price_monthly", "price_yearly",
  "storage_limit", "features", "is_active", "is_public", "sort_order",
  "allow_upgrade_from", "allow_downgrade_to", "grandfathering_enabled"
) VALUES (
  'business',
  'Business',
  'Enterprise-grade features with priority support',
  39.00,
  390.00,
  2199023255552, -- 2TB in bytes
  '{
    "unlimitedLinks": true,
    "premiumShortLinks": true,
    "passwordProtectedLinks": true,
    "qrCodeGeneration": true,
    "fileSizeRestrictions": true,
    "fileTypeRestrictions": true,
    "customUsername": true,
    "basicColorCustomization": true,
    "customBannerBranding": true,
    "removeFoldlyBranding": true,
    "filePreviewThumbnails": true,
    "emailNotifications": true,
    "oneDriveIntegration": true,
    "googleDriveIntegration": true,
    "prioritySupport": true
  }'::json,
  true,
  false, -- Not public initially as specified
  3,
  '["free", "pro"]'::json,
  '["pro", "free"]'::json,
  false
) ON CONFLICT ("tier_key") DO NOTHING;

-- =============================================================================
-- MIGRATE EXISTING USERS TO NEW SUBSCRIPTION SYSTEM
-- =============================================================================

-- Create user subscriptions for all existing users based on their current subscription_tier
INSERT INTO "user_subscriptions" (
  "user_id",
  "tier_id",
  "status",
  "is_active",
  "billing_cycle",
  "current_storage_used",
  "current_storage_limit",
  "started_at",
  "metadata"
)
SELECT 
  u."id" as "user_id",
  st."id" as "tier_id",
  'active' as "status",
  true as "is_active",
  CASE 
    WHEN u."subscription_tier" = 'free' THEN NULL
    ELSE 'monthly'
  END as "billing_cycle",
  u."storage_used" as "current_storage_used",
  st."storage_limit" as "current_storage_limit",
  u."created_at" as "started_at",
  '{"source": "migration", "reason": "Initial migration from users.subscription_tier"}'::json as "metadata"
FROM "users" u
INNER JOIN "subscription_tiers" st ON st."tier_key" = u."subscription_tier"
WHERE NOT EXISTS (
  SELECT 1 FROM "user_subscriptions" us 
  WHERE us."user_id" = u."id" AND us."is_active" = true
);

-- Create initial subscription events for migrated users
INSERT INTO "subscription_events" (
  "user_id",
  "subscription_id",
  "event_type",
  "from_tier_key",
  "to_tier_key",
  "reason",
  "source",
  "metadata",
  "occurred_at"
)
SELECT 
  us."user_id",
  us."id" as "subscription_id",
  'created' as "event_type",
  NULL as "from_tier_key",
  st."tier_key" as "to_tier_key",
  'Initial subscription created during migration' as "reason",
  'migration' as "source",
  '{"migration": true}'::json as "metadata",
  us."created_at" as "occurred_at"
FROM "user_subscriptions" us
INNER JOIN "subscription_tiers" st ON st."id" = us."tier_id"
WHERE us."metadata"->>'source' = 'migration';

-- =============================================================================
-- CREATE UTILITY FUNCTIONS
-- =============================================================================

-- Function to get user's current active subscription with tier details
CREATE OR REPLACE FUNCTION get_user_active_subscription(user_id_param text)
RETURNS TABLE (
  subscription_id uuid,
  tier_key varchar(50),
  tier_name varchar(100),
  storage_limit bigint,
  storage_used bigint,
  features json,
  status varchar(50),
  current_period_end timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id as subscription_id,
    st.tier_key,
    st.name as tier_name,
    us.current_storage_limit as storage_limit,
    us.current_storage_used as storage_used,
    st.features,
    us.status,
    us.current_period_end
  FROM user_subscriptions us
  INNER JOIN subscription_tiers st ON st.id = us.tier_id
  WHERE us.user_id = user_id_param 
    AND us.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has specific feature
CREATE OR REPLACE FUNCTION user_has_feature(user_id_param text, feature_key text)
RETURNS boolean AS $$
DECLARE
  has_feature boolean := false;
BEGIN
  SELECT (st.features->>feature_key)::boolean
  INTO has_feature
  FROM user_subscriptions us
  INNER JOIN subscription_tiers st ON st.id = us.tier_id
  WHERE us.user_id = user_id_param 
    AND us.is_active = true
  LIMIT 1;
  
  RETURN COALESCE(has_feature, false);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================================================

-- Trigger to update updated_at timestamp on subscription_tiers
CREATE OR REPLACE FUNCTION update_subscription_tiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_tiers_updated_at_trigger
  BEFORE UPDATE ON subscription_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_tiers_updated_at();

-- Trigger to update updated_at timestamp on user_subscriptions
CREATE OR REPLACE FUNCTION update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_subscriptions_updated_at_trigger
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_subscriptions_updated_at();

-- =============================================================================
-- GRANT PERMISSIONS (Adjust based on your RLS setup)
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust based on your auth setup)
-- Subscription tiers are public read for all authenticated users
CREATE POLICY "Public subscription tiers read" ON subscription_tiers FOR SELECT TO authenticated USING (is_active = true AND is_public = true);

-- Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

-- Users can only see their own subscription events
CREATE POLICY "Users can view own subscription events" ON subscription_events FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

-- Service role has full access (for admin operations)
CREATE POLICY "Service role full access subscription_tiers" ON subscription_tiers FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access user_subscriptions" ON user_subscriptions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access subscription_events" ON subscription_events FOR ALL TO service_role USING (true);