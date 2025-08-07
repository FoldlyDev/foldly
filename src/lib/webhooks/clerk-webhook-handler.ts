import { Webhook } from 'svix';
import type { DatabaseResult, UserInsert } from '@/lib/database/types';

// Clerk webhook event structure
interface ClerkWebhookEvent {
  type: string;
  data: any;
}

// Subscription event data interfaces
interface ClerkSubscriptionEvent {
  id: string;
  object: 'subscription' | 'commerce_subscription';
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  created_at: number;
  updated_at: number;
  plan?: {
    id: string;
    name: string;
    nickname?: string;
  };
  user_id?: string;
  organization_id?: string;
  payer?: {
    user_id?: string;
    organization_id?: string;
  };
}

interface ClerkSubscriptionItemEvent {
  id: string;
  object: 'subscription_item' | 'commerce_subscription_item';
  subscription_id: string;
  plan: {
    id: string;
    name: string;
    nickname?: string;
    slug?: string;
  };
  status: 'active' | 'canceled' | 'incomplete' | 'ended' | 'upcoming' | 'abandoned' | 'past_due';
  created_at: number;
  updated_at: number;
  user_id?: string;
  organization_id?: string;
  payer?: {
    user_id?: string;
    organization_id?: string;
  };
}

// Clerk email address structure
interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

// Clerk user data structure from webhooks
interface ClerkUserData {
  id: string;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
  created_at: number;
  updated_at: number;
}

// Webhook user data includes the ID from Clerk
export interface WebhookUserData extends UserInsert {
  id: string;
}

export async function validateClerkWebhook(
  request: Request
): Promise<DatabaseResult<ClerkWebhookEvent>> {
  const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  try {
    const body = await request.text();
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');

    // Validate required headers
    if (!svixId || !svixTimestamp || !svixSignature) {
      return { success: false, error: 'Missing required webhook headers' };
    }

    const headers = {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    };

    const payload = webhook.verify(body, headers) as ClerkWebhookEvent;
    return { success: true, data: payload };
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return { success: false, error: 'Invalid webhook signature' };
  }
}

export function transformClerkUserData(
  clerkUser: ClerkUserData
): WebhookUserData {
  // Find primary email
  let primaryEmail: string | undefined;

  if (clerkUser.primary_email_address_id && clerkUser.email_addresses) {
    const primaryEmailObj = clerkUser.email_addresses.find(
      (email: ClerkEmailAddress) =>
        email.id === clerkUser.primary_email_address_id
    );
    primaryEmail = primaryEmailObj?.email_address;
  }

  // Fallback to first available email if primary not found
  if (!primaryEmail && clerkUser.email_addresses?.length > 0) {
    primaryEmail = clerkUser.email_addresses[0]?.email_address;
  }

  if (!primaryEmail) {
    throw new Error('User must have a valid email address');
  }

  return {
    id: clerkUser.id,
    email: primaryEmail,
    username: clerkUser.username || generateUsername(clerkUser),
    firstName: clerkUser.first_name || null,
    lastName: clerkUser.last_name || null,
    avatarUrl: clerkUser.profile_image_url || null,
  };
}

function generateUsername(clerkUser: ClerkUserData): string {
  // Try to get primary email first
  let email: string | undefined;
  
  if (clerkUser.primary_email_address_id && clerkUser.email_addresses) {
    const primaryEmailObj = clerkUser.email_addresses.find(
      (emailObj: ClerkEmailAddress) => emailObj.id === clerkUser.primary_email_address_id
    );
    email = primaryEmailObj?.email_address;
  }

  // Fallback to first email
  if (!email && clerkUser.email_addresses?.length > 0) {
    email = clerkUser.email_addresses[0]?.email_address;
  }

  // Extract username from email or use ID as last resort
  const emailPrefix = email?.split('@')[0];
  return emailPrefix || `user_${clerkUser.id.slice(-8)}`;
}

/**
 * Convert Clerk timestamp to Date
 * Clerk timestamps can be either seconds (10 digits) or milliseconds (13 digits)
 */
function convertClerkTimestamp(timestamp: number): Date {
  // If timestamp has more than 10 digits, it's likely already in milliseconds
  if (timestamp > 9999999999) {
    return new Date(timestamp);
  }
  // Otherwise it's in seconds, convert to milliseconds
  return new Date(timestamp * 1000);
}

/**
 * Transform Clerk subscription data for analytics tracking
 */
