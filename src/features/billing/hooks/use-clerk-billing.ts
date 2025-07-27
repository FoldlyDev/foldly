// =============================================================================
// CLERK BILLING HOOKS - Modern 2025 Subscription Management with Clerk Billing
// =============================================================================
// 🎯 Updated hooks leveraging Clerk's 2025 billing capabilities with has() method

import { useAuth, useUser } from '@clerk/nextjs';
import { useMemo } from 'react';
import type { FeatureKey } from '../components/access-control/FeatureGate';

// =============================================================================
// TYPES FOR 2025 CLERK BILLING
// =============================================================================

export interface ClerkBillingFeatures {
  // 12 Features matching subscription_plans schema exactly
  storage_limits: boolean;
  custom_username: boolean;
  unlimited_links: boolean;
  email_notifications: boolean;
  file_preview_thumbnails: boolean;
  cloud_integrations: boolean;
  color_customization: boolean;
  custom_branding: boolean;
  premium_short_links: boolean;
  password_protected_links: boolean;
  file_restrictions: boolean;
  qr_code_generation: boolean;
  priority_support: boolean;
}

export interface ClerkSubscriptionStatus {
  // Tier identification
  isFreeTier: boolean;
  isProTier: boolean;
  isBusinessTier: boolean;
  
  // Feature access using Clerk's has() method
  hasFeature: (feature: keyof ClerkBillingFeatures) => boolean;
  checkMultipleFeatures: (features: (keyof ClerkBillingFeatures)[]) => Record<string, boolean>;
  
  // Quick feature checks (using actual 12 features)
  hasStorageLimits: boolean;
  hasCustomUsername: boolean;
  hasUnlimitedLinks: boolean;
  hasEmailNotifications: boolean;
  hasFilePreviewThumbnails: boolean;
  hasCloudIntegrations: boolean;
  hasColorCustomization: boolean;
  hasCustomBranding: boolean;
  hasPremiumShortLinks: boolean;
  hasPasswordProtectedLinks: boolean;
  hasFileRestrictions: boolean;
  hasQrCodeGeneration: boolean;
  hasPrioritySupport: boolean;
  
  // Upgrade capabilities
  canUpgrade: boolean;
  canUpgradeToPro: boolean;
  canUpgradeToBusiness: boolean;
  upgradeOptions: string[];
  
  // Billing information
  currentPlan: 'free' | 'pro' | 'business';
  planDisplayName: string;
  billingCycle: 'monthly' | 'yearly' | null;
  
  // User info
  isLoaded: boolean;
  user: any;
}

/**
 * Hook to get comprehensive subscription status using Clerk's 2025 billing with has() method
 * Updated to use latest Clerk Billing APIs for feature checking
 */
