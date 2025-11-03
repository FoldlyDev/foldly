// =============================================================================
// LINK INVITATIONS HOOKS - Send Link Invitation Emails
// =============================================================================
// React Query hooks for sending invitation emails when links are created
// with allowed emails. Updates permission timestamps to prevent duplicates.

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendLinkInvitationsAction, type SendLinkInvitationsInput } from '@/lib/actions/link-invitation.actions';
import { transformActionError, createMutationErrorHandler } from '@/lib/utils/react-query-helpers';
import { permissionKeys } from '@/lib/config/query-keys';

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Send invitation emails for a link
 * Sends bulk emails to all allowed emails and updates lastInvitationSentAt timestamps
 *
 * @example
 * ```typescript
 * const sendInvitations = useSendLinkInvitations();
 *
 * sendInvitations.mutate({
 *   linkId: 'link_123',
 *   linkSlug: 'client-docs',
 *   linkName: 'Client Documents',
 *   allowedEmails: ['client1@example.com', 'client2@example.com'],
 *   customMessage: 'Please upload your documents here'
 * });
 * ```
 */
export function useSendLinkInvitations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendLinkInvitationsInput) => {
      const result = await sendLinkInvitationsAction(input);
      return transformActionError(result, 'Failed to send invitations');
    },
    onSuccess: async (data, variables) => {
      // Invalidate link permissions cache to reflect updated lastInvitationSentAt
      await queryClient.invalidateQueries({
        queryKey: permissionKeys.byLink(variables.linkId),
      });
    },
    onError: createMutationErrorHandler('Link invitations'),
    retry: false, // Never retry mutations (emails may have already been sent)
  });
}
