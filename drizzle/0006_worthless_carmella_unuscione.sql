ALTER TABLE "files" ADD COLUMN "search_vector" "tsvector";--> statement-breakpoint
CREATE INDEX "files_search_vector_idx" ON "files" USING gin ("search_vector");