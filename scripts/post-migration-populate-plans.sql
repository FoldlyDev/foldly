-- =============================================================================
-- POST-MIGRATION SCRIPT: Populate Plan Features (Run after drizzle push)
-- =============================================================================
-- 🎯 Populates highlight_features and feature_descriptions JSON columns
-- 📊 Based on current plan structure with user-friendly feature descriptions

-- Update FREE plan features (first 6 features)
UPDATE subscription_plans 
SET 
  highlight_features = '[
    "50GB generous storage space",
    "Personalized custom username", 
    "Unlimited file sharing links",
    "Email notifications for activities",
    "Beautiful file preview thumbnails",
    "OneDrive & Google Drive integrations"
  ]'::jsonb,
  feature_descriptions = '{
    "storage_limits": "Get 50GB of secure cloud storage to keep all your important files organized and accessible",
    "custom_username": "Create your unique username for personalized profile links and professional branding",
    "unlimited_links": "Share files freely with unlimited link creation - no restrictions on how many you can make",
    "email_notifications": "Stay informed with instant email alerts whenever files are uploaded or shared through your links",
    "file_preview_thumbnails": "See beautiful thumbnail previews of your images, documents, and files at a glance",
    "cloud_integrations": "Seamlessly connect with OneDrive and Google Drive for effortless file sharing across platforms"
  }'::jsonb
WHERE plan_key = 'free';

-- Update PRO plan features (all except priority support)
UPDATE subscription_plans
SET
  highlight_features = '[
    "500GB massive storage upgrade",
    "Advanced custom branding & banners",
    "Premium short links (5 chars or less)", 
    "Password-protected secure links",
    "Smart file restrictions & controls",
    "QR code generation for mobile sharing",
    "Everything from Free plan included"
  ]'::jsonb,
  feature_descriptions = '{
    "storage_limits": "Upgrade to 500GB of premium storage space - perfect for growing businesses and power users",
    "custom_username": "Create your unique username for personalized profile links and professional branding",
    "unlimited_links": "Share files freely with unlimited link creation - no restrictions on how many you can make",
    "email_notifications": "Stay informed with instant email alerts whenever files are uploaded or shared through your links",
    "file_preview_thumbnails": "See beautiful thumbnail previews of your images, documents, and files at a glance",
    "cloud_integrations": "Seamlessly connect with OneDrive and Google Drive for effortless file sharing across platforms",
    "custom_branding": "Make it yours with custom banners, colors, and remove Foldly branding for a professional look",
    "premium_short_links": "Get memorable premium short links with 5 characters or less for easy sharing and marketing",
    "password_protected_links": "Secure your sensitive files with password protection - only authorized users can access",
    "file_restrictions": "Take control with custom file size limits and type restrictions for each sharing link",
    "qr_code_generation": "Generate QR codes instantly for your links, making mobile sharing quick and effortless"
  }'::jsonb,
  is_popular = true
WHERE plan_key = 'pro';

-- Update BUSINESS plan features (all features)
UPDATE subscription_plans
SET
  highlight_features = '[
    "2TB enterprise-grade storage",
    "Dedicated priority support team",
    "Advanced team collaboration tools",
    "Enterprise security & compliance",
    "Custom API integrations",
    "Advanced analytics dashboard",
    "Everything from Pro plan included"
  ]'::jsonb,
  feature_descriptions = '{
    "storage_limits": "Enterprise-scale 2TB storage capacity for teams and organizations with extensive file sharing needs",
    "custom_username": "Create your unique username for personalized profile links and professional branding",
    "unlimited_links": "Share files freely with unlimited link creation - no restrictions on how many you can make",
    "email_notifications": "Stay informed with instant email alerts whenever files are uploaded or shared through your links",
    "file_preview_thumbnails": "See beautiful thumbnail previews of your images, documents, and files at a glance",
    "cloud_integrations": "Seamlessly connect with OneDrive and Google Drive for effortless file sharing across platforms",
    "custom_branding": "Make it yours with custom banners, colors, and remove Foldly branding for a professional look",
    "premium_short_links": "Get memorable premium short links with 5 characters or less for easy sharing and marketing",
    "password_protected_links": "Secure your sensitive files with password protection - only authorized users can access",
    "file_restrictions": "Take control with custom file size limits and type restrictions for each sharing link",
    "qr_code_generation": "Generate QR codes instantly for your links, making mobile sharing quick and effortless",
    "priority_support": "Get fast-track customer support with dedicated assistance and guaranteed faster response times"
  }'::jsonb
WHERE plan_key = 'business';

-- Verify the updates
SELECT 
  plan_key,
  plan_name,
  monthly_price_usd,
  storage_limit_gb,
  is_popular,
  jsonb_array_length(highlight_features) as highlight_count
FROM subscription_plans 
ORDER BY sort_order;

-- Show feature counts per plan
SELECT 
  plan_key,
  jsonb_array_length(highlight_features) as highlights,
  jsonb_object_keys(feature_descriptions) as available_features
FROM subscription_plans 
ORDER BY sort_order;