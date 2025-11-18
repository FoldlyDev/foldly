// =============================================================================
// FOLDERS TABLE SCHEMA - Hierarchical Folder Structure
// =============================================================================
// 🎯 Supports both personal folders (link_id = NULL) and shared folders (link_id = NOT NULL)

import {
  pgTable,
  varchar,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { workspaces } from "./workspaces";
import { links } from "./links";

/**
 * Folders table - Hierarchical folder structure
 * Can be created by:
 * - Workspace owner (uploader_email = NULL, personal folders)
 * - External uploaders (uploader_email = their email, uploaded folders)
 *
 * Link relationship:
 * - link_id = NULL → Personal folder (no sharing)
 * - link_id = NOT NULL → Shared folder (link IS this folder, or subfolder of a link)
 */
export const folders = pgTable(
  "folders",
  {
    id: text("id").primaryKey().notNull(), // UUID
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }), // FK to workspaces
    linkId: text("link_id").references(() => links.id, {
      onDelete: "set null",
    }), // FK to links (nullable, set null on link deletion)
    parentFolderId: text("parent_folder_id").references((): any => folders.id, {
      onDelete: "cascade",
    }), // Self-reference for hierarchy (nullable for root folders, CASCADE delete children)

    name: varchar("name", { length: 255 }).notNull(), // Folder name

    // Uploader tracking (for email filtering)
    uploaderEmail: varchar("uploader_email", { length: 255 }), // NULL = created by owner, NOT NULL = created by external uploader
    uploaderName: varchar("uploader_name", { length: 255 }), // Optional uploader name

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // Unique constraint: folder names must be unique within same parent
    folderNameParentUnique: uniqueIndex("folders_name_parent_unique_idx").on(
      table.parentFolderId,
      table.name
    ),
  })
);

// Relations
export const foldersRelations = relations(folders, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [folders.workspaceId],
    references: [workspaces.id],
  }),
  link: one(links, {
    fields: [folders.linkId],
    references: [links.id],
  }),
  parentFolder: one(folders, {
    fields: [folders.parentFolderId],
    references: [folders.id],
    relationName: "folderHierarchy",
  }),
  subfolders: many(folders, {
    relationName: "folderHierarchy",
  }),
  // Will be defined in files schema:
  // files: many(files),
}));

// TypeScript types
export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
