-- =============================================================================
-- STORAGE QUOTA SYSTEM MIGRATION
-- =============================================================================
-- 🎯 Implements comprehensive storage quota management with subscription tiers
-- 📋 Adds storage tracking fields and SQL functions for quota validation
-- 🔧 Creates real-time usage tracking with database triggers

-- =============================================================================
-- 1. UPDATE SUBSCRIPTION TIER ENUM (Remove Enterprise)
-- =============================================================================

-- Drop and recreate subscription tier enum with only free, pro, business
DROP TYPE IF EXISTS subscription_tier CASCADE;
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'business');

-- =============================================================================
-- 2. ENHANCE USERS TABLE WITH STORAGE QUOTA FIELDS
-- =============================================================================

-- Add storage quota tracking fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS storage_used BIGINT DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS storage_limit BIGINT DEFAULT 1073741824 NOT NULL, -- 1GB for free tier
ADD COLUMN IF NOT EXISTS files_uploaded INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS last_quota_warning_at TIMESTAMP WITH TIME ZONE;

-- Update subscription tier column to use new enum
ALTER TABLE users 
ALTER COLUMN subscription_tier TYPE subscription_tier USING subscription_tier::text::subscription_tier;

-- Update default storage limits based on subscription tier
UPDATE users SET storage_limit = CASE subscription_tier
    WHEN 'free' THEN 1073741824        -- 1GB
    WHEN 'pro' THEN 107374182400       -- 100GB
    WHEN 'business' THEN 536870912000  -- 500GB
END WHERE storage_limit = 2147483648;  -- Only update old 2GB default

-- =============================================================================
-- 3. ENHANCE LINKS TABLE WITH STORAGE QUOTA FIELDS
-- =============================================================================

-- Add per-link storage tracking
ALTER TABLE links
ADD COLUMN IF NOT EXISTS storage_used BIGINT DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS storage_limit BIGINT DEFAULT 524288000 NOT NULL; -- 500MB default per link

-- =============================================================================
-- 4. CREATE QUOTA VALIDATION FUNCTIONS
-- =============================================================================

-- Function to check user upload quota
CREATE OR REPLACE FUNCTION check_user_upload_quota(
    p_user_id TEXT,
    p_file_size BIGINT
) RETURNS JSON AS $$
DECLARE
    v_user_record RECORD;
    v_available_space BIGINT;
    v_new_usage BIGINT;
