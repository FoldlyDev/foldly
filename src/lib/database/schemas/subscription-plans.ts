// =============================================================================
// SUBSCRIPTION PLANS TABLE SCHEMA - Simplified UI Metadata Only
// =============================================================================
// 🎯 Simplified subscription plans for UI metadata display only
// 🚀 Clerk handles all feature logic and access control (source of truth)
// 📊 Database stores only pricing, descriptions, and storage limits for UI

import {
  pgTable,
  serial,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Plan UI metadata structure for displaying plans in the interface
 * Maps database fields to UI-friendly format
 */
export interface PlanUIMetadata {
  planKey: string;
  planName: string;
  planDescription: string | null;
  monthlyPrice: string; // Mapped from monthlyPriceUsd
  yearlyPrice: string; // Mapped from yearlyPriceUsd
  storageLimit: string; // Formatted from storageLimitGb: "50 GB", "500 GB", "Unlimited"
  storageLimitGb: number; // Raw GB value from database
  highlightFeatures: string[];
  featureDescriptions: Record<string, string>;
  isPopular: boolean;
}

/**
 * Simplified Subscription Plans Table - UI Metadata Only
 *
 * Key Principles:
 * - Clerk is the source of truth for feature access control
 * - Database stores only UI display metadata
 * - No complex feature boolean columns
 * - Simple, maintainable structure
 */
export const subscriptionPlans = pgTable(
  'subscription_plans',
  {
    // Primary key (added in migration)
    id: serial('id').primaryKey(),

    // Plan identification
    planKey: varchar('plan_key', { length: 50 }).unique().notNull(), // 'free', 'pro', 'business'
    planName: varchar('plan_name', { length: 100 }).notNull(), // 'Free', 'Pro', 'Business'
    planDescription: text('plan_description'), // UI description (nullable after migration)

    // Pricing for display (defaults removed in migration)
    monthlyPriceUsd: decimal('monthly_price_usd', {
      precision: 10,
      scale: 2,
    }).notNull(),
    yearlyPriceUsd: decimal('yearly_price_usd', { precision: 10, scale: 2 }), // Nullable after migration

    // Storage limit for UI display (50, 500, -1 for unlimited)
    storageLimitGb: integer('storage_limit_gb').notNull(),

    // UI-focused feature flags for display purposes only (added in migration)
    highlightFeatures: jsonb('highlight_features').$type<string[]>(), // ['Custom branding', 'Password protection']
    featureDescriptions: jsonb('feature_descriptions').$type<
      Record<string, string>
    >(), // Detailed feature explanations

    // Display metadata
    isPopular: boolean('is_popular').default(false), // Added in migration
    sortOrder: integer('sort_order'), // No default after migration
    isActive: boolean('is_active'), // No default after migration

    // Timestamps (nullable after migration)
    createdAt: timestamp('created_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  table => ({
    subscriptionPlansPlanKeyIdx: index('idx_subscription_plans_plan_key').on(
      table.planKey
    ),
    subscriptionPlansActiveIdx: index('idx_subscription_plans_active').on(
      table.isActive
    ),
    subscriptionPlansSortOrderIdx: index(
      'idx_subscription_plans_sort_order'
    ).on(table.sortOrder),
  })
);

// =============================================================================
// TABLE TYPES
// =============================================================================

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
