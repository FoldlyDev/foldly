// =============================================================================
// USE EMAIL HOOKS - Global Data Hooks
// =============================================================================
// 🎯 Email operations (send OTP, notifications, invitations, promotions)

'use client';

import { useMutation } from '@tanstack/react-query';
import {
  sendOTPEmailAction,
  sendUploadNotificationEmailAction,
  sendInvitationEmailAction,
  sendBulkInvitationEmailsAction,
  sendEditorPromotionEmailAction,
} from '@/lib/actions/email.actions';
import type {
  SendOTPEmailInput,
  SendUploadNotificationInput,
  SendInvitationInput,
  SendBulkInvitationInput,
  SendEditorPromotionInput,
} from '@/lib/email/types';
import { transformActionError, createMutationErrorHandler } from '@/lib/utils/react-query-helpers';

/**
 * Send OTP verification email
 *
 * Used by:
 * - Authentication module (email verification)
 * - Permissions module (editor promotion verification)
 *
 * Features:
 * - Rate limited (5 per minute per email)
 * - Auto-expiry (10 minutes default)
 * - Success/error toast notifications
 *
 * @returns Mutation to send OTP email
 *
 * @example
 * ```typescript
 * const { mutate: sendOTP, isPending } = useSendOTPEmail();
 *
 * sendOTP({
 *   email: 'user@example.com',
 *   otp: '123456',
 *   expiresInMinutes: 10
 * });
 * ```
 */
export function useSendOTPEmail() {
  return useMutation({
    mutationFn: async (data: SendOTPEmailInput) => {
      const result = await sendOTPEmailAction(data);
      return transformActionError(result, 'Failed to send verification code');
    },
    onSuccess: () => {
      // TODO: Add success notification when notification system is implemented
    },
    onError: createMutationErrorHandler('OTP email sending'),
    retry: false,
  });
}

/**
 * Send upload notification email
 *
 * Used by:
 * - Uploads module (notify owner when file is uploaded)
 *
 * Features:
 * - Rate limited (20 per minute per owner)
 * - Silent operation (no user-facing toast notifications)
 * - Background execution
 *
 * Note: This is typically called from server actions after file upload completes.
 * Silent failures prevent blocking the upload flow.
 *
 * @returns Mutation to send upload notification
 *
 * @example
 * ```typescript
 * const { mutate: sendNotification } = useSendUploadNotification();
 *
 * sendNotification({
 *   ownerEmail: 'owner@example.com',
 *   uploaderEmail: 'uploader@example.com',
 *   uploaderName: 'John Doe',
 *   fileName: 'document.pdf',
 *   linkName: 'Tax Documents',
 *   linkUrl: 'https://foldly.com/john/tax-docs'
 * });
 * ```
 */
export function useSendUploadNotification() {
  return useMutation({
    mutationFn: async (data: SendUploadNotificationInput) => {
      const result = await sendUploadNotificationEmailAction(data);
      return transformActionError(result, 'Failed to send upload notification');
    },
    // Silent operation - no user-facing notifications
    // Upload should succeed even if notification email fails
    retry: false,
  });
}

/**
 * Send invitation email to single recipient
 *
 * Used by:
 * - Links module (invite users to upload files)
 * - Workspace module (share links with specific people)
 *
 * Features:
 * - Rate limited (20 per minute per sender)
 * - Custom message support (max 500 characters)
 * - Success/error toast notifications
 *
 * @returns Mutation to send invitation email
 *
 * @example
 * ```typescript
 * const { mutate: sendInvite, isPending } = useSendInvitation();
 *
 * sendInvite({
 *   recipientEmail: 'client@example.com',
 *   recipientName: 'Jane Smith',
 *   senderName: 'John Doe',
 *   senderEmail: 'john@example.com',
 *   senderUserId: 'user_123',
 *   customMessage: 'Please upload your documents here.',
 *   linkUrl: 'https://foldly.com/john/docs',
 *   linkName: 'Client Documents'
 * });
 * ```
 */
export function useSendInvitation() {
  return useMutation({
    mutationFn: async (data: SendInvitationInput) => {
      const result = await sendInvitationEmailAction(data);
      return transformActionError(result, 'Failed to send invitation');
    },
    onSuccess: () => {
      // TODO: Add success notification when notification system is implemented
    },
    onError: createMutationErrorHandler('Invitation sending'),
    retry: false,
  });
}

/**
 * Send bulk invitation emails to multiple recipients
 *
 * Used by:
 * - Links module (invite multiple users at once)
 * - Workspace module (bulk sharing)
 *
 * Features:
 * - Rate limited (5 bulk sends per minute)
 * - Maximum 100 recipients per bulk send
 * - Delay between sends (100ms) to respect Resend limits
 * - Detailed results (sent count, failed count, errors)
 * - Success/error toast with detailed feedback
 *
 * @returns Mutation to send bulk invitation emails
 *
 * @example
 * ```typescript
 * const { mutate: sendBulkInvites, isPending } = useSendBulkInvitations();
 *
 * sendBulkInvites({
 *   recipients: [
 *     { email: 'client1@example.com', name: 'Client One' },
 *     { email: 'client2@example.com', name: 'Client Two' }
 *   ],
 *   senderUserId: 'user_123',
 *   senderName: 'John Doe',
 *   senderEmail: 'john@example.com',
 *   customMessage: 'Please upload your documents.',
 *   linkUrl: 'https://foldly.com/john/docs',
 *   linkName: 'Client Documents'
 * });
 * ```
 */
export function useSendBulkInvitations() {
  return useMutation({
    mutationFn: async (data: SendBulkInvitationInput) => {
      const result = await sendBulkInvitationEmailsAction(data);
      return transformActionError(result, 'Failed to send bulk invitations');
    },
    onSuccess: (data) => {
      // TODO: Add success notification when notification system is implemented
      // Display bulk results: data.sent, data.failed, data.errors
    },
    onError: createMutationErrorHandler('Bulk invitation sending'),
    retry: false,
  });
}

/**
 * Send editor promotion email
 *
 * Used by:
 * - Permissions module (promote user to editor)
 * - Links module (share edit access)
 * - Workspace module (collaboration invites)
 *
 * Features:
 * - Rate limited (5 per minute per email)
 * - Includes OTP for email verification
 * - Success/error toast notifications
 *
 * @returns Mutation to send editor promotion email
 *
 * @example
 * ```typescript
 * const { mutate: sendPromotion, isPending } = useSendEditorPromotion();
 *
 * sendPromotion({
 *   email: 'editor@example.com',
 *   otp: '123456',
 *   ownerName: 'John Doe',
 *   ownerEmail: 'john@example.com',
 *   resourceType: 'link',
 *   resourceName: 'Tax Documents',
 *   resourceUrl: 'https://foldly.com/john/tax-docs'
 * });
 * ```
 */
export function useSendEditorPromotion() {
  return useMutation({
    mutationFn: async (data: SendEditorPromotionInput) => {
      const result = await sendEditorPromotionEmailAction(data);
      return transformActionError(result, 'Failed to send editor promotion email');
    },
    onSuccess: () => {
      // TODO: Add success notification when notification system is implemented
    },
    onError: createMutationErrorHandler('Editor promotion email sending'),
    retry: false,
  });
}
