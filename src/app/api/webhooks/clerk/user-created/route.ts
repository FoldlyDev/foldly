import { NextRequest } from 'next/server';
import {
  validateClerkWebhook,
  transformClerkUserData,
  processWebhookWithRecovery,
} from '@/lib/webhooks';
import { userWorkspaceService } from '@/lib/services/workspace';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Step 1: Verify Clerk webhook signature
    const verification = await validateClerkWebhook(request);
    if (!verification.success) {
      console.error('❌ WEBHOOK_UNAUTHORIZED:', verification.error);
      return new Response('Unauthorized', { status: 401 });
    }

    // Step 2: Extract and validate event data
    const { type, data } = verification.data;
    if (type !== 'user.created') {
      console.log(`ℹ️ WEBHOOK_IGNORED: Event type ${type} not handled`);
      return new Response('Event not handled', { status: 200 });
    }

    // Step 3: Transform Clerk data to database format
    const userData = transformClerkUserData(data);

    // Step 4: Check for existing workspace (idempotency)
    const existingWorkspace = await userWorkspaceService.hasExistingWorkspace(
      userData.id
    );
    if (existingWorkspace) {
      const duration = Date.now() - startTime;
      console.log(`✅ WORKSPACE_EXISTS: User ${userData.id} | ${duration}ms`);
      return new Response('User workspace already exists', { status: 200 });
    }

    // Step 5: Create user and workspace with error recovery
    const result = await processWebhookWithRecovery(userData, 3);

    if (result.success) {
      const duration = Date.now() - startTime;
      console.log(`✅ WORKSPACE_CREATED: User ${userData.id} | ${duration}ms`);
      return new Response('User and workspace created', { status: 200 });
    } else {
      // Log error but don't block UI - return success for handled conflicts
      const duration = Date.now() - startTime;
      console.error(`❌ WEBHOOK_FAILED: ${duration}ms`, result.error);

      // Return 200 for conflicts we can handle gracefully - this prevents blocking the UI
      // Clerk will not retry webhook on 200 response
      return new Response(
        `Webhook processed with handled conflicts: ${result.error}`,
        { status: 200 }
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ WEBHOOK_FAILED: ${duration}ms`, error);

    // Return 200 even for unexpected errors to prevent blocking UI
    // Log the error for debugging but don't fail the webhook
    return new Response(
      `Webhook processed with errors: ${(error as Error).message}`,
      { status: 200 }
    );
  }
}
