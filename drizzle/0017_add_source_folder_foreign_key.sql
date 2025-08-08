-- Add foreign key constraint for source_folder_id in links table
-- This ensures generated links are deleted when their source folder is deleted
ALTER TABLE links
ADD CONSTRAINT fk_links_source_folder
FOREIGN KEY (source_folder_id) 
REFERENCES folders(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;