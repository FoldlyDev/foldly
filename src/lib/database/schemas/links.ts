// =============================================================================
// LINKS TABLE SCHEMA - Shareable Link Management
// =============================================================================
// 🎯 Links ARE folders - they define shareable upload endpoints

import {
  pgTable,
  varchar,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { workspaces } from "./workspaces";

/**
 * Links table - Shareable upload links
 * Each link IS a folder (distinguished by 🔗 icon in UI)
 * Pattern: foldly.com/{username}/{slug}
 */
export const links = pgTable("links", {
  id: text("id").primaryKey().notNull(), // UUID
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }), // FK to workspaces
  slug: varchar("slug", { length: 100 }).notNull(), // Globally unique slug for URL
  name: varchar("name", { length: 255 }).notNull(), // Display name

  // Link configuration
  isPublic: boolean("is_public").default(false).notNull(), // Public: anyone can upload | Dedicated: only allowed emails
  isActive: boolean("is_active").default(true).notNull(), // Can be paused by user

  // Custom upload page settings (future feature - Priority 2)
  customMessage: text("custom_message"), // Welcome message on upload page
  requiresName: boolean("requires_name").default(false).notNull(), // Enforce name field
  requiresMessage: boolean("requires_message").default(false).notNull(), // Enforce message field

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Indexes
export const linksSlugIdx = uniqueIndex("links_slug_idx").on(links.slug); // Globally unique slugs
export const linksWorkspaceIdIdx = index("links_workspace_id_idx").on(
  links.workspaceId
);
export const linksIsActiveIdx = index("links_is_active_idx").on(links.isActive);

// Relations
export const linksRelations = relations(links, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [links.workspaceId],
    references: [workspaces.id],
  }),
  // Will be defined in other schema files:
  // folders: many(folders), // Folders with this link_id
  // files: many(files), // Files with this link_id
  // permissions: many(permissions), // Access control entries
}));

// TypeScript types
export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
