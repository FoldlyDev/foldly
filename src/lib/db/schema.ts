import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table - integrated with Clerk
export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(), // Clerk user ID
  email: varchar('email', { length: 255 }).unique().notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  imageUrl: varchar('image_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Upload links table - core feature for collecting files
export const uploadLinks = pgTable('upload_links', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  userId: varchar('user_id', { length: 255 })
    .references(() => users.id)
    .notNull(),
  isActive: boolean('is_active').default(true),
  expiresAt: timestamp('expires_at'),
  maxFileSize: bigint('max_file_size', { mode: 'number' }).default(
    50 * 1024 * 1024
  ), // 50MB default
  maxFiles: integer('max_files').default(10),
  allowedFileTypes: text('allowed_file_types'), // JSON string of allowed types
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Files table - uploaded files through upload links
export const files = pgTable('files', {
  id: serial('id').primaryKey(),
  uploadLinkId: integer('upload_link_id')
    .references(() => uploadLinks.id)
    .notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(), // stored file name
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  uploadedBy: varchar('uploaded_by', { length: 255 }), // optional uploader identifier
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  uploadLinks: many(uploadLinks),
}));

export const uploadLinksRelations = relations(uploadLinks, ({ one, many }) => ({
  user: one(users, {
    fields: [uploadLinks.userId],
    references: [users.id],
  }),
  files: many(files),
}));

export const filesRelations = relations(files, ({ one }) => ({
  uploadLink: one(uploadLinks, {
    fields: [files.uploadLinkId],
    references: [uploadLinks.id],
  }),
}));

// Export types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UploadLink = typeof uploadLinks.$inferSelect;
export type NewUploadLink = typeof uploadLinks.$inferInsert;
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
