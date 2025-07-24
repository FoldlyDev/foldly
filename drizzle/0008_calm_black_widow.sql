DROP INDEX "links_slug_topic_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "links_slug_topic_idx" ON "links" USING btree ("user_id","slug","topic");