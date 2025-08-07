ALTER TABLE "batches" DROP CONSTRAINT "batches_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "batches" DROP CONSTRAINT "batches_link_id_links_id_fk";
--> statement-breakpoint
ALTER TABLE "files" DROP CONSTRAINT "files_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "files" DROP CONSTRAINT "files_link_id_links_id_fk";
--> statement-breakpoint
ALTER TABLE "files" DROP CONSTRAINT "files_batch_id_batches_id_fk";
--> statement-breakpoint
ALTER TABLE "files" DROP CONSTRAINT "files_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "files" DROP CONSTRAINT "files_folder_id_folders_id_fk";
--> statement-breakpoint
ALTER TABLE "folders" DROP CONSTRAINT "folders_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "folders" DROP CONSTRAINT "folders_batch_id_batches_id_fk";
--> statement-breakpoint
ALTER TABLE "folders" DROP CONSTRAINT "folders_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "folders" DROP CONSTRAINT "folders_link_id_links_id_fk";
--> statement-breakpoint
ALTER TABLE "links" DROP CONSTRAINT "links_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "subscription_analytics" DROP CONSTRAINT "subscription_analytics_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "workspaces" DROP CONSTRAINT "workspaces_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "batches_user_id_idx";--> statement-breakpoint
DROP INDEX "batches_folder_id_idx";--> statement-breakpoint
DROP INDEX "files_user_id_idx";--> statement-breakpoint
DROP INDEX "files_user_id_uploaded_at_idx";--> statement-breakpoint
DROP INDEX "files_user_id_file_size_idx";--> statement-breakpoint
DROP INDEX "folders_user_id_idx";--> statement-breakpoint
ALTER TABLE "batches" ADD COLUMN "target_folder_id" uuid;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "source_folder_id" uuid;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "subscription_analytics" ADD CONSTRAINT "subscription_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "batches_target_folder_id_idx" ON "batches" USING btree ("target_folder_id");--> statement-breakpoint
CREATE UNIQUE INDEX "links_source_folder_idx" ON "links" USING btree ("source_folder_id");--> statement-breakpoint
ALTER TABLE "batches" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "batches" DROP COLUMN "folder_id";--> statement-breakpoint
ALTER TABLE "batches" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "batches" DROP COLUMN "display_name";--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "folders" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "folders" DROP COLUMN "batch_id";