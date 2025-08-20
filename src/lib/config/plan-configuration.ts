/**
 * Centralized Plan Configuration
 * This is the single source of truth for all plan-related configuration
 * It mirrors the database structure and should be kept in sync with the subscription_plans table
 * 
 * IMPORTANT: This configuration should match the database values exactly
 * Database is the ultimate source of truth - this file provides type-safe access
 */

// =============================================================================
// PLAN CONFIGURATION
// =============================================================================

export const PLAN_CONFIGURATION = {
  plans: {
    free: {
      plan_key: 'free',
      plan_name: 'Free',
      plan_description: "Perfect for getting started! Get 50GB of generous storage space to explore Foldly's powerful file sharing features.",
      monthly_price_usd: 0.00,
      yearly_price_usd: 0.00,
      storage_limit_gb: 50,
      max_file_size_mb: 5, // 5MB (Supabase deployment limit)
      features: {
        storage_limits: true,
        custom_username: true,
        unlimited_links: true,
        email_notifications: true,
        file_preview_thumbnails: true,
        cloud_integrations: true,
        color_customization: true,
        file_size_limit: true,
        custom_branding: false,
        premium_short_links: false,
        password_protected_links: false,
        qr_code_generation: false,
        priority_support: false,
        file_restrictions: false,
        custom_domains: false,
      },
    },
    pro: {
      plan_key: 'pro',
      plan_name: 'Pro',
      plan_description: 'Level up your file sharing game! Everything from Free plus massive storage upgrade, premium features, and custom branding.',
      monthly_price_usd: 10.00,
      yearly_price_usd: 100.00,
      storage_limit_gb: 500,
      max_file_size_mb: 5, // 5MB (Supabase deployment limit)
      features: {
        storage_limits: true,
        custom_username: true,
        unlimited_links: true,
        email_notifications: true,
        file_preview_thumbnails: true,
        cloud_integrations: true,
        color_customization: true,
        file_size_limit: true,
        custom_branding: true,
        premium_short_links: true,
        password_protected_links: true,
        qr_code_generation: true,
        file_restrictions: true,
        priority_support: false,
        custom_domains: false,
      },
    },
    business: {
      plan_key: 'business',
      plan_name: 'Business',
      plan_description: 'Built for teams that mean business! Everything Pro offers plus massive storage, custom domains, and priority support.',
      monthly_price_usd: 35.00,
      yearly_price_usd: 350.00,
      storage_limit_gb: 2048, // 2TB
      max_file_size_mb: 5, // 5MB (Supabase deployment limit)
      features: {
        storage_limits: true,
        custom_username: true,
        unlimited_links: true,
        email_notifications: true,
        file_preview_thumbnails: true,
        cloud_integrations: true,
        color_customization: true,
        file_size_limit: true,
        custom_branding: true,
        premium_short_links: true,
        password_protected_links: true,
        qr_code_generation: true,
        file_restrictions: true,
        priority_support: true,
        custom_domains: true,
      },
      note: 'Business tier will be disabled for the MVP',
    },
  },
  feature_definitions: {
    storage_limits: {
      name: 'Storage Limits',
      description: 'Storage capacity based on subscription tier. Free: 50GB, Pro: 500GB, Business: 2TB.',
      category: 'storage',
    },
    file_size_limit: {
      name: 'File Size Limits',
      description: 'Maximum file size per upload. All plans: 5MB (Supabase deployment limit).',
      category: 'storage',
    },
    custom_username: {
      name: 'Custom Username',
      description: 'Allows users to set personalized usernames for their profiles and links.',
      category: 'core',
    },
    unlimited_links: {
      name: 'Unlimited Links',
      description: 'Create unlimited file sharing links without restrictions.',
      category: 'core',
    },
    email_notifications: {
      name: 'Email Notifications',
      description: 'Receive email notifications for file activities and sharing events.',
      category: 'core',
    },
    file_preview_thumbnails: {
      name: 'File Preview Thumbnails',
      description: 'Generate and display thumbnail previews for supported file types.',
      category: 'core',
    },
    cloud_integrations: {
      name: 'Cloud Integrations',
      description: 'OneDrive and Google Drive integrations for seamless file sharing.',
      category: 'core',
    },
    color_customization: {
      name: 'Color Customization',
      description: 'Customize interface colors. Free: basic options, Pro+: advanced customization.',
      category: 'customization',
    },
    custom_branding: {
      name: 'Custom Branding',
      description: 'Custom banners, remove Foldly branding, and advanced customization options.',
      category: 'customization',
      proOnly: true,
    },
    premium_short_links: {
      name: 'Premium Short Links',
      description: 'Access to premium short links with 5 characters or less.',
      category: 'premium',
      proOnly: true,
    },
    password_protected_links: {
      name: 'Password Protected Links',
      description: 'Add password protection to shared links for enhanced security.',
      category: 'premium',
      proOnly: true,
    },
    qr_code_generation: {
      name: 'QR Code Generation',
      description: 'Generate QR codes for links to enable easy mobile sharing.',
      category: 'premium',
      proOnly: true,
    },
    file_restrictions: {
      name: 'File Restrictions',
      description: 'Set file size and type restrictions per link for better control.',
      category: 'premium',
      proOnly: true,
      comingSoon: true,
    },
    custom_domains: {
      name: 'Custom Domains',
      description: 'Use your own domain for branded short links and professional appearance.',
      category: 'premium',
      businessOnly: true,
      comingSoon: true,
    },
    priority_support: {
      name: 'Priority Support',
      description: 'Fast-track customer support with dedicated assistance and faster response times.',
      category: 'support',
      businessOnly: true,
    },
  },
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type PlanKey = keyof typeof PLAN_CONFIGURATION.plans;
export type FeatureKey = keyof typeof PLAN_CONFIGURATION.feature_definitions;
export type Plan = typeof PLAN_CONFIGURATION.plans[PlanKey];
export type Feature = typeof PLAN_CONFIGURATION.feature_definitions[FeatureKey];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get plan configuration by key
 */
export function getPlanConfig(planKey: PlanKey): Plan {
  return PLAN_CONFIGURATION.plans[planKey];
}

/**
 * Get feature definition by key
 */
export function getFeatureDefinition(featureKey: FeatureKey): Feature {
  return PLAN_CONFIGURATION.feature_definitions[featureKey];
}

/**
 * Check if a feature is available for a plan
 */
export function isPlanFeatureEnabled(planKey: PlanKey, featureKey: FeatureKey): boolean {
  const plan = PLAN_CONFIGURATION.plans[planKey];
  return plan.features[featureKey] ?? false;
}

/**
 * Get file size limit in bytes for a plan
 */
export function getPlanFileSizeLimit(planKey: PlanKey): number {
  const plan = PLAN_CONFIGURATION.plans[planKey];
  return plan.max_file_size_mb * 1024 * 1024;
}

/**
 * Get storage limit in bytes for a plan
 */
export function getPlanStorageLimit(planKey: PlanKey): number {
  const plan = PLAN_CONFIGURATION.plans[planKey];
  return plan.storage_limit_gb * 1024 * 1024 * 1024;
}

/**
 * Format file size limit for display
 */
export function formatPlanFileSize(planKey: PlanKey): string {
  const plan = PLAN_CONFIGURATION.plans[planKey];
  const gb = plan.max_file_size_mb / 1024;
  return gb >= 1 ? `${gb}GB` : `${plan.max_file_size_mb}MB`;
}

/**
 * Format storage limit for display
 */
export function formatPlanStorage(planKey: PlanKey): string {
  const plan = PLAN_CONFIGURATION.plans[planKey];
  const tb = plan.storage_limit_gb / 1024;
  return tb >= 1 ? `${tb}TB` : `${plan.storage_limit_gb}GB`;
}

/**
 * Get all features for a specific plan
 */
export function getPlanFeatures(planKey: PlanKey): FeatureKey[] {
  const plan = PLAN_CONFIGURATION.plans[planKey];
  return Object.entries(plan.features)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => key as FeatureKey);
}

