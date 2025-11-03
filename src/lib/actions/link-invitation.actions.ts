// =============================================================================
// LINK INVITATION ACTIONS - Send Invitations for Link Creation
// =============================================================================
// Handles sending invitation emails when links are created with allowed emails
// Updates permission timestamps to prevent duplicate sends

'use server';

import { withAuthInputAndRateLimit } from '@/lib/utils/action-helpers';
import { getAuthenticatedWorkspace } from '@/lib/utils/authorization';
import { sendBulkInvitationEmailsAction } from './email.actions';
import { getLinkPermissions, updatePermissionInvitationTimestamp, getUserById } from '@/lib/database/queries';
import { logger } from '@/lib/utils/logger';
import { RateLimitPresets } from '@/lib/middleware/rate-limit';
import { z } from 'zod';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const sendLinkInvitationsSchema = z.object({
  linkId: z.string().uuid('Invalid link ID'),
  linkSlug: z.string().min(1, 'Link slug is required'),
  linkName: z.string().min(1, 'Link name is required'),
  allowedEmails: z.array(z.string().email()).min(1, 'At least one email is required'),
  customMessage: z.string().max(500).optional(),
});

export type SendLinkInvitationsInput = z.infer<typeof sendLinkInvitationsSchema>;

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Send invitation emails for newly created link
 * Sends bulk emails to all allowed emails and updates lastInvitationSentAt timestamps
 * Rate limited: 5 requests per minute (strict - bulk email operation)
 *
 * @param input - Link invitation data
 * @returns Action response with sent/failed counts
 *
 * @example
 * ```typescript
 * const result = await sendLinkInvitationsAction({
 *   linkId: 'link_123',
 *   linkSlug: 'client-docs',
 *   linkName: 'Client Documents',
 *   allowedEmails: ['client1@example.com', 'client2@example.com']
 * });
 * ```
 */
export const sendLinkInvitationsAction = withAuthInputAndRateLimit<
  SendLinkInvitationsInput,
  { sent: number; failed: number }
>(
  'sendLinkInvitationsAction',
  RateLimitPresets.STRICT, // 5 per minute - bulk email operation
  async (userId, input) => {
    // Validate input
    const validated = z.object({
      linkId: z.string().uuid(),
      linkSlug: z.string().min(1),
      linkName: z.string().min(1),
      allowedEmails: z.array(z.string().email()).min(1),
      customMessage: z.string().max(500).optional(),
    }).parse(input);

    // Get user's workspace
    const workspace = await getAuthenticatedWorkspace(userId);

    // Get user info for sender details
    const user = await getUserById(userId);
    if (!user || !user.email) {
      throw {
        success: false,
        error: 'User email not found',
      } as const;
    }

    // Construct sender name (firstName || username || workspace name || fallback)
    const senderName = user.firstName || user.username || workspace.name || 'Foldly User';

    // Construct link URL with username
    const linkUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${workspace.user.username}/${validated.linkSlug}`;

    // Send bulk invitation emails
    const emailResult = await sendBulkInvitationEmailsAction({
      recipients: validated.allowedEmails.map(email => ({ email })),
      senderUserId: userId,
      senderName,
      senderEmail: user.email,
      linkName: validated.linkName,
      linkUrl,
      customMessage: validated.customMessage,
    });

    logger.info('Link invitations sent', {
      linkId: validated.linkId,
      sent: emailResult.sent,
      failed: emailResult.failed,
      userId,
    });

    // Update lastInvitationSentAt for successfully sent emails
    if (emailResult.sent > 0) {
      try {
        const permissions = await getLinkPermissions(validated.linkId);
        const now = new Date();

        // Filter to only permissions for the allowed emails (editor role)
        const relevantPermissions = permissions.filter(p =>
          validated.allowedEmails.includes(p.email) && p.role === 'editor'
        );

        // Update timestamps in parallel
        await Promise.allSettled(
          relevantPermissions.map(permission =>
            updatePermissionInvitationTimestamp(permission.id, now)
          )
        );

        logger.info('Updated invitation timestamps', {
          linkId: validated.linkId,
          count: relevantPermissions.length,
        });
      } catch (error) {
        // Log but don't fail - emails were sent successfully
        logger.warn('Failed to update invitation timestamps', {
          linkId: validated.linkId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: true,
      data: {
        sent: emailResult.sent,
        failed: emailResult.failed,
      },
    } as const;
  }
);
