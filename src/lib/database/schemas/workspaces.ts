// =============================================================================
// WORKSPACES TABLE SCHEMA - User Workspace Management
// =============================================================================
// 🎯 1:1 relationship with users (MVP), acts as container for all user content

import {
  pgTable,
  varchar,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

/**
 * Workspaces table - One workspace per user (MVP)
 * Future: Can be extended to support multiple workspaces per user
 */
export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey().notNull(), // UUID
  userId: text("user_id")
    .notNull()
    .unique() // Enforce 1:1 relationship (MVP)
    .references(() => users.id, { onDelete: "cascade" }), // FK to users (cascade delete)
  name: varchar("name", { length: 255 }).notNull(), // Display name (e.g., "Eddy's Workspace")

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations
export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  user: one(users, {
    fields: [workspaces.userId],
    references: [users.id],
  }),
  // Will be defined in other schema files:
  // links: many(links),
  // folders: many(folders),
  // files: many(files),
}));

// TypeScript types
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