export const useClerkSubscription = (): ClerkSubscriptionStatus => {
  const { has } = useAuth();
  const { isLoaded, user } = useUser();
  
  return useMemo(() => {
    if (!isLoaded) {
      return {
        isFreeTier: true,
        isProTier: false,
        isBusinessTier: false,
        hasFeature: () => false,
        checkMultipleFeatures: () => ({}),
        hasStorageLimits: false,
        hasCustomUsername: false,
        hasUnlimitedLinks: false,
        hasEmailNotifications: false,
        hasFilePreviewThumbnails: false,
        hasCloudIntegrations: false,
        hasColorCustomization: false,
        hasCustomBranding: false,
        hasPremiumShortLinks: false,
        hasPasswordProtectedLinks: false,
        hasFileRestrictions: false,
        hasQrCodeGeneration: false,
        hasPrioritySupport: false,
        canUpgrade: false,
        canUpgradeToPro: false,
        canUpgradeToBusiness: false,
        upgradeOptions: [],
        currentPlan: 'free' as const,
        planDisplayName: 'Free',
        billingCycle: null,
        isLoaded: false,
        user: null,
      };
    }

    // Determine current plan using direct plan checking (FIXED)
    const getCurrentPlan = (): 'free' | 'pro' | 'business' => {
      try {
        if (!has) return 'free';
        
        // Direct plan detection using Clerk's billing subscription state
        if (has({ plan: 'business' }) || has({ plan: 'Business' })) return 'business';
        if (has({ plan: 'pro' }) || has({ plan: 'Pro' })) return 'pro';
        if (has({ plan: 'free' }) || has({ plan: 'Free' })) return 'free';
        
        return 'free'; // Default fallback
      } catch (error) {
        console.warn('Error determining current plan:', error);
        return 'free';
      }
    };

    const currentPlan = getCurrentPlan();
    
    // Helper function to check features using Clerk's 2025 has() method FIRST
    const hasFeature = (feature: keyof ClerkBillingFeatures): boolean => {
      try {
        // PRIMARY: Use Clerk's 2025 has() method for direct feature checking
        if (has) {
          const clerkFeatureCheck = has({ feature });
          if (clerkFeatureCheck !== undefined) {
            return clerkFeatureCheck;
          }
        }
        
        // FALLBACK: Plan-based feature checking if Clerk billing isn't configured
        const freeFeatures: (keyof ClerkBillingFeatures)[] = [
          'storage_limits', 'custom_username', 'unlimited_links', 
          'email_notifications', 'file_preview_thumbnails', 
          'cloud_integrations', 'color_customization', 'qr_code_generation'
        ];
        
        const proFeatures: (keyof ClerkBillingFeatures)[] = [
          'custom_branding', 'premium_short_links', 'password_protected_links', 
          'file_restrictions', 'priority_support'
        ];
        
        // Check based on current plan (fallback only)
        if (currentPlan === 'free') {
          return freeFeatures.includes(feature);
        }
        
        if (currentPlan === 'pro') {
          return freeFeatures.includes(feature) || proFeatures.includes(feature);
        }
        
        if (currentPlan === 'business') {
          return true; // Business plan has all features
        }
        
        return false;
      } catch (error) {
        console.warn(`Error checking feature ${feature}:`, error);
        return false;
      }
    };

    // Helper to check multiple features at once
    const checkMultipleFeatures = (features: (keyof ClerkBillingFeatures)[]): Record<string, boolean> => {
      const result: Record<string, boolean> = {};
      features.forEach(feature => {
        result[feature] = hasFeature(feature);
      });
      return result;
    };
    
    // Quick feature access checks (using actual 12 features)
    const hasStorageLimits = hasFeature('storage_limits');
    const hasCustomUsername = hasFeature('custom_username');
    const hasUnlimitedLinks = hasFeature('unlimited_links');
    const hasEmailNotifications = hasFeature('email_notifications');
    const hasFilePreviewThumbnails = hasFeature('file_preview_thumbnails');
    const hasCloudIntegrations = hasFeature('cloud_integrations');
    const hasColorCustomization = hasFeature('color_customization');
    const hasCustomBranding = hasFeature('custom_branding');
    const hasPremiumShortLinks = hasFeature('premium_short_links');
    const hasPasswordProtectedLinks = hasFeature('password_protected_links');
    const hasFileRestrictions = hasFeature('file_restrictions');
    const hasQrCodeGeneration = hasFeature('qr_code_generation');
    const hasPrioritySupport = hasFeature('priority_support');
    
    // Tier identification based on current plan (FIXED)
    const isBusinessTier = currentPlan === 'business';
    const isProTier = currentPlan === 'pro';
    const isFreeTier = currentPlan === 'free';
    
    // Plan display name
    const planDisplayName = currentPlan === 'business' ? 'Business' : 
                           currentPlan === 'pro' ? 'Pro' : 'Free';
    
    // Upgrade capabilities
    const canUpgradeToPro = isFreeTier;
    const canUpgradeToBusiness = isFreeTier || isProTier;
    const canUpgrade = canUpgradeToPro || canUpgradeToBusiness;
    
    const upgradeOptions: string[] = [];
    if (canUpgradeToPro) upgradeOptions.push('pro');
    if (canUpgradeToBusiness) upgradeOptions.push('business');
    
    // Try to determine billing cycle (this would require additional Clerk billing data)
    const billingCycle: 'monthly' | 'yearly' | null = null; // Would be set from Clerk subscription data
    
    return {
      // Tier identification
      isFreeTier,
      isProTier,
      isBusinessTier,
      
      // Feature access
      hasFeature,
      checkMultipleFeatures,
      
      // Quick feature checks (actual 12 features)
      hasStorageLimits,
      hasCustomUsername,
      hasUnlimitedLinks,
      hasEmailNotifications,
      hasFilePreviewThumbnails,
      hasCloudIntegrations,
      hasColorCustomization,
      hasCustomBranding,
      hasPremiumShortLinks,
      hasPasswordProtectedLinks,
      hasFileRestrictions,
      hasQrCodeGeneration,
      hasPrioritySupport,
      
      // Upgrade capabilities
      canUpgrade,
      canUpgradeToPro,
      canUpgradeToBusiness,
      upgradeOptions,
      
      // Billing information (FIXED - now using direct plan detection)
      currentPlan,
      planDisplayName,
      billingCycle,
      
      // User info
      isLoaded,
      user,
    };
  }, [has, isLoaded, user]);
};

