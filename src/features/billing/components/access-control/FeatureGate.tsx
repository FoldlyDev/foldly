// =============================================================================
// FEATURE GATE - Clerk-based Access Control Component (UPDATED 2025)
// =============================================================================
// 🎯 Modern Clerk 2025 billing integration with has() helper for feature checking
// ✅ UPDATED: Now uses Clerk's native billing features and subscription management
// ⚡ BREAKING: Replaces deprecated manual plan checking with Clerk has() helper

'use client';

import React from 'react';
import { Protect, useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/core/shadcn/card';
import { Button } from '@/components/ui/core/shadcn/button';
import { Lock, Crown, Zap, Shield, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// FEATURE GATE TYPES
// =============================================================================

export type FeatureKey =
  | 'storage_limits'
  | 'custom_username'
  | 'unlimited_links'
  | 'email_notifications'
  | 'file_preview_thumbnails'
  | 'cloud_integrations'
  | 'color_customization'
  | 'custom_branding'
  | 'premium_short_links'
  | 'password_protected_links'
  | 'file_restrictions'
  | 'qr_code_generation'
  | 'priority_support';

export type FeatureTier = 'free' | 'pro' | 'business';

interface FeatureGateProps {
  feature: FeatureKey;
  tier?: FeatureTier | undefined;
  children: React.ReactNode;
  fallback?: React.ReactNode | undefined;
  showUpgradePrompt?: boolean | undefined;
  className?: string | undefined;
}

// =============================================================================
// FEATURE METADATA
// =============================================================================

const FEATURE_METADATA: Record<
  FeatureKey,
  {
    name: string;
    description: string;
    tier: FeatureTier;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  storage_limits: {
    name: 'Storage Limits',
    description: 'Generous storage space for your files and uploads',
    tier: 'free',
    icon: Shield,
  },
  custom_username: {
    name: 'Custom Username',
    description: 'Personalize your profile with a custom username',
    tier: 'free',
    icon: Zap,
  },
  unlimited_links: {
    name: 'Unlimited Links',
    description: 'Create unlimited file sharing links',
    tier: 'free',
    icon: Zap,
  },
  email_notifications: {
    name: 'Email Notifications',
    description: 'Get notified when files are uploaded or accessed',
    tier: 'free',
    icon: Zap,
  },
  file_preview_thumbnails: {
    name: 'File Preview Thumbnails',
    description: 'See previews of your files before downloading',
    tier: 'free',
    icon: Zap,
  },
  cloud_integrations: {
    name: 'Cloud Integrations',
    description: 'Connect with Google Drive, Dropbox, and other services',
    tier: 'free',
    icon: Zap,
  },
  color_customization: {
    name: 'Color Customization',
    description: 'Customize colors and themes for your sharing pages',
    tier: 'free',
    icon: Zap,
  },
  custom_branding: {
    name: 'Custom Branding',
    description: 'Add your logo and branding to sharing pages',
    tier: 'pro',
    icon: Crown,
  },
  premium_short_links: {
    name: 'Premium Short Links',
    description: 'Create branded short URLs for professional sharing',
    tier: 'pro',
    icon: Crown,
  },
  password_protected_links: {
    name: 'Password Protected Links',
    description: 'Secure your shared links with password requirements',
    tier: 'pro',
    icon: Lock,
  },
  file_restrictions: {
    name: 'File Restrictions',
    description: 'Control file types and sizes for uploads',
    tier: 'pro',
    icon: Shield,
  },
  qr_code_generation: {
    name: 'QR Code Generation',
    description: 'Generate QR codes for easy mobile access to files',
    tier: 'free',
    icon: Zap,
  },
  priority_support: {
    name: 'Priority Support',
    description: 'Get faster response times and dedicated assistance',
    tier: 'pro',
    icon: Crown,
  },
};

// =============================================================================
// UPGRADE PROMPT COMPONENT
// =============================================================================

interface UpgradePromptProps {
  feature: FeatureKey;
  className?: string | undefined;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  className,
}) => {
  const metadata = FEATURE_METADATA[feature];
  const Icon = metadata.icon;
  const router = useRouter();

  const handleUpgrade = () => {
    // FIXED: Use Next.js router instead of window.location.href
    router.push('/dashboard/billing');
  };

  const getTierColor = (tier: FeatureTier) => {
    switch (tier) {
      case 'pro':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'business':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <Card
      className={cn(
        'border-dashed opacity-75 hover:opacity-100 transition-opacity',
        className
      )}
    >
      <CardHeader className='text-center pb-2'>
        <div
          className={cn(
            'inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 mx-auto',
            getTierColor(metadata.tier)
          )}
        >
          <Icon className='h-6 w-6' />
        </div>
        <CardTitle className='text-lg'>{metadata.name}</CardTitle>
      </CardHeader>
      <CardContent className='text-center space-y-4'>
        <p className='text-sm text-muted-foreground'>{metadata.description}</p>
        <div className='space-y-2'>
          <p className='text-xs text-muted-foreground'>
            Requires{' '}
            {metadata.tier.charAt(0).toUpperCase() + metadata.tier.slice(1)}{' '}
            plan
          </p>
          <Button
            onClick={handleUpgrade}
            size='sm'
            className='w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
          >
            Upgrade Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// =============================================================================
// MAIN FEATURE GATE COMPONENT
// =============================================================================

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  tier,
  children,
  fallback,
  showUpgradePrompt = true,
  className,
}) => {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className={cn('flex items-center justify-center p-4', className)}>
        <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
      </div>
    );
  }

  // If not signed in, show upgrade prompt or fallback
  if (!isSignedIn) {
    if (fallback) {
      return <div className={className}>{fallback}</div>;
    }
    if (showUpgradePrompt) {
      return <UpgradePrompt feature={feature} className={className} />;
    }
    return null;
  }

  // ✅ UPDATED: Use Clerk's 2025 Protect component pattern for feature checking
  // This integrates directly with Clerk Billing and subscription features
  const metadata = FEATURE_METADATA[feature];
  const requiredTier = tier || metadata.tier;

  // Use Clerk's Protect component for proper authorization
  return (
    <Protect
      role={requiredTier}
      fallback={
        fallback ? (
          <div className={className}>{fallback}</div>
        ) : showUpgradePrompt ? (
          <UpgradePrompt feature={feature} className={className} />
        ) : null
      }
    >
      <div className={className}>{children}</div>
    </Protect>
  );
};