export function transformSubscriptionEventData(
  event: ClerkSubscriptionEvent | ClerkSubscriptionItemEvent,
  eventType: string
): {
  userId: string | null;
  eventType: string;
  fromPlan: string | null;
  toPlan: string | null;
  source: string;
  metadata: Record<string, any>;
  occurredAt: Date;
} {
  const userId = event.user_id || event.organization_id || null;

  // Extract plan information
  let fromPlan: string | null = null;
  let toPlan: string | null = null;

  if ('plan' in event && event.plan) {
    const planIdentifier = ('slug' in event.plan && event.plan.slug) || event.plan.nickname || event.plan.name;
    toPlan = normalizePlanName(planIdentifier);
  } else if ('status' in event) {
    // Default to 'free' unless we have specific plan information
    toPlan = 'free';
  }

  // Determine event type for analytics
  let analyticsEventType = 'unknown';
  
  // For subscription events (not subscriptionItem)
  if (eventType.startsWith('subscription.')) {
    if (eventType === 'subscription.created') {
      // If fromPlan is null and toPlan is 'free', this is the initial free plan assignment
      analyticsEventType = (!fromPlan && toPlan === 'free') ? 'initial' : 
                          (toPlan === 'free' ? 'downgrade' : 'upgrade');
    } else if (eventType === 'subscription.updated') {
      analyticsEventType = 'change';
    } else if (eventType === 'subscription.canceled') {
      analyticsEventType = 'cancel';
      fromPlan = toPlan;
      toPlan = 'free';
    } else if (eventType === 'subscription.past_due') {
      analyticsEventType = 'past_due';
    } else if (eventType === 'subscription.active') {
      // Active status typically means reactivation after past_due or similar
      analyticsEventType = 'reactivate';
    }
  }
  // For subscriptionItem events
  else if (eventType.startsWith('subscriptionItem.')) {
    // Skip subscriptionItem events - we'll only track subscription events to avoid duplicates
    // Clerk sends both subscription and subscriptionItem events for the same action
    return {
      userId,
      eventType: 'skip', // Special marker to skip this event
      fromPlan,
      toPlan,
      source: 'clerk_webhook',
      metadata: {
        clerkEventId: event.id,
        clerkEventType: eventType,
        subscriptionId: 'subscription_id' in event ? event.subscription_id : event.id,
        reason: 'duplicate_subscriptionItem_event',
      },
      occurredAt: convertClerkTimestamp(event.updated_at),
    };
  }

  return {
    userId,
    eventType: analyticsEventType,
    fromPlan,
    toPlan,
    source: 'clerk_webhook',
    metadata: {
      clerkEventId: event.id,
      clerkEventType: eventType,
      subscriptionId: 'subscription_id' in event ? event.subscription_id : event.id,
      planId: 'plan' in event ? event.plan?.id : undefined,
      status: event.status,
      createdAt: convertClerkTimestamp(event.created_at).toISOString(),
      updatedAt: convertClerkTimestamp(event.updated_at).toISOString(),
    },
    occurredAt: convertClerkTimestamp(event.updated_at),
  };
}

/**
 * Normalize plan names from Clerk to match database conventions
 */
function normalizePlanName(planName: string): string {
  const normalized = planName.toLowerCase().trim();

  const planMap: Record<string, string> = {
    free: 'free',
    free_user: 'free',
    basic: 'free',
    starter: 'free',
    pro: 'pro',
    professional: 'pro',
    premium: 'pro',
    business: 'business',
    enterprise: 'business',
    team: 'business',
  };

  return planMap[normalized] || 'free';
}

/**
 * Validate subscription webhook event data
 */
export function validateSubscriptionEvent(
  event: any
): event is ClerkSubscriptionEvent | ClerkSubscriptionItemEvent {
  if (!event || typeof event !== 'object') return false;

  const hasRequiredFields =
    typeof event.id === 'string' &&
    typeof event.object === 'string' &&
    typeof event.status === 'string' &&
    typeof event.created_at === 'number' &&
    typeof event.updated_at === 'number';

  const isValidObject =
    event.object === 'commerce_subscription' || 
    event.object === 'commerce_subscription_item' ||
    event.object === 'subscription' || 
    event.object === 'subscription_item';

  return hasRequiredFields && isValidObject;
}

/**
 * Extract user identifier from subscription event
 */
export function extractUserIdentifier(
  event: ClerkSubscriptionEvent | ClerkSubscriptionItemEvent
): string | null {
  // Try direct user_id/organization_id fields
  if (event.user_id) return event.user_id;
  if (event.organization_id) return event.organization_id;
  
  // Check the payer field
  if ('payer' in event && event.payer) {
    if (event.payer.user_id) return event.payer.user_id;
    if (event.payer.organization_id) return event.payer.organization_id;
  }
  
  return null;
}