BEGIN
    -- Get user storage info with subscription limits
    SELECT 
        u.storage_used,
        CASE u.subscription_tier
            WHEN 'free' THEN 1073741824        -- 1GB
            WHEN 'pro' THEN 107374182400       -- 100GB  
            WHEN 'business' THEN 536870912000  -- 500GB
        END as storage_limit,
        CASE u.subscription_tier
            WHEN 'free' THEN 10485760          -- 10MB
            WHEN 'pro' THEN 104857600          -- 100MB
            WHEN 'business' THEN 524288000     -- 500MB
        END as file_size_limit,
        u.subscription_tier
    INTO v_user_record
    FROM users u 
    WHERE u.id = p_user_id;
    
    -- Check if user exists
    IF NOT FOUND THEN
        RETURN json_build_object(
            'allowed', false,
            'error', 'user_not_found',
            'message', 'User not found'
        );
    END IF;
    
    -- Check file size limit
    IF p_file_size > v_user_record.file_size_limit THEN
        RETURN json_build_object(
            'allowed', false,
            'error', 'file_too_large',
            'message', format('File size exceeds %s limit', v_user_record.subscription_tier),
            'max_file_size', v_user_record.file_size_limit,
            'current_file_size', p_file_size
        );
    END IF;
    
    -- Calculate available space
    v_available_space := v_user_record.storage_limit - v_user_record.storage_used;
    v_new_usage := v_user_record.storage_used + p_file_size;
    
    -- Check storage quota
    IF p_file_size > v_available_space THEN
        RETURN json_build_object(
            'allowed', false,
            'error', 'quota_exceeded',
            'message', 'Storage quota exceeded',
            'storage_used', v_user_record.storage_used,
            'storage_limit', v_user_record.storage_limit,
            'available_space', v_available_space,
            'required_space', p_file_size,
            'subscription_tier', v_user_record.subscription_tier
        );
    END IF;
    
    -- Return success with usage info
    RETURN json_build_object(
        'allowed', true,
        'storage_used', v_user_record.storage_used,
        'storage_limit', v_user_record.storage_limit,
        'new_usage', v_new_usage,
        'usage_percentage', ROUND((v_new_usage::NUMERIC / v_user_record.storage_limit) * 100, 2),
        'subscription_tier', v_user_record.subscription_tier
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check link upload quota
CREATE OR REPLACE FUNCTION check_link_upload_quota(
    p_link_id UUID,
    p_file_size BIGINT
) RETURNS JSON AS $$
DECLARE
    v_link_record RECORD;
    v_available_space BIGINT;
    v_new_usage BIGINT;
BEGIN
    -- Get link storage info
    SELECT 
        l.storage_used,
        l.storage_limit,
        l.max_file_size,
        l.total_files,
        l.max_files
    INTO v_link_record
    FROM links l 
    WHERE l.id = p_link_id;
    
    -- Check if link exists
    IF NOT FOUND THEN
        RETURN json_build_object(
            'allowed', false,
            'error', 'link_not_found',
            'message', 'Link not found'
        );
    END IF;
    
    -- Check file count limit
    IF v_link_record.total_files >= v_link_record.max_files THEN
        RETURN json_build_object(
            'allowed', false,
            'error', 'file_count_exceeded',
            'message', 'Maximum file count reached for this link',
            'max_files', v_link_record.max_files,
            'current_files', v_link_record.total_files
        );
    END IF;
    
    -- Check individual file size limit
    IF p_file_size > v_link_record.max_file_size THEN
        RETURN json_build_object(
            'allowed', false,
            'error', 'file_too_large',
            'message', 'File size exceeds link limit',
            'max_file_size', v_link_record.max_file_size,
            'current_file_size', p_file_size
        );
    END IF;
    
    -- Calculate available space for link
    v_available_space := v_link_record.storage_limit - v_link_record.storage_used;
    v_new_usage := v_link_record.storage_used + p_file_size;
    
    -- Check link storage quota
    IF p_file_size > v_available_space THEN
        RETURN json_build_object(
            'allowed', false,
            'error', 'link_quota_exceeded',
            'message', 'Link storage quota exceeded',
            'storage_used', v_link_record.storage_used,
            'storage_limit', v_link_record.storage_limit,
            'available_space', v_available_space,
            'required_space', p_file_size
        );
    END IF;
    
    -- Return success
    RETURN json_build_object(
        'allowed', true,
        'storage_used', v_link_record.storage_used,
        'storage_limit', v_link_record.storage_limit,
        'new_usage', v_new_usage,
        'files_used', v_link_record.total_files,
        'files_limit', v_link_record.max_files
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 5. CREATE STORAGE USAGE TRACKING FUNCTIONS
-- =============================================================================

-- Function to update user storage usage
CREATE OR REPLACE FUNCTION update_user_storage_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Add file size to user storage
        UPDATE users 
        SET storage_used = storage_used + NEW.size,
            files_uploaded = files_uploaded + 1,
            updated_at = NOW()
        WHERE id = NEW.user_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update storage usage if file size changed
        IF OLD.size != NEW.size THEN
            UPDATE users 
            SET storage_used = storage_used - OLD.size + NEW.size,
                updated_at = NOW()
            WHERE id = NEW.user_id;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Remove file size from user storage
        UPDATE users 
        SET storage_used = GREATEST(storage_used - OLD.size, 0),
            files_uploaded = GREATEST(files_uploaded - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.user_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update link storage usage
CREATE OR REPLACE FUNCTION update_link_storage_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Add file size to link storage
        UPDATE links 
        SET storage_used = storage_used + NEW.size,
            total_files = total_files + 1,
            total_size = total_size + NEW.size,
            total_uploads = total_uploads + 1,
            last_upload_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.link_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update storage usage if file size changed
        IF OLD.size != NEW.size THEN
            UPDATE links 
            SET storage_used = storage_used - OLD.size + NEW.size,
                total_size = total_size - OLD.size + NEW.size,
                updated_at = NOW()
            WHERE id = NEW.link_id;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Remove file size from link storage
        UPDATE links 
        SET storage_used = GREATEST(storage_used - OLD.size, 0),
            total_files = GREATEST(total_files - 1, 0),
            total_size = GREATEST(total_size - OLD.size, 0),
            updated_at = NOW()
        WHERE id = OLD.link_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 6. CREATE TRIGGERS FOR AUTOMATIC STORAGE TRACKING
-- =============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_user_storage_trigger ON files;
DROP TRIGGER IF EXISTS update_link_storage_trigger ON files;

-- Create triggers for automatic storage tracking
CREATE TRIGGER update_user_storage_trigger
    AFTER INSERT OR UPDATE OR DELETE ON files
    FOR EACH ROW
    EXECUTE FUNCTION update_user_storage_usage();

CREATE TRIGGER update_link_storage_trigger
    AFTER INSERT OR UPDATE OR DELETE ON files
    FOR EACH ROW
    EXECUTE FUNCTION update_link_storage_usage();

-- =============================================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Users table indexes for quota queries
CREATE INDEX IF NOT EXISTS users_subscription_tier_idx ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS users_storage_usage_idx ON users(storage_used);
CREATE INDEX IF NOT EXISTS users_quota_warning_idx ON users(last_quota_warning_at);

-- Links table indexes for quota queries
CREATE INDEX IF NOT EXISTS links_user_storage_idx ON links(user_id, storage_used);
CREATE INDEX IF NOT EXISTS links_storage_usage_idx ON links(storage_used);
CREATE INDEX IF NOT EXISTS links_total_files_idx ON links(total_files);

-- Files table indexes for usage calculations
CREATE INDEX IF NOT EXISTS files_user_size_idx ON files(user_id, size);
CREATE INDEX IF NOT EXISTS files_link_size_idx ON files(link_id, size) WHERE link_id IS NOT NULL;

-- =============================================================================
-- 8. CREATE MONITORING VIEWS
-- =============================================================================

-- Storage usage summary by subscription tier
CREATE OR REPLACE VIEW storage_usage_by_tier AS
SELECT 
    subscription_tier,
    COUNT(*) as user_count,
    AVG(storage_used) as avg_usage,
    SUM(storage_used) as total_usage,
    AVG((storage_used::NUMERIC / 
         CASE subscription_tier
             WHEN 'free' THEN 1073741824
             WHEN 'pro' THEN 107374182400
             WHEN 'business' THEN 536870912000
         END) * 100) as avg_usage_percentage
FROM users
GROUP BY subscription_tier;

-- Users approaching quota limits
CREATE OR REPLACE VIEW users_near_quota AS
SELECT 
    id,
    username,
    email,
    subscription_tier,
    storage_used,
    CASE subscription_tier
        WHEN 'free' THEN 1073741824
        WHEN 'pro' THEN 107374182400
        WHEN 'business' THEN 536870912000
    END as storage_limit,
    ROUND((storage_used::NUMERIC / 
           CASE subscription_tier
               WHEN 'free' THEN 1073741824
               WHEN 'pro' THEN 107374182400
               WHEN 'business' THEN 536870912000
           END) * 100, 2) as usage_percentage
FROM users
WHERE (storage_used::NUMERIC / 
       CASE subscription_tier
           WHEN 'free' THEN 1073741824
           WHEN 'pro' THEN 107374182400
           WHEN 'business' THEN 536870912000
       END) > 0.8
ORDER BY usage_percentage DESC;

-- Links with high storage usage
CREATE OR REPLACE VIEW links_near_quota AS
SELECT 
    l.id,
    l.slug,
    l.title,
    u.username,
    l.storage_used,
    l.storage_limit,
    l.total_files,
    l.max_files,
    ROUND((l.storage_used::NUMERIC / l.storage_limit) * 100, 2) as usage_percentage
FROM links l
JOIN users u ON l.user_id = u.id
WHERE (l.storage_used::NUMERIC / l.storage_limit) > 0.8
ORDER BY usage_percentage DESC;

-- =============================================================================
-- 9. INITIALIZE EXISTING DATA
-- =============================================================================

-- Calculate current storage usage for existing users
UPDATE users 
SET storage_used = COALESCE((
    SELECT SUM(f.size) 
    FROM files f 
    WHERE f.user_id = users.id
), 0),
files_uploaded = COALESCE((
    SELECT COUNT(*) 
    FROM files f 
    WHERE f.user_id = users.id
), 0);

-- Calculate current storage usage for existing links
UPDATE links 
SET storage_used = COALESCE((
    SELECT SUM(f.size) 
    FROM files f 
    WHERE f.link_id = links.id
), 0);

-- Update total_files and total_size for existing links
UPDATE links 
SET total_files = COALESCE((
    SELECT COUNT(*) 
    FROM files f 
    WHERE f.link_id = links.id
), 0),
total_size = storage_used;

-- =============================================================================
-- 10. GRANT PERMISSIONS
-- =============================================================================

-- Grant execute permissions on quota functions to authenticated users
GRANT EXECUTE ON FUNCTION check_user_upload_quota(TEXT, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_link_upload_quota(UUID, BIGINT) TO authenticated;

-- Grant select permissions on monitoring views
GRANT SELECT ON storage_usage_by_tier TO authenticated;
GRANT SELECT ON users_near_quota TO authenticated;
GRANT SELECT ON links_near_quota TO authenticated;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Log successful migration
DO $$
BEGIN
    RAISE NOTICE 'Storage Quota System Migration Completed Successfully';
    RAISE NOTICE '✅ Subscription tiers updated: free, pro, business';
    RAISE NOTICE '✅ Storage tracking fields added to users and links';
    RAISE NOTICE '✅ Quota validation functions created';
    RAISE NOTICE '✅ Automatic usage tracking triggers enabled';
    RAISE NOTICE '✅ Performance indexes created';
    RAISE NOTICE '✅ Monitoring views available';
    RAISE NOTICE '✅ Existing data initialized';
END $$;