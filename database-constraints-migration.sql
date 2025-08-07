-- =============================================================================
-- DATABASE CONSTRAINTS AND TRIGGERS FOR FOLDLY MIGRATION
-- =============================================================================
-- This file contains all the constraints and triggers needed for the database
-- migration to enforce proper context separation and data integrity
-- =============================================================================

-- 1. FILES TABLE CONSTRAINTS
-- =============================================================================

-- Ensure files belong to EITHER workspace OR link (not both)
ALTER TABLE files ADD CONSTRAINT files_single_context 
CHECK (
  (workspace_id IS NOT NULL AND link_id IS NULL) OR 
  (workspace_id IS NULL AND link_id IS NOT NULL)
);

-- Updated: Allow three scenarios for file uploads
-- 1. Personal workspace upload (no batch)
-- 2. Link upload (has link_id and batch_id)
-- 3. Generated link upload (has workspace_id and batch_id)
ALTER TABLE files ADD CONSTRAINT files_upload_tracking
CHECK (
  (workspace_id IS NOT NULL AND link_id IS NULL AND batch_id IS NULL) OR  -- Personal upload
  (workspace_id IS NULL AND link_id IS NOT NULL AND batch_id IS NOT NULL) OR  -- Link upload
  (workspace_id IS NOT NULL AND link_id IS NULL AND batch_id IS NOT NULL)  -- Generated link upload
);

-- If file is in a folder, contexts must match
-- This requires a more complex constraint that checks the folder's context
CREATE OR REPLACE FUNCTION check_file_folder_context_match()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.folder_id IS NOT NULL THEN
    -- Check that file and folder have matching contexts
    IF NOT EXISTS (
      SELECT 1 FROM folders f 
      WHERE f.id = NEW.folder_id 
      AND (
        (f.workspace_id IS NOT NULL AND NEW.workspace_id = f.workspace_id AND NEW.link_id IS NULL) OR
        (f.link_id IS NOT NULL AND NEW.link_id = f.link_id AND NEW.workspace_id IS NULL)
      )
    ) THEN
      RAISE EXCEPTION 'File context must match folder context';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER file_folder_context_match
BEFORE INSERT OR UPDATE ON files
FOR EACH ROW EXECUTE FUNCTION check_file_folder_context_match();

-- 2. FOLDERS TABLE CONSTRAINTS
-- =============================================================================

-- Ensure folders belong to EITHER workspace OR link (not both)
ALTER TABLE folders ADD CONSTRAINT folders_single_context 
CHECK (
  (workspace_id IS NOT NULL AND link_id IS NULL) OR 
  (workspace_id IS NULL AND link_id IS NOT NULL)
);

-- Child folders must inherit parent's context
CREATE OR REPLACE FUNCTION check_folder_context_consistency()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_folder_id IS NOT NULL THEN
    -- Check that child has same context as parent
    IF NOT EXISTS (
      SELECT 1 FROM folders p
      WHERE p.id = NEW.parent_folder_id
      AND (
        (p.workspace_id IS NOT NULL AND NEW.workspace_id = p.workspace_id AND NEW.link_id IS NULL) OR
        (p.link_id IS NOT NULL AND NEW.link_id = p.link_id AND NEW.workspace_id IS NULL)
      )
    ) THEN
      RAISE EXCEPTION 'Child folder must have same context (workspace/link) as parent folder';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER folder_context_inheritance
BEFORE INSERT OR UPDATE ON folders
FOR EACH ROW EXECUTE FUNCTION check_folder_context_consistency();

-- 3. BATCHES TABLE CONSTRAINTS
-- =============================================================================

-- Updated: Target folder validation depends on link type
-- For base/custom links: targetFolderId should be NULL
-- For generated links: targetFolderId should match link.sourceFolderId
CREATE OR REPLACE FUNCTION check_batch_target_folder()
RETURNS TRIGGER AS $$
DECLARE
  link_type varchar;
  source_folder_id uuid;
BEGIN
  -- Get link type and source folder
  SELECT l.link_type, l.source_folder_id INTO link_type, source_folder_id
  FROM links l WHERE l.id = NEW.link_id;
  
  IF link_type = 'generated' THEN
    -- For generated links, target_folder_id should match the link's source folder
    IF NEW.target_folder_id IS NULL OR NEW.target_folder_id != source_folder_id THEN
      RAISE EXCEPTION 'Generated link uploads must target the source folder';
    END IF;
  ELSE
    -- For base/custom links, target_folder_id should be NULL
    IF NEW.target_folder_id IS NOT NULL THEN
      RAISE EXCEPTION 'Base/custom link uploads cannot specify target folder';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER batch_target_folder_check
BEFORE INSERT OR UPDATE ON batches
FOR EACH ROW EXECUTE FUNCTION check_batch_target_folder();

-- 4. LINKS TABLE CONSTRAINTS
-- =============================================================================

