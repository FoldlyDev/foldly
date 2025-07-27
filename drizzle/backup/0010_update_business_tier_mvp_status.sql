-- Migration: Update Business Tier MVP Status
-- Description: Makes Business tier visible but marks it as not available during MVP launch
-- Date: 2025-01-25
-- Breaking changes: None (data update only)

-- =============================================================================
-- UPDATE BUSINESS TIER FOR MVP LAUNCH
-- =============================================================================

-- Update Business tier to be public but add MVP status to metadata
UPDATE "subscription_tiers" 
SET 
  "is_public" = true,
  "description" = 'Enterprise-grade features with priority support (Coming Soon)',
  "updated_at" = now()
WHERE "tier_key" = 'business';

-- Update Business tier features to include MVP status
UPDATE "subscription_tiers" 
SET 
  "features" = jsonb_set(
    "features"::jsonb, 
    '{mvpStatus}', 
    '"not_available_during_mvp"'::jsonb
  )::json,
  "updated_at" = now()
WHERE "tier_key" = 'business';

-- Add popular flag to Pro tier for better conversion
UPDATE "subscription_tiers" 
SET 
  "features" = jsonb_set(
    "features"::jsonb, 
    '{popular}', 
    'true'::jsonb
  )::json,
  "updated_at" = now()
WHERE "tier_key" = 'pro';

-- Ensure Free tier has proper startup messaging
UPDATE "subscription_tiers" 
SET 
  "description" = 'Perfect for getting started with generous storage and unlimited links',
  "updated_at" = now()
WHERE "tier_key" = 'free';