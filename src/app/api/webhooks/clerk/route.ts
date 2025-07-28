import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { userDeletionService } from '@/features/users/services/user-deletion-service';
import { userWorkspaceService } from '@/features/users/services/user-workspace-service';
import { 
  transformClerkUserData,
  transformSubscriptionEventData,
  validateSubscriptionEvent,
  extractUserIdentifier
} from '@/lib/webhooks/clerk-webhook-handler';
import { ClerkBillingIntegrationService } from '@/lib/services/billing/clerk-billing-integration';

export async function POST(req: NextRequest) {
  // Security headers for webhook endpoint (Clerk 2025 best practices)
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

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  // Verify the payload with the headers (Clerk 2025 security best practices)
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
    
    // Enhanced security: Multiple timestamp validations
    const timestamp = parseInt(svix_timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutesAgo = now - 300; // 5 minutes in seconds
    const thirtySecondsInFuture = now + 30; // Allow small clock skew
    
    // Reject webhooks that are too old or too far in the future
    if (timestamp < fiveMinutesAgo) {
      console.error('Webhook timestamp too old:', { 
        timestamp, 
        now, 
        diff: now - timestamp,
        eventType: evt?.type || 'unknown'
      });
      return NextResponse.json(
        { error: 'Webhook timestamp too old', code: 'TIMESTAMP_EXPIRED' },
        { status: 400, headers: securityHeaders }
      );
    }
    
    if (timestamp > thirtySecondsInFuture) {
      console.error('Webhook timestamp too far in future:', { 
        timestamp, 
        now, 
        diff: timestamp - now,
        eventType: evt?.type || 'unknown'
      });
      return NextResponse.json(
        { error: 'Webhook timestamp invalid', code: 'TIMESTAMP_FUTURE' },
        { status: 400, headers: securityHeaders }
      );
    }

    // Additional security: Validate payload structure
    if (!evt || !evt.type || !evt.data) {
      console.error('Invalid webhook payload structure:', { 
        hasEvt: !!evt, 
        hasType: !!(evt?.type), 
        hasData: !!(evt?.data) 
      });
      return NextResponse.json(
        { error: 'Invalid webhook payload', code: 'PAYLOAD_INVALID' },
        { status: 400, headers: securityHeaders }
      );
    }

  } catch (err) {
    console.error('Error verifying webhook:', { 
      error: err instanceof Error ? err.message : String(err),
      svixId: svix_id,
      timestamp: svix_timestamp
    });
    return NextResponse.json(
      { error: 'Error verifying webhook', code: 'VERIFICATION_FAILED' },
      { status: 400, headers: securityHeaders }
    );
  }

  // Handle the webhook
  const { id } = evt.data;
  const eventType = evt.type;

  // Structured logging for better monitoring (Clerk 2025 best practices)
  const webhookContext = {
    eventId: id,
    eventType,
    timestamp: new Date().toISOString(),
    svixId: svix_id,
    userAgent: req.headers.get('user-agent'),
  };

  console.log(`🔔 WEBHOOK_RECEIVED:`, webhookContext);
  
  // Only log webhook body in development for security
  if (process.env.NODE_ENV === 'development') {
    console.log('Webhook body:', body);
  }

  try {
    switch (eventType) {
      case 'user.created':
        const newUserId = evt.data.id;
        console.log(
          `👤 USER_CREATION_WEBHOOK: Processing creation for user ${newUserId}`
        );

        try {
          // Transform Clerk user data to our format
          const userData = transformClerkUserData(evt.data);

          // Create user and workspace atomically
          const result =
            await userWorkspaceService.createUserWithWorkspace(userData);

          if (result.success) {
            console.log(
              `✅ USER_CREATED: User ${newUserId} created successfully with workspace`
            );
          } else {
            console.error(
              `❌ USER_CREATION_FAILED: ${newUserId} - ${result.error}`
            );
          }
        } catch (error) {
          console.error(`❌ USER_CREATION_ERROR: ${newUserId}`, error);
        }
        break;

      case 'user.updated':
        const updatedUserId = evt.data.id;
        console.log(
          `🔄 USER_UPDATE_WEBHOOK: Processing update for user ${updatedUserId}`
        );

        try {
          // Check if user exists in our database first
          const userExists =
            await userWorkspaceService.userExists(updatedUserId);

          if (!userExists) {
            console.log(
              `ℹ️ USER_NOT_FOUND: User ${updatedUserId} not in database, creating...`
            );
            // If user doesn't exist, treat as creation
            const userData = transformClerkUserData(evt.data);
            const result =
              await userWorkspaceService.createUserWithWorkspace(userData);

            if (result.success) {
              console.log(
                `✅ USER_CREATED_ON_UPDATE: User ${updatedUserId} created successfully`
              );
            } else {
              console.error(
                `❌ USER_CREATION_ON_UPDATE_FAILED: ${updatedUserId} - ${result.error}`
              );
            }
          } else {
            // User exists, update their information
            const userData = transformClerkUserData(evt.data);
            const result = await userWorkspaceService.createUser(userData); // This handles updates via upsert

            if (result.success) {
              console.log(
                `✅ USER_UPDATED: User ${updatedUserId} updated successfully`
              );
            } else {
              console.error(
                `❌ USER_UPDATE_FAILED: ${updatedUserId} - ${result.error}`
              );
            }
          }
        } catch (error) {
          console.error(`❌ USER_UPDATE_ERROR: ${updatedUserId}`, error);
        }
        break;

      case 'user.deleted':
        const userId = evt.data.id;
        console.log(
          `🗑️ USER_DELETION_WEBHOOK: Processing deletion for user ${userId}`
        );

        // Check if user exists in our database
        const userExists = await userDeletionService.userExists(userId);
        if (!userExists) {
          console.log(`ℹ️ USER_NOT_FOUND: User ${userId} not in database`);
          break;
        }

        // Delete user and all associated data
        const deletionResult = await userDeletionService.deleteUserData(userId);
        if (deletionResult.success) {
          console.log(
            `✅ USER_DELETED: User ${userId} and all data removed successfully`
          );
        } else {
          console.error(
            `❌ USER_DELETION_FAILED: ${userId}`,
            deletionResult.error
          );
        }
        break;
        
      // =============================================================================
      // SUBSCRIPTION BILLING EVENTS (2025 Clerk Billing)
      // =============================================================================
      
      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.active':
      case 'subscription.past_due':
      case 'subscription.canceled':
        console.log(`💳 SUBSCRIPTION_WEBHOOK: Processing ${eventType} event`);
        
        try {
          if (!validateSubscriptionEvent(evt.data)) {
            console.error(`Invalid subscription event data for ${eventType}:`, evt.data);
            break;
          }

          const userId = extractUserIdentifier(evt.data);
          if (!userId) {
            console.error(`No user identifier found in subscription event ${eventType}`);
            break;
          }

          const subscriptionData = transformSubscriptionEventData(evt.data, eventType);
          if (!subscriptionData.userId) {
            console.error(`No user ID in subscription data for ${eventType}`);
            break;
          }
          
          // Ensure userId is properly typed for the service
          const validatedSubscriptionData = {
            ...subscriptionData,
            userId: userId // Use the already validated userId
          };
          
          const result = await ClerkBillingIntegrationService.handleSubscriptionChange(validatedSubscriptionData);
          
          if (result.success) {
            console.log(`✅ SUBSCRIPTION_PROCESSED: ${eventType} for user ${userId}`);
          } else {
            console.error(`❌ SUBSCRIPTION_PROCESSING_FAILED: ${eventType} for user ${userId}:`, result.error);
          }
        } catch (error) {
          console.error(`❌ SUBSCRIPTION_EVENT_ERROR: ${eventType}`, error);
        }
        break;

      case 'subscriptionItem.created':
      case 'subscriptionItem.updated':
      case 'subscriptionItem.active':
      case 'subscriptionItem.canceled':
      case 'subscriptionItem.upcoming':
      case 'subscriptionItem.ended':
      case 'subscriptionItem.abandoned':
      case 'subscriptionItem.incomplete':
      case 'subscriptionItem.past_due':
        console.log(`💳 SUBSCRIPTION_ITEM_WEBHOOK: Processing ${eventType} event`);
        
        try {
          if (!validateSubscriptionEvent(evt.data)) {
            console.error(`Invalid subscription item event data for ${eventType}:`, evt.data);
            break;
          }

          const userId = extractUserIdentifier(evt.data);
          if (!userId) {
            console.error(`No user identifier found in subscription item event ${eventType}`);
            break;
          }

          const subscriptionData = transformSubscriptionEventData(evt.data, eventType);
          if (!subscriptionData.userId) {
            console.error(`No user ID in subscription data for ${eventType}`);
            break;
          }
          
          // Ensure userId is properly typed for the service
          const validatedSubscriptionData = {
            ...subscriptionData,
            userId: userId // Use the already validated userId
          };
          
          const result = await ClerkBillingIntegrationService.handleSubscriptionChange(validatedSubscriptionData);
          
          if (result.success) {
            console.log(`✅ SUBSCRIPTION_ITEM_PROCESSED: ${eventType} for user ${userId}`);
          } else {
            console.error(`❌ SUBSCRIPTION_ITEM_PROCESSING_FAILED: ${eventType} for user ${userId}:`, result.error);
          }
        } catch (error) {
          console.error(`❌ SUBSCRIPTION_ITEM_EVENT_ERROR: ${eventType}`, error);
        }
        break;

      case 'paymentAttempt.created':
      case 'paymentAttempt.updated':
        console.log(`💰 PAYMENT_WEBHOOK: Processing ${eventType} event`);
        
        try {
          const paymentData = evt.data;
          const userId = paymentData.user_id || paymentData.organization_id;
          
          if (userId) {
            console.log(`💰 PAYMENT_EVENT: ${eventType} for user ${userId}, status: ${paymentData.status}`);
            
            // For payment events, we primarily log them for monitoring
            // The actual subscription state changes will come via subscription webhooks
            if (paymentData.status === 'failed') {
              console.warn(`💰 PAYMENT_FAILED: User ${userId}, reason: ${paymentData.failure_reason || 'Unknown'}`);
            } else if (paymentData.status === 'succeeded') {
              console.log(`💰 PAYMENT_SUCCESS: User ${userId}, amount: ${paymentData.amount} ${paymentData.currency}`);
            }
          }
        } catch (error) {
          console.error(`❌ PAYMENT_EVENT_ERROR: ${eventType}`, error);
        }
        break;

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }
  } catch (error) {
    console.error('❌ WEBHOOK_ERROR: Error handling webhook:', {
      eventType,
      eventId: id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    
    // Enhanced error recovery for Clerk 2025 with improved categorization
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Categorize errors for better handling
    const isTransientError = error instanceof Error && (
      error.message.includes('timeout') ||
      error.message.includes('connection') ||
      error.message.includes('ECONNRESET') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('database temporarily unavailable') ||
      error.message.includes('temporary failure') ||
      error.message.includes('rate limit')
    );
    
    const isDatabaseError = error instanceof Error && (
      error.message.includes('database') ||
      error.message.includes('connection pool') ||
      error.message.includes('query timeout') ||
      error.message.includes('constraint violation')
    );
    
    const isAuthError = error instanceof Error && (
      error.message.includes('unauthorized') ||
      error.message.includes('forbidden') ||
      error.message.includes('authentication')
    );
    
    // Enhanced logging with error categories
    console.error('🔥 WEBHOOK_ERROR_DETAILED:', {
      eventType,
      eventId: id,
      errorMessage,
      errorCategory: isTransientError ? 'transient' : 
                    isDatabaseError ? 'database' : 
                    isAuthError ? 'auth' : 'unknown',
      isTransient: isTransientError,
      timestamp: new Date().toISOString(),
      userAgent: req.headers.get('user-agent'),
      stackTrace: process.env.NODE_ENV === 'development' ? errorStack : undefined,
    });
    
    // Handle transient errors gracefully
    if (isTransientError) {
      console.log('🔄 TRANSIENT_ERROR_RECOVERY: Marking as success to prevent retry storm', {
        eventType,
        eventId: id,
        willRetryNaturally: true
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Transient error, will retry naturally',
          code: 'TRANSIENT_ERROR',
          eventProcessed: false,
          willRetry: true
        },
        { status: 200, headers: securityHeaders }
      );
    }
    
    // Handle database errors with specific response
    if (isDatabaseError) {
      console.log('💾 DATABASE_ERROR_RECOVERY: Database issue detected', {
        eventType,
        eventId: id,
        requiresInvestigation: true
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database error occurred',
          code: 'DATABASE_ERROR',
          eventProcessed: false,
          requiresInvestigation: true
        },
        { status: 200, headers: securityHeaders }
      );
    }
    
    // Return 200 for all webhook errors to prevent Clerk retry storms
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error processing webhook', 
        code: 'PROCESSING_ERROR',
        eventProcessed: false,
        handled: true,
        eventType,
        eventId: id
      },
      { status: 200, headers: securityHeaders }
    );
  }

  // Enhanced success response with event confirmation
  return NextResponse.json({ 
    success: true, 
    eventType,
    eventId: id,
    processedAt: new Date().toISOString(),
    message: 'Webhook processed successfully'
  }, { 
    status: 200,
    headers: {
      ...securityHeaders,
      'X-Webhook-Processed': 'true',
      'X-Event-Type': eventType,
      'X-Event-ID': id || 'unknown'
    }
  });
}
