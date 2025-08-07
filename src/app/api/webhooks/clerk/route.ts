import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { userDeletionService } from '@/features/users/services/user-deletion-service';
import { userWorkspaceService } from '@/features/users/services/user-workspace-service';
import {
  transformClerkUserData,
  transformSubscriptionEventData,
  validateSubscriptionEvent,
  extractUserIdentifier,
} from '@/lib/webhooks/clerk-webhook-handler';
import { ClerkBillingIntegrationService } from '@/features/billing/lib/services/clerk-billing-integration';

export async function POST(req: NextRequest) {
  // Security headers for webhook endpoint
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  };
  
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing required headers', code: 'MISSING_HEADERS' },
      { status: 400, headers: securityHeaders }
    );
  }

  // Get the body
  const payload = await req.text();
  const body = JSON.parse(payload);

  // Get the Webhook secret from environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      'Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env.local'
    );
  }

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });

    // Timestamp validation
    const timestamp = parseInt(svix_timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutesAgo = now - 300;
    const thirtySecondsInFuture = now + 30;

    if (timestamp < fiveMinutesAgo || timestamp > thirtySecondsInFuture) {
      return NextResponse.json(
        { error: 'Webhook timestamp invalid', code: 'TIMESTAMP_INVALID' },
        { status: 400, headers: securityHeaders }
      );
    }

    // Validate payload structure
    if (!evt || !evt.type || !evt.data) {
      return NextResponse.json(
        { error: 'Invalid webhook payload', code: 'PAYLOAD_INVALID' },
        { status: 400, headers: securityHeaders }
      );
    }
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json(
      { error: 'Error verifying webhook', code: 'VERIFICATION_FAILED' },
      { status: 400, headers: securityHeaders }
    );
  }

  // Handle the webhook
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook received: ${eventType} for ${id}`);

  try {
    switch (eventType) {
      case 'user.created':
        try {
          // Transform Clerk user data to our format
          const userData = transformClerkUserData(evt.data);

          // Create user and workspace atomically
          const result =
            await userWorkspaceService.createUserWithWorkspace(userData);

          if (!result.success) {
            console.error(`User creation failed: ${id} - ${result.error}`);
          }
        } catch (error) {
          console.error(`User creation error: ${id}`, error);
        }
        break;

      case 'user.updated':
        try {
          // Check if user exists in our database first
          const userExists = await userWorkspaceService.userExists(id);

          if (!userExists) {
            // If user doesn't exist, treat as creation
            const userData = transformClerkUserData(evt.data);
            const result =
              await userWorkspaceService.createUserWithWorkspace(userData);

            if (!result.success) {
              console.error(`User creation on update failed: ${id} - ${result.error}`);
            }
          } else {
            // User exists, update their information
            const userData = transformClerkUserData(evt.data);
            const result = await userWorkspaceService.createUser(userData);

            if (!result.success) {
              console.error(`User update failed: ${id} - ${result.error}`);
            }
          }
        } catch (error) {
          console.error(`User update error: ${id}`, error);
        }
        break;

      case 'user.deleted':
        // Process user deletion asynchronously to avoid webhook timeout
        // Respond immediately to Clerk webhook
        setTimeout(async () => {
          try {
            // Check if user exists in our database
            const userExists = await userDeletionService.userExists(id);
            if (!userExists) {
              console.log(`User ${id} not found in database, skipping deletion`);
              return;
            }

            console.log(`Starting async deletion for user ${id}`);
            
            // Delete user and all associated data
            const deletionResult = await userDeletionService.deleteUserData(id);
            if (!deletionResult.success) {
              console.error(`User deletion failed: ${id}`, deletionResult.error);
            } else {
              console.log(`User ${id} deletion completed successfully`);
            }
          } catch (error) {
            console.error(`User deletion error: ${id}`, error);
          }
        }, 0); // Execute on next tick
        
        console.log(`User deletion webhook received for ${id}, processing asynchronously`);
        break;

      // Subscription billing events
      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.active':
      case 'subscription.past_due':
      case 'subscription.canceled':
      case 'subscriptionItem.created':
      case 'subscriptionItem.updated':
      case 'subscriptionItem.active':
      case 'subscriptionItem.canceled':
      case 'subscriptionItem.upcoming':
      case 'subscriptionItem.ended':
      case 'subscriptionItem.abandoned':
      case 'subscriptionItem.incomplete':
      case 'subscriptionItem.past_due':
        try {
          if (!validateSubscriptionEvent(evt.data)) {
            console.error(`Invalid subscription event data for ${eventType}`);
            break;
          }

          const userId = extractUserIdentifier(evt.data);
          if (!userId) {
            console.error(`No user identifier found in subscription event ${eventType}`);
            break;
          }

          // Check if user exists, if not wait briefly for user creation webhook
          const userExists = await userWorkspaceService.userExists(userId);
          if (!userExists) {
            console.log(`User ${userId} not found for subscription event, waiting for user creation...`);
            
            // Wait up to 5 seconds for user to be created
            let retryCount = 0;
            const maxRetries = 10;
            const retryDelay = 500; // 500ms between retries
            
            while (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              const exists = await userWorkspaceService.userExists(userId);
              if (exists) {
                console.log(`User ${userId} found after ${retryCount + 1} retries`);
                break;
              }
              retryCount++;
            }
            
            // Final check
            const finalCheck = await userWorkspaceService.userExists(userId);
            if (!finalCheck) {
              console.error(`User ${userId} still not found after waiting, skipping subscription event`);
              break;
            }
          }

          const subscriptionData = transformSubscriptionEventData(
            evt.data,
            eventType
          );

          // Skip duplicate subscriptionItem events
          if (subscriptionData.eventType === 'skip') {
            console.log(
              `Skipping duplicate event: ${eventType} for user ${userId} (tracking subscription events only)`
            );
            break;
          }

          const result =
            await ClerkBillingIntegrationService.handleSubscriptionChange({
              ...subscriptionData,
              userId: userId,
            });

          if (!result.success) {
            console.error(
              `Subscription processing failed: ${eventType} for user ${userId}:`,
              result.error
            );
          }
        } catch (error) {
          console.error(`Subscription event error: ${eventType}`, error);
        }
        break;

      case 'paymentAttempt.created':
      case 'paymentAttempt.updated':
        try {
          const paymentData = evt.data;
          const userId = paymentData.user_id || paymentData.organization_id;

          if (userId) {
            console.log(
              `Payment event: ${eventType} for user ${userId}, status: ${paymentData.status}`
            );

            // For payment events, we primarily log them for monitoring
            // The actual subscription state changes will come via subscription webhooks
            if (paymentData.status === 'failed') {
              console.warn(
                `Payment failed: User ${userId}, reason: ${paymentData.failure_reason || 'Unknown'}`
              );
            }
          }
        } catch (error) {
          console.error(`Payment event error: ${eventType}`, error);
        }
        break;

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }
  } catch (error) {
    console.error('Error handling webhook:', {
      eventType,
      eventId: id,
      error: error instanceof Error ? error.message : String(error),
    });

    // Determine if this is a transient error
    const isTransientError =
      error instanceof Error &&
      (error.message.includes('timeout') ||
        error.message.includes('connection') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('database temporarily unavailable'));

    // Return 200 for all webhook errors to prevent Clerk retry storms
    return NextResponse.json(
      {
        success: false,
        error: 'Error processing webhook',
        code: isTransientError ? 'TRANSIENT_ERROR' : 'PROCESSING_ERROR',
        eventProcessed: false,
        eventType,
        eventId: id,
      },
      { status: 200, headers: securityHeaders }
    );
  }

  // Success response
  return NextResponse.json(
    {
      success: true,
      eventType,
      eventId: id,
      processedAt: new Date().toISOString(),
      message: 'Webhook processed successfully',
    },
    {
      status: 200,
      headers: {
        ...securityHeaders,
        'X-Webhook-Processed': 'true',
        'X-Event-Type': eventType,
        'X-Event-ID': id || 'unknown',
      },
    }
  );
}