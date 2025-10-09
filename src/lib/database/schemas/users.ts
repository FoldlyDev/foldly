// =============================================================================
// USERS TABLE SCHEMA - Clerk Integration with SaaS Subscription Management
// =============================================================================
// 🎯 Defines the users table structure for Supabase database

import {
  pgTable,
  varchar,
  text,
  timestamp,
  bigint,
  boolean,
  index,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Users table - Clerk integration with minimal storage tracking
 * storage_used maintained for performance, updated via triggers/functions
 */
export const users = pgTable("users", {
  id: text("id").primaryKey().notNull(), // Clerk user ID (string format)
  email: varchar("email", { length: 255 }).unique().notNull(),
  username: varchar("username", { length: 100 }).unique().notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  avatarUrl: text("avatar_url"),

  // Subscription Management - Cached from Clerk Billing (updated via webhooks)
  // Source of truth: Clerk Billing API
  subscriptionStatus: varchar("subscription_status", { length: 50 })
    .default("free")
    .notNull(), // 'free' | 'trial' | 'active' | 'canceled' | 'past_due'
  subscriptionTier: varchar("subscription_tier", { length: 50 }), // 'basic' | 'pro' | 'enterprise' | null for free tier

  // Storage tracking (bytes) - for performance, updated when files change
  storageUsed: bigint("storage_used", { mode: "number" })
    .default(0)
    .notNull(),

  // User Settings - Flexible JSON for easy extension
  settings: jsonb("settings")
    .default({
      theme: "system",
      doNotDisturb: false,
      silentNotifications: false,
      cloudStorage: {
        google: { connected: false, lastSyncedAt: null },
        microsoft: { connected: false, lastSyncedAt: null },
      },
    })
    .notNull()
    .$type<{
      theme: "light" | "dark" | "system";
      doNotDisturb: boolean;
      silentNotifications: boolean;
      cloudStorage?: {
        google?: {
          connected: boolean;
          lastSyncedAt: Date | null;
          email?: string;
        };
        microsoft?: {
          connected: boolean;
          lastSyncedAt: Date | null;
          email?: string;
        };
      };
      [key: string]: any; // Allow future settings
    }>(),

  // Audit & Status Fields
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true).notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }), // For soft deletes

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
