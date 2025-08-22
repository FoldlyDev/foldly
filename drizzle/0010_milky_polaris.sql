ALTER TABLE "batches" DROP CONSTRAINT "batches_folder_id_folders_id_fk";
--> statement-breakpoint
ALTER TABLE "folders" DROP CONSTRAINT "folders_parent_folder_id_folders_id_fk";
--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "unread_uploads" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "last_notification_at" timestamp with time zone;