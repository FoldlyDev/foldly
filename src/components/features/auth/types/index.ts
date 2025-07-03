// Authentication Types for Foldly - Clerk Integration and User Management
// User sessions, permissions, and authentication state management
// Following 2025 TypeScript best practices with strict type safety

import type {
  Timestamps,
  WithId,
} from '../../../../types/database-infrastructure';

// =============================================================================
// BRANDED TYPES FOR ENHANCED TYPE SAFETY (2025 BEST PRACTICE)
// =============================================================================

export type UserId = string & { readonly __brand: 'UserId' };
export type SessionId = string & { readonly __brand: 'SessionId' };
export type OrganizationId = string & { readonly __brand: 'OrganizationId' };

// =============================================================================
// USER ROLE SYSTEM (MOVED FROM GLOBAL)
// =============================================================================

/**
 * User roles with hierarchical permissions
 */
export const USER_ROLE = {
  USER: 'user',
  PREMIUM: 'premium',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const satisfies Record<string, string>;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

/**
 * Subscription tiers for platform access
 */
export const SUBSCRIPTION_TIER = {
  FREE: 'free',
  PRO: 'pro',
  TEAM: 'team',
  ENTERPRISE: 'enterprise',
} as const satisfies Record<string, string>;

export type SubscriptionTier =
  (typeof SUBSCRIPTION_TIER)[keyof typeof SUBSCRIPTION_TIER];

// =============================================================================
// PLATFORM-SPECIFIC ROLE SYSTEM (LEGACY COMPATIBILITY)
// =============================================================================

export const PLATFORM_ROLES = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
  ADMIN: 'admin',
} as const satisfies Record<string, string>;

export type PlatformRole = (typeof PLATFORM_ROLES)[keyof typeof PLATFORM_ROLES];

// =============================================================================
// CLERK AUTH INTEGRATION (NEXT.JS 15+ COMPATIBLE)
// =============================================================================

export interface AuthContext {
  readonly userId: UserId | null;
  readonly sessionId: SessionId | null;
  readonly orgId: OrganizationId | null;
  readonly orgRole: string | null;
  readonly orgSlug: string | null;
  readonly sessionClaims: Record<string, unknown> | null;
}

// =============================================================================
// ENHANCED USER WITH PLATFORM EXTENSIONS
// =============================================================================

export interface FoldlyUser extends WithId, Timestamps {
  readonly id: UserId;
  readonly emailAddresses: readonly EmailAddressResource[];
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly imageUrl: string;
  readonly platformRole: PlatformRole;
  readonly preferences: UserPreferences;
  readonly subscription: UserSubscription;
  readonly onboardingCompleted: boolean;
  readonly lastActiveAt: Date;
}

export interface EmailAddressResource {
  readonly id: string;
  readonly emailAddress: string;
  readonly verification: VerificationResource | null;
  readonly linkedTo: readonly LinkedToResource[];
}

export interface VerificationResource {
  readonly status: 'verified' | 'unverified' | 'expired' | 'failed';
  readonly strategy: string;
  readonly attempts: number;
  readonly expireAt: Date | null;
}

export interface LinkedToResource {
  readonly type: 'oauth_google' | 'oauth_github' | 'oauth_microsoft' | string;
  readonly id: string;
}

// =============================================================================
// USER PREFERENCES WITH STRICT TYPING
// =============================================================================

export interface UserPreferences {
  readonly theme: ThemePreference;
  readonly emailNotifications: EmailNotificationSettings;
  readonly privacySettings: PrivacySettings;
  readonly dashboardLayout: DashboardLayoutPreference;
}

export type ThemePreference = 'light' | 'dark' | 'system';
export type DashboardLayoutPreference = 'grid' | 'list' | 'compact';

export interface EmailNotificationSettings {
  readonly linkShared: boolean;
  readonly folderActivity: boolean;
  readonly securityAlerts: boolean;
  readonly productUpdates: boolean;
  readonly weeklyDigest: boolean;
}

export interface PrivacySettings {
  readonly profileVisibility: ProfileVisibility;
  readonly linkSharingDefault: LinkSharingDefault;
  readonly analyticsOptOut: boolean;
}

export type ProfileVisibility = 'public' | 'private' | 'organization';
export type LinkSharingDefault = 'public' | 'unlisted' | 'private';

// =============================================================================
// SUBSCRIPTION MANAGEMENT
// =============================================================================

export interface UserSubscription extends Timestamps {
  readonly plan: PlatformRole;
  readonly status: SubscriptionStatus;
  readonly currentPeriodEnd: Date | null;
  readonly cancelAtPeriodEnd: boolean;
  readonly stripeCustomerId: string | null;
  readonly stripeSubscriptionId: string | null;
}

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  INCOMPLETE: 'incomplete',
  INCOMPLETE_EXPIRED: 'incomplete_expired',
  PAST_DUE: 'past_due',
  TRIALING: 'trialing',
  UNPAID: 'unpaid',
} as const satisfies Record<string, string>;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

