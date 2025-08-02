/**
 * Feature Definitions
 * @deprecated Use @/lib/config/plan-configuration for centralized plan and feature configuration
 * This file is maintained for backward compatibility only
 * 
 * The new centralized configuration provides:
 * - Complete plan definitions with limits
 * - Feature availability per plan
 * - Helper functions for plan-based logic
 */

export const FEATURE_DEFINITIONS = {
  // Storage & Limits
  storage_limits: {
    name: 'Storage Limits',
    description: 'Storage capacity based on subscription tier. Free: 50GB, Pro: 500GB, Business: 2TB.',
    category: 'storage',
  },
  file_size_limit: {
    name: 'File Size Limits',
    description: 'Maximum file size per upload. Free: 2GB, Pro: 10GB, Business: 25GB.',
    category: 'storage',
  },

  // Core Features
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

  // Customization
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

  // Premium Features
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

  // Support
  priority_support: {
    name: 'Priority Support',
    description: 'Fast-track customer support with dedicated assistance and faster response times.',
    category: 'support',
    businessOnly: true,
  },

  // Future Features (mentioned in your config)
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
} as const;

/**
 * Plan configurations with feature availability
 * This mirrors your Clerk configuration for consistency
 */
export const PLAN_FEATURES = {
  free: {
    plan_key: 'free',
    plan_name: 'Free',
    plan_description: 'Perfect for getting started! Get 50GB of generous storage space to explore Foldly\'s powerful file sharing features.',
    monthly_price_usd: 0,
    yearly_price_usd: 0,
    storage_limit_gb: 50,
    max_file_size_mb: 2048, // 2GB
    features: {
      // Core features available to all
      storage_limits: true,
      file_size_limit: true,
      custom_username: true,
      unlimited_links: true,
      email_notifications: true,
      file_preview_thumbnails: true,
      cloud_integrations: true,
      color_customization: true,
      // Premium features not available
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
    monthly_price_usd: 10,
    yearly_price_usd: 100,
    storage_limit_gb: 500,
    max_file_size_mb: 10240, // 10GB
    features: {
      // All core features
      storage_limits: true,
      file_size_limit: true,
      custom_username: true,
      unlimited_links: true,
      email_notifications: true,
      file_preview_thumbnails: true,
      cloud_integrations: true,
      color_customization: true,
      // Pro features
      custom_branding: true,
      premium_short_links: true,
      password_protected_links: true,
      qr_code_generation: true,
      file_restrictions: true,
      // Business only
      priority_support: false,
      custom_domains: false,
    },
  },
  business: {
    plan_key: 'business',
    plan_name: 'Business',
    plan_description: 'Built for teams that mean business! Everything Pro offers plus massive storage, custom domains, and priority support.',
    monthly_price_usd: 35,
    yearly_price_usd: 350,
    storage_limit_gb: 2048, // 2TB
    max_file_size_mb: 25600, // 25GB
    features: {
      // All features enabled
      storage_limits: true,
      file_size_limit: true,
      custom_username: true,
      unlimited_links: true,
      email_notifications: true,
      file_preview_thumbnails: true,
      cloud_integrations: true,
      color_customization: true,
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
} as const;

// Type exports
export type FeatureKey = keyof typeof FEATURE_DEFINITIONS;
export type PlanKey = keyof typeof PLAN_FEATURES;
export type FeatureCategory = 'storage' | 'core' | 'customization' | 'premium' | 'support';

/**
 * Helper function to check if a feature is available for a plan
 * Note: In production, always use Clerk's has() method for actual access control
 * This is only for UI display purposes
 */
export function isPlanFeatureEnabled(plan: PlanKey, feature: FeatureKey): boolean {
  return PLAN_FEATURES[plan].features[feature] ?? false;
}

/**
 * Get all features for a specific category
 */
export function getFeaturesByCategory(category: FeatureCategory): FeatureKey[] {
  return Object.entries(FEATURE_DEFINITIONS)
    .filter(([_, def]) => def.category === category)
    .map(([key]) => key as FeatureKey);
}

/**
 * Get features that are exclusive to a plan or higher
 */
export function getExclusiveFeatures(plan: PlanKey): FeatureKey[] {
  const features: FeatureKey[] = [];
  
  if (plan === 'pro' || plan === 'business') {
    Object.entries(FEATURE_DEFINITIONS).forEach(([key, def]) => {
      if ('proOnly' in def && def.proOnly && !('businessOnly' in def && def.businessOnly)) {
        features.push(key as FeatureKey);
      }
    });
  }
  
  if (plan === 'business') {
    Object.entries(FEATURE_DEFINITIONS).forEach(([key, def]) => {
      if ('businessOnly' in def && def.businessOnly) {
        features.push(key as FeatureKey);
      }
    });
  }
  
  return features;
}

/**
 * Format feature list for UI display
 */
export function getFormattedFeatureList(plan: PlanKey): Array<{
  name: string;
  description: string;
  enabled: boolean;
  category: FeatureCategory;
  comingSoon?: boolean;
}> {
  return Object.entries(FEATURE_DEFINITIONS).map(([key, def]) => {
    const base = {
      name: def.name,
      description: def.description,
      enabled: isPlanFeatureEnabled(plan, key as FeatureKey),
      category: def.category,
    };
    return 'comingSoon' in def && def.comingSoon !== undefined
      ? { ...base, comingSoon: def.comingSoon }
      : base;
  });
}