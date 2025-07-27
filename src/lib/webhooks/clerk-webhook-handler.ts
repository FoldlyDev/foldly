import { Webhook } from 'svix';
import type { DatabaseResult, UserInsert } from '@/lib/database/types';

// Clerk webhook event structure
interface ClerkWebhookEvent {
  type: string;
  data: any;
}

// Enhanced subscription event data interfaces
interface ClerkSubscriptionEvent {
  id: string;
  object: 'subscription';
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  created_at: number;
  updated_at: number;
  current_period_start: number;
  current_period_end: number;
  plan?: {
    id: string;
    name: string;
    nickname?: string;
  };
  user_id?: string;
  organization_id?: string;
}

interface ClerkSubscriptionItemEvent {
  id: string;
  object: 'subscription_item';
  subscription_id: string;
  plan: {
    id: string;
    name: string;
    nickname?: string;
  };
  quantity?: number;
  status: 'active' | 'canceled' | 'incomplete' | 'ended' | 'upcoming' | 'abandoned' | 'past_due';
  created_at: number;
  updated_at: number;
  user_id?: string;
  organization_id?: string;
}

interface ClerkPaymentAttemptEvent {
  id: string;
  object: 'payment_attempt';
  status: 'succeeded' | 'failed' | 'pending' | 'canceled';
  amount: number;
  currency: string;
  subscription_id?: string;
  created_at: number;
  failure_reason?: string;
  user_id?: string;
  organization_id?: string;
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

export function transformClerkUserData(clerkUser: any): WebhookUserData {
  // Handle missing email gracefully
  const primaryEmail =
    clerkUser.email_addresses?.find((email: any) => email.primary)
      ?.email_address || clerkUser.email_addresses?.[0]?.email_address;

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

function generateUsername(clerkUser: any): string {
  // Generate username from email or ID as fallback
  const emailPrefix =
    clerkUser.email_addresses?.[0]?.email_address?.split('@')[0];
  return emailPrefix || `user_${clerkUser.id.slice(-8)}`;
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
    // For subscription items, the plan is directly available
    toPlan = normalizePlanName(event.plan.nickname || event.plan.name);
  } else if ('status' in event && event.object === 'subscription') {
    // For subscriptions, we might need to infer from metadata or status
    // This would require additional context from your subscription flow
    toPlan = event.status === 'active' ? 'pro' : 'free'; // Simplified logic
  }
  
  // Determine event type for analytics
  let analyticsEventType = 'unknown';
  if (eventType.includes('created')) {
    analyticsEventType = toPlan === 'free' ? 'reactivate' : 'upgrade';
  } else if (eventType.includes('canceled') || eventType.includes('ended')) {
    analyticsEventType = 'cancel';
    fromPlan = toPlan;
    toPlan = 'free';
  } else if (eventType.includes('updated')) {
    analyticsEventType = 'change';
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
      status: event.status || 'unknown',
      createdAt: new Date(event.created_at * 1000).toISOString(),
      updatedAt: new Date(event.updated_at * 1000).toISOString(),
    },
    occurredAt: new Date(event.updated_at * 1000),
  };
}

/**
 * Normalize plan names from Clerk to match database conventions
 */
function normalizePlanName(planName: string): string {
  const normalized = planName.toLowerCase().trim();
  
  // Map common variations to standard plan names
  const planMap: Record<string, string> = {
    'free': 'free',
    'basic': 'free',
    'starter': 'free',
    'pro': 'pro',
    'professional': 'pro',
    'premium': 'pro',
    'business': 'business',
    'enterprise': 'business',
    'team': 'business',
  };
  
  return planMap[normalized] || 'free';
}

/**
 * Validate subscription webhook event data
 */
export function validateSubscriptionEvent(event: any): event is ClerkSubscriptionEvent | ClerkSubscriptionItemEvent {
  if (!event || typeof event !== 'object') return false;
  
  const hasRequiredFields = 
    typeof event.id === 'string' &&
    typeof event.object === 'string' &&
    typeof event.status === 'string' &&
    typeof event.created_at === 'number' &&
    typeof event.updated_at === 'number';
  
  const isValidObject = 
    event.object === 'subscription' || 
    event.object === 'subscription_item';
  
  return hasRequiredFields && isValidObject;
}

/**
 * Extract user identifier from subscription event (handles both user and organization subscriptions)
 */
export function extractUserIdentifier(event: ClerkSubscriptionEvent | ClerkSubscriptionItemEvent): string | null {
  // Prioritize user_id, fall back to organization_id
  return event.user_id || event.organization_id || null;
}