/**
 * Get plan by file size requirement
 */
export function getRequiredPlanForFileSize(fileSizeBytes: number): PlanKey | null {
  const fileSizeMB = Math.ceil(fileSizeBytes / (1024 * 1024));
  
  if (fileSizeMB <= PLAN_CONFIGURATION.plans.free.max_file_size_mb) {
    return 'free';
  } else if (fileSizeMB <= PLAN_CONFIGURATION.plans.pro.max_file_size_mb) {
    return 'pro';
  } else if (fileSizeMB <= PLAN_CONFIGURATION.plans.business.max_file_size_mb) {
    return 'business';
  }
  
  return null; // File too large for any plan
}

// =============================================================================
// SYSTEM LIMITS
// =============================================================================

/**
 * System-wide limits (not plan-specific)
 * These are technical constraints that apply regardless of plan
 */
export const SYSTEM_LIMITS = {
  // Absolute maximum file size the system can handle (Business plan limit)
  MAX_FILE_SIZE: PLAN_CONFIGURATION.plans.business.max_file_size_mb * 1024 * 1024,
  
  // Maximum total size for batch uploads
  MAX_BATCH_SIZE: 10 * 1024 * 1024 * 1024, // 10GB
  
  // Maximum files per batch upload
  MAX_FILES_PER_BATCH: 10, // Supabase rate limit
  
  // Maximum files per folder
  MAX_FILES_PER_FOLDER: 1000,
  
  // Maximum folder nesting depth
  MAX_FOLDER_DEPTH: 10,
  
  // Rate limiting
  MAX_UPLOADS_PER_MINUTE: 10,
  
  // File name constraints
  MAX_FILE_NAME_LENGTH: 255,
} as const;

// =============================================================================
// DEPRECATED NOTICE
// =============================================================================

/**
 * @deprecated Use PLAN_CONFIGURATION instead
 * This export is for backward compatibility only
 */
export const FILE_SIZE_LIMITS = {
  free: {
    maxFileSize: getPlanFileSizeLimit('free'),
    maxFileSizeMB: PLAN_CONFIGURATION.plans.free.max_file_size_mb,
    storageLimit: getPlanStorageLimit('free'),
    storageLimitGB: PLAN_CONFIGURATION.plans.free.storage_limit_gb,
  },
  pro: {
    maxFileSize: getPlanFileSizeLimit('pro'),
    maxFileSizeMB: PLAN_CONFIGURATION.plans.pro.max_file_size_mb,
    storageLimit: getPlanStorageLimit('pro'),
    storageLimitGB: PLAN_CONFIGURATION.plans.pro.storage_limit_gb,
  },
  business: {
    maxFileSize: getPlanFileSizeLimit('business'),
    maxFileSizeMB: PLAN_CONFIGURATION.plans.business.max_file_size_mb,
    storageLimit: getPlanStorageLimit('business'),
    storageLimitGB: PLAN_CONFIGURATION.plans.business.storage_limit_gb,
  },
} as const;