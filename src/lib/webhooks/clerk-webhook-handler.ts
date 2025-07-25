import { Webhook } from 'svix';
import type { DatabaseResult, UserInsert } from '@/lib/supabase/types';

// Clerk webhook event structure
interface ClerkWebhookEvent {
  type: string;
  data: any;
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
    subscriptionTier: 'free',
    storageUsed: 0,
    storageLimit: 2147483648, // 2GB default
  };
}

function generateUsername(clerkUser: any): string {
  // Generate username from email or ID as fallback
  const emailPrefix =
    clerkUser.email_addresses?.[0]?.email_address?.split('@')[0];
  return emailPrefix || `user_${clerkUser.id.slice(-8)}`;
}
