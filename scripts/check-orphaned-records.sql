-- =============================================================================
-- CHECK FOR ORPHANED DATABASE RECORDS
-- =============================================================================
-- Run this query in Supabase SQL Editor to find files in DB but not in storage
-- These are orphaned records from failed DB deletions (acceptable edge case)

-- Query 1: Count total files in database
SELECT
  COUNT(*) as total_files,
  SUM(file_size) / (1024 * 1024) as total_size_mb
FROM files;

-- Query 2: Check for files uploaded in last 24 hours (recent activity)
SELECT
  id,
  filename,
  file_size / (1024 * 1024) as size_mb,
  storage_path,
  uploaded_at,
  parent_folder_id
FROM files
WHERE uploaded_at > NOW() - INTERVAL '24 hours'
ORDER BY uploaded_at DESC
LIMIT 20;

-- Query 3: Find potentially orphaned records
-- (Files older than 1 hour with suspicious patterns)
-- NOTE: This doesn't verify storage - manual check required
SELECT
  id,
  filename,
  storage_path,
  uploaded_at,
  workspace_id
FROM files
WHERE uploaded_at < NOW() - INTERVAL '1 hour'
ORDER BY uploaded_at DESC
LIMIT 50;

-- Query 4: Get file count by workspace
SELECT
  workspace_id,
  COUNT(*) as file_count,
  SUM(file_size) / (1024 * 1024) as total_size_mb
FROM files
GROUP BY workspace_id
ORDER BY file_count DESC;

-- =============================================================================
-- TO MANUALLY VERIFY A SPECIFIC FILE:
-- =============================================================================
-- 1. Run this query to get file details:
--    SELECT * FROM files WHERE id = 'your-file-id-here';
--
-- 2. Copy the storage_path value
--
-- 3. Check Supabase Storage dashboard:
--    - Navigate to foldly-uploads bucket
--    - Search for the storage_path
--    - If file doesn't exist → Orphaned DB record
--
-- 4. If orphaned, delete manually:
--    DELETE FROM files WHERE id = 'your-file-id-here';
