// =============================================================================
// FILES TABLE SCHEMA - File Storage & Metadata
// =============================================================================
// 🎯 Files can be uploaded by workspace owner OR external uploaders (tracked via uploader_email)

import {
  pgTable,
  varchar,
  text,
  timestamp,
  bigint,
  index,
  uniqueIndex,
  customType,
} from "drizzle-orm/pg-core";

// Custom type for PostgreSQL tsvector (full-text search)
const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});
import { relations } from "drizzle-orm";
import { workspaces } from "./workspaces";
import { links } from "./links";
import { folders } from "./folders";

/**
 * Files table - All uploaded files with metadata
 * Can be uploaded by:
 * - Workspace owner (uploader_email = NULL, personal files)
 * - External uploaders (uploader_email = their email, uploaded files)
 *
 * Storage pattern:
 * - Storage path (GCS): {user_id}/{workspace_id}/{file_id}.{ext}
 * - Database: Stores both full filename (for downloads) and storage path
 */
export const files = pgTable(
  "files",
  {
    id: text("id").primaryKey().notNull(), // UUID
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }), // FK to workspaces
    parentFolderId: text("parent_folder_id").references(() => folders.id, {
      onDelete: "set null",
    }), // FK to folders (nullable for root files, set null on folder deletion)
    linkId: text("link_id").references(() => links.id, {
      onDelete: "set null",
    }), // FK to links (nullable, set null on link deletion)

    // File metadata
    filename: varchar("filename", { length: 500 }).notNull(), // Full filename with extension (e.g., "contract.pdf")
    fileSize: bigint("file_size", { mode: "number" }).notNull(), // File size in bytes
    mimeType: varchar("mime_type", { length: 100 }).notNull(), // MIME type (e.g., "application/pdf")
    storagePath: text("storage_path").notNull(), // GCS path: {user_id}/{workspace_id}/{file_id}.{ext}

    // Uploader tracking (for email filtering - core V2 feature)
    uploaderEmail: varchar("uploader_email", { length: 255 }), // NULL = uploaded by owner, NOT NULL = uploaded by external user
    uploaderName: varchar("uploader_name", { length: 255 }), // Optional uploader name
    uploaderMessage: text("uploader_message"), // Optional message from uploader

    // Timestamps
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    // Full-text search vector (auto-generated from filename, uploader_email, uploader_name)
    // This column is managed by PostgreSQL and automatically updated when source columns change
    searchVector: tsvector("search_vector"),
  },
  (table) => ({
    // Unique constraint: filenames must be unique within same parent folder
    fileNameParentUnique: uniqueIndex("files_name_parent_unique_idx").on(
      table.parentFolderId,
      table.filename
    ),
    // GIN index for full-text search (significantly faster than LIKE queries)
    searchVectorIdx: index("files_search_vector_idx")
      .using('gin', table.searchVector),
  })
);

// Relations
export const filesRelations = relations(files, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [files.workspaceId],
    references: [workspaces.id],
  }),
  parentFolder: one(folders, {
    fields: [files.parentFolderId],
    references: [folders.id],
  }),
  link: one(links, {
    fields: [files.linkId],
    references: [links.id],
  }),
}));

// TypeScript types
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
