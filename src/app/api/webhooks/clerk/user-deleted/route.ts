import { NextRequest } from 'next/server';
import { validateClerkWebhook } from '@/lib/webhooks';
import { userDeletionService } from '@/lib/services/workspace/user-deletion-service';

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
    if (type !== 'user.deleted') {
      console.log(`ℹ️ WEBHOOK_IGNORED: Event type ${type} not handled`);
      return new Response('Event not handled', { status: 200 });
    }

    const userId = data.id;
    if (!userId) {
      console.error('❌ INVALID_USER_DATA: No user ID in webhook payload');
      return new Response('Invalid user data', { status: 400 });
    }

    // Step 3: Check if user exists in our database
    const userExists = await userDeletionService.userExists(userId);
    if (!userExists) {
      const duration = Date.now() - startTime;
      console.log(
        `ℹ️ USER_NOT_FOUND: User ${userId} not in database | ${duration}ms`
      );
      return new Response('User not found in database', { status: 200 });
    }

    // Step 4: Get user data count for audit logging
    const dataCount = await userDeletionService.getUserDataCount(userId);
    const totalRecords = Object.values(dataCount).reduce(
      (sum, count) => sum + count,
      0
    );
    console.log(
      `📊 USER_DATA_AUDIT: User ${userId} has ${totalRecords} records to delete`,
      dataCount
    );

    // Step 5: Delete user and all associated data
    const result = await userDeletionService.deleteUserData(userId);

    if (result.success) {
      const duration = Date.now() - startTime;
      console.log(
        `✅ USER_DELETED: User ${userId} and all data removed | ${duration}ms`
      );
      return new Response('User data deleted successfully', { status: 200 });
    } else {
      // Log error but still return 200 to prevent webhook retries
      const duration = Date.now() - startTime;
      console.error(
        `❌ DELETION_FAILED: User ${userId} | ${duration}ms`,
        result.error
      );
      return new Response(`User deletion failed: ${result.error}`, {
        status: 200,
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ WEBHOOK_FAILED: ${duration}ms`, error);

    // Return 200 even for unexpected errors to prevent webhook retries
    // Log the error for debugging but don't fail the webhook
    return new Response(
      `Webhook processed with errors: ${(error as Error).message}`,
      { status: 200 }
    );
  }
}
