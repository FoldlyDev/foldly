// =============================================================================
// PERMISSIONS TABLE SCHEMA - Email-Based Access Control
// =============================================================================
// 🎯 Manages who can upload to which links (email-based permissions)

import {
  pgTable,
  varchar,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { links } from "./links";

/**
 * Permission roles enum
 * - owner: Workspace owner (full control, auto-created with workspace)
 * - editor: Can delete others' files, manage content (requires OTP verification)
 * - uploader: Can only upload files (default for all external users)
 */
export type PermissionRole = "owner" | "editor" | "uploader";

/**
 * Permissions table - Email-based access control per link
 *
 * Key behaviors:
 * - owner: Auto-created when link is created
 * - editor: Promoted from uploader (requires OTP verification)
 * - uploader: Auto-added on first upload (for public links only)
 *
 * Access rules:
 * - Public links: Any email can upload, auto-appended to permissions on first upload
 * - Dedicated links: Only emails in permissions table can upload
 */
export const permissions = pgTable(
  "permissions",
  {
    id: text("id").primaryKey().notNull(), // UUID
    linkId: text("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }), // FK to links (cascade delete)
    email: varchar("email", { length: 255 }).notNull(), // Email address with access
    role: varchar("role", { length: 20 }).notNull().$type<PermissionRole>(), // owner | editor | uploader

    // OTP verification tracking (for editor promotion)
    isVerified: varchar("is_verified", { length: 10 })
      .default("false")
      .notNull(), // 'true' | 'false' (editors must verify via OTP)
    verifiedAt: timestamp("verified_at", { withTimezone: true }), // When OTP was verified

    // Activity tracking
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }), // Last upload/action

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // Unique constraint: One permission entry per email per link
    permissionLinkEmailUnique: uniqueIndex(
      "permissions_link_email_unique_idx"
    ).on(table.linkId, table.email),
  })
);

// Relations
export const permissionsRelations = relations(permissions, ({ one }) => ({
  link: one(links, {
    fields: [permissions.linkId],
    references: [links.id],
  }),
}));

// TypeScript types
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