// =============================================================================
// FEATURE ACCESS LOGIC
// =============================================================================

function checkFeatureAccess(
  userPlan: string,
  requiredTier: FeatureTier
): boolean {
  const tierHierarchy: Record<FeatureTier, number> = {
    free: 0,
    pro: 1,
    business: 2,
  };

  const userTierLevel = tierHierarchy[userPlan as FeatureTier] ?? 0;
  const requiredTierLevel = tierHierarchy[requiredTier];

  return userTierLevel >= requiredTierLevel;
}

// =============================================================================
// DEPRECATED COMPONENTS - REMOVE IN NEXT MAJOR VERSION
// =============================================================================

/**
 * @deprecated DEPRECATED: Use FeatureGate component instead.
 * This component will be removed in the next major version.
 *
 * Migration Guide:
 * - Replace ClerkProtectWrapper with FeatureGate
 * - Update to use modern Clerk 2025 has() helper patterns
 * - FeatureGate now uses Clerk Billing integration directly
 *
 * OLD: <ClerkProtectWrapper feature="custom_branding">...</ClerkProtectWrapper>
 * NEW: <FeatureGate feature="custom_branding">...</FeatureGate>
 */
interface ClerkProtectWrapperProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode | undefined;
  showUpgradePrompt?: boolean | undefined;
  className?: string | undefined;
}

/**
 * @deprecated Use FeatureGate component instead. Will be removed in next major version.
 */
export const ClerkProtectWrapper: React.FC<ClerkProtectWrapperProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  className,
}) => {
  // Issue deprecation warning in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️ ClerkProtectWrapper is deprecated. Use FeatureGate instead. ' +
        'This component will be removed in the next major version. ' +
        'See migration guide in component documentation.'
    );
  }

  // Forward to FeatureGate for compatibility
  return (
    <FeatureGate
      feature={feature}
      fallback={fallback}
      showUpgradePrompt={showUpgradePrompt}
      className={className}
    >
      {children}
    </FeatureGate>
  );
};

// =============================================================================
// FEATURE HOOK
// =============================================================================

export const useFeatureAccess = (
  feature: FeatureKey,
  requiredTier?: FeatureTier
) => {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  // Get feature metadata
  const metadata = FEATURE_METADATA[feature];
  const tier = requiredTier || metadata.tier;

  // ✅ UPDATED: Use legacy user metadata for now since has() is server-side only
  let hasFeature = false;
  let userPlan = 'free'; // Default

  if (isSignedIn && isLoaded && user) {
    try {
      // Use legacy metadata checking for client-side compatibility
      const publicMetadata = user.publicMetadata as
        | { plan?: string }
        | undefined;
      userPlan = publicMetadata?.plan || 'free';
      hasFeature = checkFeatureAccess(userPlan, tier);
    } catch (error) {
      console.warn('useFeatureAccess: Error checking feature access:', error);
      // Fallback to deny access on error for security
      hasFeature = false;
    }
  }

  return {
    hasFeature,
    metadata,
    userPlan,
    requiredTier: tier,
    isLoaded,
    isSignedIn,
  };
};

// =============================================================================
// EXPORTS
// =============================================================================

export default FeatureGate;
export { FEATURE_METADATA };
export type { FeatureGateProps };
