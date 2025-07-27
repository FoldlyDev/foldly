CREATE TYPE "public"."batch_status" AS ENUM('uploading', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."file_processing_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."link_type" AS ENUM('base', 'custom', 'generated');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'pro', 'business', 'enterprise');--> statement-breakpoint
CREATE TABLE "batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"folder_id" uuid,
	"uploader_name" varchar(255) NOT NULL,
	"uploader_email" varchar(255),
	"uploader_message" text,
	"name" varchar(255),
	"display_name" varchar(255),
	"status" "batch_status" DEFAULT 'uploading' NOT NULL,
	"total_files" integer DEFAULT 0 NOT NULL,
	"processed_files" integer DEFAULT 0 NOT NULL,
	"total_size" bigint DEFAULT 0 NOT NULL,
	"upload_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"folder_id" uuid,
	"file_name" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"file_size" bigint NOT NULL,
	"mime_type" varchar(255) NOT NULL,
	"extension" varchar(10),
	"storage_path" text NOT NULL,
	"storage_provider" varchar(50) DEFAULT 'supabase' NOT NULL,
	"checksum" varchar(64),
	"is_safe" boolean DEFAULT true NOT NULL,
	"virus_scan_result" varchar(50) DEFAULT 'clean' NOT NULL,
	"processing_status" "file_processing_status" DEFAULT 'pending' NOT NULL,
	"thumbnail_path" text,
	"is_organized" boolean DEFAULT false NOT NULL,
	"needs_review" boolean DEFAULT false NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"last_accessed_at" timestamp with time zone,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"parent_folder_id" uuid,
	"link_id" uuid,
	"name" varchar(255) NOT NULL,
	"path" text NOT NULL,
	"depth" integer DEFAULT 0 NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"file_count" integer DEFAULT 0 NOT NULL,
	"total_size" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"slug" varchar(100) NOT NULL,
	"topic" varchar(100),
	"link_type" "link_type" DEFAULT 'base' NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"require_email" boolean DEFAULT false NOT NULL,
	"require_password" boolean DEFAULT false NOT NULL,
	"password_hash" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"max_files" integer DEFAULT 100 NOT NULL,
	"max_file_size" bigint DEFAULT 104857600 NOT NULL,
	"expires_at" timestamp with time zone,
	"brand_enabled" boolean DEFAULT false NOT NULL,
	"brand_color" varchar(7),
	"total_uploads" integer DEFAULT 0 NOT NULL,
	"total_files" integer DEFAULT 0 NOT NULL,
	"total_size" bigint DEFAULT 0 NOT NULL,
	"last_upload_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(100) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"avatar_url" text,
	"subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"storage_used" bigint DEFAULT 0 NOT NULL,
	"storage_limit" bigint DEFAULT 2147483648 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) DEFAULT 'My Files' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_folder_id_folders_id_fk" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "batches_link_id_idx" ON "batches" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX "batches_user_id_idx" ON "batches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "batches_folder_id_idx" ON "batches" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "batches_status_idx" ON "batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "batches_created_at_idx" ON "batches" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "files_link_id_idx" ON "files" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX "files_batch_id_idx" ON "files" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "files_user_id_idx" ON "files" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "files_folder_id_idx" ON "files" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "files_file_name_idx" ON "files" USING btree ("file_name");--> statement-breakpoint
CREATE INDEX "files_mime_type_idx" ON "files" USING btree ("mime_type");--> statement-breakpoint
CREATE INDEX "files_processing_status_idx" ON "files" USING btree ("processing_status");--> statement-breakpoint
CREATE INDEX "files_uploaded_at_idx" ON "files" USING btree ("uploaded_at");--> statement-breakpoint
CREATE INDEX "files_checksum_idx" ON "files" USING btree ("checksum");--> statement-breakpoint
CREATE INDEX "folders_user_id_idx" ON "folders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "folders_workspace_id_idx" ON "folders" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "folders_parent_idx" ON "folders" USING btree ("parent_folder_id");--> statement-breakpoint
CREATE INDEX "folders_link_id_idx" ON "folders" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX "folders_path_idx" ON "folders" USING btree ("path");--> statement-breakpoint
CREATE INDEX "folders_depth_idx" ON "folders" USING btree ("depth");--> statement-breakpoint
CREATE INDEX "links_user_id_idx" ON "links" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "links_workspace_id_idx" ON "links" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "links_slug_topic_idx" ON "links" USING btree ("slug","topic");--> statement-breakpoint
CREATE INDEX "links_active_idx" ON "links" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_subscription_idx" ON "users" USING btree ("subscription_tier");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_user_id_idx" ON "workspaces" USING btree ("user_id");