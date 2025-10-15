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
  jsonb,
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
  slug: varchar("slug", { length: 100 }).notNull().unique(), // Globally unique slug for URL
  name: varchar("name", { length: 255 }).notNull(), // Display name

  // Core link state
  isPublic: boolean("is_public").default(false).notNull(), // Public: anyone can upload | Dedicated: only allowed emails
  isActive: boolean("is_active").default(true).notNull(), // Can be paused by user

  // Link configuration - Flexible JSON for easy extension
  linkConfig: jsonb("link_config")
    .default({
      notifyOnUpload: true,
      customMessage: null,
      requiresName: false,
    })
    .notNull()
    .$type<{
      notifyOnUpload: boolean;
      customMessage: string | null;
      requiresName: boolean;
      [key: string]: any; // Allow future settings
    }>(),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

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
