import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { userDeletionService } from '@/lib/services/user/user-deletion-service';
import { userWorkspaceService } from '@/lib/services/user/user-workspace-service';
import { transformClerkUserData } from '@/lib/webhooks/clerk-webhook-handler';
// TODO: Implement database layer
// import { syncUserWithClerk } from '@/lib/db/queries';

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing required headers' },
      { status: 400 }
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

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json(
      { error: 'Error verifying webhook' },
      { status: 400 }
    );
  }

  // Handle the webhook
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with an ID of ${id} and type of ${eventType}`);
  console.log('Webhook body:', body);

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

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }
  } catch (error) {
    console.error('❌ WEBHOOK_ERROR: Error handling webhook:', error);
    // Return 200 even for errors to prevent webhook retries
    return NextResponse.json(
      { success: false, error: 'Error processing webhook' },
      { status: 200 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