// =============================================================================
// FEATURE ACCESS HOOKS
// =============================================================================

/**
 * Hook to check if user has access to a specific feature
 * FIXED: Now uses plan-based logic instead of just feature gates
 */
export const useFeatureCheck = (feature: FeatureKey): boolean => {
  const { hasFeature } = useClerkSubscription();
  return hasFeature(feature as keyof ClerkBillingFeatures);
};

/**
 * Hook to get multiple feature access states at once
 * FIXED: Now uses plan-based logic for consistency
 */
export const useMultipleFeatures = (features: FeatureKey[]): Record<FeatureKey, boolean> => {
  const { hasFeature } = useClerkSubscription();
  
  return useMemo(() => {
    const result: Record<string, boolean> = {};
    features.forEach(feature => {
      result[feature] = hasFeature(feature as keyof ClerkBillingFeatures);
    });
    return result as Record<FeatureKey, boolean>;
  }, [hasFeature, features]);
};

// =============================================================================
// BILLING NAVIGATION HOOKS
// =============================================================================

/**
 * Hook to get billing-related navigation utilities
 */
export const useBillingNavigation = () => {
  return useMemo(() => ({
    // Navigate to billing page
    goToBilling: () => {
      window.location.href = '/dashboard/billing';
    },
    
    // Navigate to pricing page
    goToPricing: () => {
      window.location.href = '/pricing';
    },
    
    // Open Clerk's user profile with billing tab
    openUserProfile: () => {
      // This would open the UserProfile modal if implemented
      window.location.href = '/dashboard/billing?tab=profile';
    },
    
    // Direct links
    billingUrl: '/dashboard/billing',
    pricingUrl: '/pricing',
    profileUrl: '/dashboard/billing?tab=profile',
  }), []);
};

// =============================================================================
// STORAGE & USAGE HOOKS (SIMPLIFIED)
// =============================================================================

/**
 * Hook to get storage tier information based on subscription
 * Note: This hook provides basic tier info. For real storage data, use useUserStorageStatusQuery
 */
export const useStorageTier = () => {
  const { isBusinessTier, isProTier, hasStorageLimits } = useClerkSubscription();
  
  return useMemo(() => ({
    // Tier information (use subscription_plans table for actual limits)
    tierName: isBusinessTier ? 'Business' : isProTier ? 'Pro' : 'Free',
    tierColor: isBusinessTier ? 'orange' : isProTier ? 'purple' : 'blue',
    
    // Capabilities
    hasStorageLimits,
    isBusinessTier,
    isProTier,
    
    // Deprecated fields - use React Query hooks for real data
    storageLimit: 'Use useUserStorageStatusQuery for real storage limits',
    storageDescription: 'Use useUserStorageStatusQuery for real storage info',
  }), [isBusinessTier, isProTier, hasStorageLimits]);
};

// =============================================================================
// LEGACY COMPATIBILITY HOOKS
// =============================================================================

/**
 * Legacy compatibility hook for existing code that expects the old structure
 * @deprecated Use useClerkSubscription instead
 */
export const useSubscriptionStatus = () => {
  const clerkSubscription = useClerkSubscription();
  
  return {
    subscription: null, // No longer needed with Clerk
    isLoading: !clerkSubscription.isLoaded,
    error: null, // Clerk handles errors internally
    ...clerkSubscription,
  };
};

/**
 * Legacy compatibility hook for subscription features
 * @deprecated Use useClerkSubscription instead
 */
export const useSubscriptionFeatures = () => {
  const { hasFeature } = useClerkSubscription();
  
  return {
    features: {}, // Features are now checked individually
    hasFeature,
    getFeatureValue: hasFeature, // Simplified to boolean check
  };
};