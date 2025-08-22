// =============================================================================
// SUBSCRIPTION ANALYTICS TABLE SCHEMA - Simplified Analytics for Clerk Integration
// =============================================================================
// 🎯 Simple analytics table to track subscription events for business insights
//    Subscription status and features are handled by Clerk's subscription system

import {
  pgTable,
  varchar,
  text,
  json,
  timestamp,
  uuid,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Subscription Analytics Table
 * Tracks subscription change events for business analytics and insights
 * This replaces the complex subscription tracking with simple event logging
 */
export const subscriptionAnalytics = pgTable(
  'subscription_analytics',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),

    // User reference
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' })
      .notNull(),

    // Event details
    eventType: varchar('event_type', { length: 50 }).notNull(), // 'initial', 'upgrade', 'downgrade', 'cancel', 'reactivate'
    fromPlan: varchar('from_plan', { length: 50 }), // 'free', 'pro', 'business' or null for first subscription
    toPlan: varchar('to_plan', { length: 50 }), // 'free', 'pro', 'business' or null for cancellation

    // Event source and context
    source: varchar('source', { length: 50 }).notNull(), // 'clerk_webhook', 'manual', 'admin'

    // Event metadata for additional context
    metadata: json('metadata').$type<{
      clerkEventId?: string;
      stripeEventId?: string;
      reason?: string; // user-provided reason for change
      previousStorageUsed?: number; // storage used at time of change
      [key: string]: any;
    }>(),

    // Timestamps
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    subscriptionAnalyticsUserIdIdx: index(
      'subscription_analytics_user_id_idx'
    ).on(table.userId),
    subscriptionAnalyticsEventTypeIdx: index(
      'subscription_analytics_event_type_idx'
    ).on(table.eventType),
    subscriptionAnalyticsOccurredAtIdx: index(
      'subscription_analytics_occurred_at_idx'
    ).on(table.occurredAt),
    subscriptionAnalyticsFromPlanIdx: index(
      'subscription_analytics_from_plan_idx'
    ).on(table.fromPlan),
    subscriptionAnalyticsToPlanIdx: index(
      'subscription_analytics_to_plan_idx'
    ).on(table.toPlan),
  })
);