-- Add foreign key constraint for sourceFolderId (handled here due to circular dependency)
ALTER TABLE links 
ADD CONSTRAINT links_source_folder_id_fkey 
FOREIGN KEY (source_folder_id) 
REFERENCES folders(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- If link type is 'generated', must have sourceFolderId
ALTER TABLE links ADD CONSTRAINT generated_links_require_source
CHECK (
  (link_type != 'generated') OR 
  (link_type = 'generated' AND source_folder_id IS NOT NULL)
);

-- Generated link source must be a workspace folder
CREATE OR REPLACE FUNCTION check_generated_link_source()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.source_folder_id IS NOT NULL THEN
    -- Verify the folder exists and belongs to the same workspace
    IF NOT EXISTS (
      SELECT 1 FROM folders f 
      WHERE f.id = NEW.source_folder_id 
      AND f.workspace_id = NEW.workspace_id
      AND f.link_id IS NULL  -- Must be a workspace folder, not a link folder
    ) THEN
      RAISE EXCEPTION 'Generated link source must be a workspace folder in the same workspace';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generated_link_source_check
BEFORE INSERT OR UPDATE ON links
FOR EACH ROW EXECUTE FUNCTION check_generated_link_source();

-- 5. PERFORMANCE INDEXES FOR NEW STRUCTURE
-- =============================================================================

-- Create new indexes for efficient storage calculations without userId
CREATE INDEX IF NOT EXISTS files_workspace_filesize_idx ON files(workspace_id, file_size) 
WHERE workspace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS files_link_filesize_idx ON files(link_id, file_size) 
WHERE link_id IS NOT NULL;

-- Index for finding files by context and folder
CREATE INDEX IF NOT EXISTS files_workspace_folder_idx ON files(workspace_id, folder_id) 
WHERE workspace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS files_link_folder_idx ON files(link_id, folder_id) 
WHERE link_id IS NOT NULL;

-- 6. TRACKING GENERATED LINK UPLOADS
-- =============================================================================

-- Create a view to easily identify files uploaded via generated links
CREATE OR REPLACE VIEW generated_link_uploads AS
SELECT 
  f.id as file_id,
  f.file_name,
  f.file_size,
  f.workspace_id,
  f.folder_id,
  f.batch_id,
  b.link_id,
  b.uploader_name,
  b.uploader_email,
  b.created_at as upload_date,
  l.slug as link_slug,
  l.title as link_title,
  fo.name as folder_name,
  fo.path as folder_path
FROM files f
JOIN batches b ON f.batch_id = b.id
JOIN links l ON b.link_id = l.id
JOIN folders fo ON f.folder_id = fo.id
WHERE f.workspace_id IS NOT NULL 
  AND f.batch_id IS NOT NULL
  AND l.link_type = 'generated';

-- Index for efficient generated link upload queries
CREATE INDEX IF NOT EXISTS files_generated_upload_idx 
ON files(workspace_id, batch_id) 
WHERE workspace_id IS NOT NULL AND batch_id IS NOT NULL;

-- 7. VALIDATION QUERIES (Run these before applying constraints to check data)
-- =============================================================================

-- Check for files with conflicting contexts
SELECT COUNT(*) as conflicting_files FROM files 
WHERE workspace_id IS NOT NULL AND link_id IS NOT NULL;

-- Check for folders with conflicting contexts
SELECT COUNT(*) as conflicting_folders FROM folders 
WHERE workspace_id IS NOT NULL AND link_id IS NOT NULL;

-- Check for files without context
SELECT COUNT(*) as orphaned_files FROM files 
WHERE workspace_id IS NULL AND link_id IS NULL;

-- Check for folders without context
SELECT COUNT(*) as orphaned_folders FROM folders 
WHERE workspace_id IS NULL AND link_id IS NULL;

-- Check for link files without batch
SELECT COUNT(*) as link_files_without_batch FROM files 
WHERE link_id IS NOT NULL AND batch_id IS NULL;

-- Check for nested folders with mismatched contexts
SELECT 
  child.id as child_id,
  child.name as child_name,
  parent.id as parent_id,
  parent.name as parent_name,
  CASE 
    WHEN child.workspace_id IS NOT NULL THEN 'workspace'
    ELSE 'link'
  END as child_context,
  CASE 
    WHEN parent.workspace_id IS NOT NULL THEN 'workspace'
    ELSE 'link'
  END as parent_context
FROM folders child
JOIN folders parent ON child.parent_folder_id = parent.id
WHERE 
  (child.workspace_id IS NOT NULL AND parent.workspace_id IS NULL) OR
  (child.link_id IS NOT NULL AND parent.link_id IS NULL) OR
  (child.workspace_id != parent.workspace_id) OR
  (child.link_id != parent.link_id);

-- Check for files in folders with mismatched contexts
SELECT 
  f.id as file_id,
  f.file_name,
  fo.id as folder_id,
  fo.name as folder_name,
  CASE 
    WHEN f.workspace_id IS NOT NULL THEN 'workspace'
    ELSE 'link'
  END as file_context,
  CASE 
    WHEN fo.workspace_id IS NOT NULL THEN 'workspace'
    ELSE 'link'
  END as folder_context
FROM files f
JOIN folders fo ON f.folder_id = fo.id
WHERE 
  (f.workspace_id IS NOT NULL AND fo.workspace_id IS NULL) OR
  (f.link_id IS NOT NULL AND fo.link_id IS NULL) OR
  (f.workspace_id != fo.workspace_id) OR
  (f.link_id != fo.link_id);

-- Check for existing generated links (if any)
SELECT COUNT(*) as existing_generated_links 
FROM links WHERE link_type = 'generated';

-- Check for folders with multiple generated links (shouldn't exist)
SELECT 
  f.id as folder_id,
  f.name as folder_name,
  COUNT(l.id) as link_count
FROM folders f
JOIN links l ON l.source_folder_id = f.id
WHERE l.link_type = 'generated'
GROUP BY f.id, f.name
HAVING COUNT(l.id) > 1;

-- Check for generated links pointing to non-workspace folders
SELECT 
  l.id as link_id,
  l.title as link_title,
  f.id as folder_id,
  f.name as folder_name,
  CASE 
    WHEN f.workspace_id IS NOT NULL THEN 'workspace folder'
    WHEN f.link_id IS NOT NULL THEN 'link folder (INVALID)'
    ELSE 'unknown'
  END as folder_type
FROM links l
JOIN folders f ON l.source_folder_id = f.id
WHERE l.link_type = 'generated' 
  AND (f.workspace_id IS NULL OR f.link_id IS NOT NULL);