// =============================================================================
// AUTHENTICATION STATE MANAGEMENT
// =============================================================================

export interface AuthState {
  readonly isLoaded: boolean;
  readonly isSignedIn: boolean;
  readonly user: FoldlyUser | null;
  readonly session: SessionData | null;
  readonly organization: OrganizationData | null;
}

export interface SessionData {
  readonly id: SessionId;
  readonly userId: UserId;
  readonly status: 'active' | 'expired' | 'removed';
  readonly lastActiveAt: Date;
  readonly expireAt: Date;
}

export interface OrganizationData {
  readonly id: OrganizationId;
  readonly name: string;
  readonly slug: string;
  readonly imageUrl: string;
  readonly membersCount: number;
}

// =============================================================================
// SERVER-SIDE AUTH CONTEXT
// =============================================================================

export interface ServerAuthContext extends AuthContext {
  readonly foldlyUser: FoldlyUser | null;
  readonly userPreferences: UserPreferences | null;
  readonly subscription: UserSubscription | null;
}

// =============================================================================
// WEBHOOK TYPES (CLERK -> YOUR PLATFORM)
// =============================================================================

export interface ClerkWebhookEvent<T = unknown> {
  readonly data: T;
  readonly object: 'event';
  readonly type: ClerkWebhookEventType;
}

export const CLERK_WEBHOOK_EVENTS = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  SESSION_CREATED: 'session.created',
  SESSION_ENDED: 'session.ended',
  ORGANIZATION_CREATED: 'organization.created',
  ORGANIZATION_UPDATED: 'organization.updated',
  ORGANIZATION_DELETED: 'organization.deleted',
  ORGANIZATION_MEMBERSHIP_CREATED: 'organizationMembership.created',
  ORGANIZATION_MEMBERSHIP_UPDATED: 'organizationMembership.updated',
  ORGANIZATION_MEMBERSHIP_DELETED: 'organizationMembership.deleted',
} as const satisfies Record<string, string>;

export type ClerkWebhookEventType =
  (typeof CLERK_WEBHOOK_EVENTS)[keyof typeof CLERK_WEBHOOK_EVENTS];

// =============================================================================
// TYPE GUARDS FOR RUNTIME SAFETY (2025 BEST PRACTICE)
// =============================================================================

export const isValidUserRole = (role: unknown): role is UserRole => {
  return (
    typeof role === 'string' &&
    Object.values(USER_ROLE).includes(role as UserRole)
  );
};

export const isValidSubscriptionTier = (
  tier: unknown
): tier is SubscriptionTier => {
  return (
    typeof tier === 'string' &&
    Object.values(SUBSCRIPTION_TIER).includes(tier as SubscriptionTier)
  );
};

export const isValidPlatformRole = (role: unknown): role is PlatformRole => {
  return (
    typeof role === 'string' &&
    Object.values(PLATFORM_ROLES).includes(role as PlatformRole)
  );
};

export const isValidSubscriptionStatus = (
  status: unknown
): status is SubscriptionStatus => {
  return (
    typeof status === 'string' &&
    Object.values(SUBSCRIPTION_STATUS).includes(status as SubscriptionStatus)
  );
};

export const isValidThemePreference = (
  theme: unknown
): theme is ThemePreference => {
  return (
    typeof theme === 'string' && ['light', 'dark', 'system'].includes(theme)
  );
};

// =============================================================================
// AUTHENTICATION UTILITIES
// =============================================================================

export interface AuthRedirect {
  readonly signInUrl: string;
  readonly signUpUrl: string;
  readonly afterSignInUrl: string;
  readonly afterSignUpUrl: string;
}

export interface AuthError {
  readonly code: string;
  readonly message: string;
  readonly longMessage?: string;
  readonly meta?: Record<string, unknown>;
}

// =============================================================================
// LEGACY TYPES FOR BACKWARD COMPATIBILITY
// =============================================================================

/**
 * @deprecated Use FoldlyUser instead. This will be removed in next major version.
 */
export interface ClerkUser {
  readonly id: string;
  readonly emailAddresses: readonly { emailAddress: string; id: string }[];
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly imageUrl: string;
  /** @deprecated Use FoldlyUser.platformRole */
  role?: string;
}

/**
 * @deprecated Use SessionData instead.
 */
export interface LegacySessionData {
  readonly id: string;
  readonly status: string;
  readonly lastActiveAt: Date;
  readonly expireAt: Date;
}

/**
 * @deprecated Use FoldlyUser instead.
 */
export interface UserProfile {
  readonly id: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly emailAddress?: string;
  readonly imageUrl?: string;
}
