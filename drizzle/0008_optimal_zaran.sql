ALTER TABLE "folders" ALTER COLUMN "workspace_id" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX "files_user_id_file_size_idx" ON "files" USING btree ("user_id","file_size");