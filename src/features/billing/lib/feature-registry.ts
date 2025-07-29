// =============================================================================
// FEATURE REGISTRY - Centralized Feature Configuration
// =============================================================================
// 🎯 Single source of truth for all feature definitions and plan assignments
// ✅ Based on actual database subscription_plans table feature_descriptions

// =============================================================================
// TYPES
// =============================================================================

export type PlanType = 'free' | 'pro' | 'business';

export interface FeatureDefinition {
  key: string;
  displayName: string;
  description: string;
  availableInPlans: PlanType[];
  category: 'storage' | 'sharing' | 'branding' | 'security' | 'support' | 'integration';
}

export interface StorageLimit {
  plan: PlanType;
  limitGB: number;
  limitBytes: number;
}

// =============================================================================
// FEATURE REGISTRY
// =============================================================================

/**
 * Centralized feature registry based on database subscription_plans table
 * Only includes features that have descriptions in the database
 */
export const FEATURES = {
  // Storage Features
  STORAGE_LIMITS: {
    key: 'storage_limits',
    displayName: 'Storage Space',
    description: 'Cloud storage capacity for your files',
    availableInPlans: ['free', 'pro', 'business'],
    category: 'storage',
  },

  // User Features
  CUSTOM_USERNAME: {
    key: 'custom_username',
    displayName: 'Custom Username',
    description: 'Create your unique username for personalized profile links and professional branding',
    availableInPlans: ['free', 'pro', 'business'],
    category: 'sharing',
  },

  // Sharing Features
  UNLIMITED_LINKS: {
    key: 'unlimited_links',
    displayName: 'Unlimited File Sharing Links',
    description: 'Share files freely with unlimited link creation - no restrictions on how many you can make',
    availableInPlans: ['free', 'pro', 'business'],
    category: 'sharing',
  },

  PREMIUM_SHORT_LINKS: {
    key: 'premium_short_links',
    displayName: 'Premium Short Links',
    description: 'Get memorable premium short links with 5 characters or less for easy sharing and marketing',
    availableInPlans: ['pro', 'business'],
    category: 'sharing',
  },

  QR_CODE_GENERATION: {
    key: 'qr_code_generation',
    displayName: 'QR Code Generation',
    description: 'Generate QR codes instantly for your links, making mobile sharing quick and effortless',
    availableInPlans: ['pro', 'business'],
    category: 'sharing',
  },

  // Notification Features
  EMAIL_NOTIFICATIONS: {
    key: 'email_notifications',
    displayName: 'Email Notifications',
    description: 'Stay informed with instant email alerts whenever files are uploaded or shared through your links',
    availableInPlans: ['free', 'pro', 'business'],
    category: 'sharing',
  },

  // File Features
  FILE_PREVIEW_THUMBNAILS: {
    key: 'file_preview_thumbnails',
    displayName: 'File Preview Thumbnails',
    description: 'See beautiful thumbnail previews of your images, documents, and files at a glance',
    availableInPlans: ['free', 'pro', 'business'],
    category: 'sharing',
  },

  FILE_RESTRICTIONS: {
    key: 'file_restrictions',
    displayName: 'File Restrictions',
    description: 'Take control with custom file size limits and type restrictions for each sharing link',
    availableInPlans: ['pro', 'business'],
    category: 'security',
  },

  // Integration Features
  CLOUD_INTEGRATIONS: {
    key: 'cloud_integrations',
    displayName: 'Cloud Integrations',
    description: 'Seamlessly connect with OneDrive and Google Drive for effortless file sharing across platforms',
    availableInPlans: ['free', 'pro', 'business'],
    category: 'integration',
  },

  // Branding Features
  CUSTOM_BRANDING: {
    key: 'custom_branding',
    displayName: 'Custom Branding',
    description: 'Make it yours with custom banners, colors, and remove Foldly branding for a professional look',
    availableInPlans: ['pro', 'business'],
    category: 'branding',
  },

  // Security Features
  PASSWORD_PROTECTED_LINKS: {
    key: 'password_protected_links',
    displayName: 'Password Protected Links',
    description: 'Secure your sensitive files with password protection - only authorized users can access',
    availableInPlans: ['pro', 'business'],
    category: 'security',
  },

  // Support Features - Business only
  PRIORITY_SUPPORT: {
    key: 'priority_support',
    displayName: 'Priority Support',
    description: 'Get fast-track customer support with dedicated assistance and guaranteed faster response times',
    availableInPlans: ['business'],
    category: 'support',
  },
} as const satisfies Record<string, FeatureDefinition>;

// =============================================================================
// STORAGE LIMITS
// =============================================================================

/**
 * Storage limits per plan based on database values
 */
export const STORAGE_LIMITS: StorageLimit[] = [
  {
    plan: 'free',
    limitGB: 50,
    limitBytes: 50 * 1024 * 1024 * 1024, // 50 GB
  },
  {
    plan: 'pro',
    limitGB: 500,
    limitBytes: 500 * 1024 * 1024 * 1024, // 500 GB
  },
  {
    plan: 'business',
    limitGB: 2048,
    limitBytes: 2048 * 1024 * 1024 * 1024, // 2 TB
  },
];

// =============================================================================
// HELPER TYPES & UTILITIES
// =============================================================================

// Type-safe feature keys
export type FeatureKey = keyof typeof FEATURES;

// Get all feature keys as an array
export const FEATURE_KEYS = Object.keys(FEATURES) as FeatureKey[];

// Helper to get features by plan
export function getFeaturesByPlan(plan: PlanType): FeatureDefinition[] {
  return Object.values(FEATURES).filter(feature => 
    feature.availableInPlans.includes(plan)
  );
}

// Helper to check if a feature is available in a plan
export function isFeatureInPlan(featureKey: FeatureKey, plan: PlanType): boolean {
  const feature = FEATURES[featureKey];
  return feature ? feature.availableInPlans.includes(plan) : false;
}

// Helper to get storage limit for a plan
export function getStorageLimit(plan: PlanType): StorageLimit {
  const limit = STORAGE_LIMITS.find(l => l.plan === plan);
  if (!limit) {
    // Default to free plan if not found
    return STORAGE_LIMITS[0];
  }
  return limit;
}

// Helper to get all features by category
export function getFeaturesByCategory(category: FeatureDefinition['category']): FeatureDefinition[] {
  return Object.values(FEATURES).filter(feature => feature.category === category);
}

// Helper to get plan upgrade path
export function getUpgradePath(currentPlan: PlanType): PlanType[] {
  const planHierarchy: PlanType[] = ['free', 'pro', 'business'];
  const currentIndex = planHierarchy.indexOf(currentPlan);
  return planHierarchy.slice(currentIndex + 1);
}

// =============================================================================
// FEATURE DESCRIPTIONS NOT IN DATABASE
// =============================================================================

/**
 * Note: The following features appear in highlight_features but have no descriptions:
 * - Business plan: "Advanced team collaboration tools"
 * - Business plan: "Enterprise security & compliance" 
 * - Business plan: "Custom API integrations"
 * - Business plan: "Advanced analytics dashboard"
 * 
 * These are NOT included in the FEATURES registry above since they lack descriptions
 * in the database. To add them, update the database first.
 */