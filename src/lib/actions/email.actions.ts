// =============================================================================
// EMAIL ACTIONS
// =============================================================================
// Server actions for sending emails via Resend
// Follows Foldly's three-layer architecture: Client → Hook → Action → Service

'use server';

import { render } from '@react-email/render';
import { resend, sendEmailWithErrorHandling } from '@/lib/email/client';
import { EMAIL_SENDER, EMAIL_SUBJECTS, EMAIL_LIMITS } from '@/lib/email/constants';
import type {
  SendOTPEmailInput,
  SendUploadNotificationInput,
  SendInvitationInput,
  SendBulkInvitationInput,
  SendEditorPromotionInput,
  EmailActionResponse,
  BulkEmailActionResponse,
} from '@/lib/email/types';
import {
  OTPVerificationEmailTemplate,
  UploadNotificationEmailTemplate,
  InvitationEmailTemplate,
  EditorPromotionEmailTemplate,
} from '@/components/email';
import { sanitizeEmail, isValidOTPFormat } from '@/lib/utils/security';
import { checkRateLimit, RateLimitPresets, RateLimitKeys } from '@/lib/middleware/rate-limit';
import { logger } from '@/lib/utils/logger';

// =============================================================================
// 1. SEND OTP EMAIL
// =============================================================================

/**
 * Send OTP verification email to user
 *
 * @param data - OTP email data (email, otp, expiresInMinutes)
 * @returns EmailActionResponse with success status
 *
 * @example
 * ```typescript
 * const result = await sendOTPEmailAction({
 *   email: 'user@example.com',
 *   otp: '123456',
 *   expiresInMinutes: 10
 * });
 * ```
 */
export async function sendOTPEmailAction(
  data: SendOTPEmailInput
): Promise<EmailActionResponse> {
  try {
    // Validate email format
    const cleanEmail = sanitizeEmail(data.email);
    if (!cleanEmail) {
      return {
        success: false,
        error: 'Invalid email address format.',
      };
    }

    // Validate OTP format
    if (!isValidOTPFormat(data.otp)) {
      return {
        success: false,
        error: 'Invalid OTP format. Must be 6 digits.',
      };
    }

    // Apply rate limiting (5 per minute)
    const rateLimitKey = RateLimitKeys.otpEmail(cleanEmail);
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.STRICT);

    if (!rateLimitResult.allowed) {
      logger.warn('OTP email rate limit exceeded', {
        email: cleanEmail,
        resetAt: rateLimitResult.resetAt,
      });

      return {
        success: false,
        error: 'Too many verification code requests. Please try again later.',
        blocked: true,
        resetAt: rateLimitResult.resetAt,
      };
    }

    // Render email template
    const emailHtml = await render(
      OTPVerificationEmailTemplate({
        otp: data.otp,
        expiresInMinutes: data.expiresInMinutes,
      })
    );

    // Send email via Resend
    const result = await sendEmailWithErrorHandling(async () => {
      return await resend.emails.send({
        from: EMAIL_SENDER.DEFAULT,
        to: cleanEmail,
        subject: EMAIL_SUBJECTS.OTP_VERIFICATION,
        html: emailHtml,
      });
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    logger.info('OTP email sent successfully', {
      email: cleanEmail,
      emailId: result.data?.id,
    });

    return {
      success: true,
    };
  } catch (error) {
    logger.error('Failed to send OTP email', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: 'An unexpected error occurred while sending verification code.',
    };
  }
}

// =============================================================================
// 2. SEND UPLOAD NOTIFICATION EMAIL
// =============================================================================

/**
 * Send upload notification email to workspace owner
 *
 * @param data - Upload notification data
 * @returns EmailActionResponse with success status
 *
 * @example
 * ```typescript
 * const result = await sendUploadNotificationEmailAction({
 *   ownerEmail: 'owner@example.com',
 *   uploaderEmail: 'uploader@example.com',
 *   uploaderName: 'John Doe',
 *   fileName: 'document.pdf',
 *   linkName: 'Tax Documents 2024',
 *   linkUrl: 'https://foldly.com/john/tax-docs-2024'
 * });
 * ```
 */
export async function sendUploadNotificationEmailAction(
  data: SendUploadNotificationInput
): Promise<EmailActionResponse> {
  try {
    // Validate owner email
    const cleanOwnerEmail = sanitizeEmail(data.ownerEmail);
    if (!cleanOwnerEmail) {
      return {
        success: false,
        error: 'Invalid owner email address format.',
      };
    }

    // Validate uploader email
    const cleanUploaderEmail = sanitizeEmail(data.uploaderEmail);
    if (!cleanUploaderEmail) {
      return {
        success: false,
        error: 'Invalid uploader email address format.',
      };
    }

    // Apply rate limiting (20 per minute per owner)
    // This prevents spam if someone uploads many files rapidly
    const rateLimitKey = RateLimitKeys.emailNotification(cleanOwnerEmail);
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.MODERATE);

    if (!rateLimitResult.allowed) {
      logger.warn('Upload notification rate limit exceeded', {
        ownerEmail: cleanOwnerEmail,
        resetAt: rateLimitResult.resetAt,
      });

      // Silently fail for notifications - don't block the upload
      return {
        success: false,
        error: 'Notification rate limit exceeded.',
        blocked: true,
        resetAt: rateLimitResult.resetAt,
      };
    }

    // Render email template
    const emailHtml = await render(
      UploadNotificationEmailTemplate({
        uploaderName: data.uploaderName,
        uploaderEmail: cleanUploaderEmail,
        fileName: data.fileName,
        linkName: data.linkName,
        linkUrl: data.linkUrl,
      })
    );

    // Send email via Resend
    const result = await sendEmailWithErrorHandling(async () => {
      return await resend.emails.send({
        from: EMAIL_SENDER.DEFAULT,
        to: cleanOwnerEmail,
        subject: EMAIL_SUBJECTS.UPLOAD_NOTIFICATION,
        html: emailHtml,
      });
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    logger.info('Upload notification sent successfully', {
      ownerEmail: cleanOwnerEmail,
      fileName: data.fileName,
      emailId: result.data?.id,
    });

    return {
      success: true,
    };
  } catch (error) {
    logger.error('Failed to send upload notification', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: 'An unexpected error occurred while sending notification.',
    };
  }
}

// =============================================================================
// 3. SEND INVITATION EMAIL
// =============================================================================

/**
 * Send invitation email to recipient
 *
 * @param data - Invitation email data
 * @returns EmailActionResponse with success status
 *
 * @example
 * ```typescript
 * const result = await sendInvitationEmailAction({
 *   recipientEmail: 'client@example.com',
 *   recipientName: 'Jane Smith',
 *   senderName: 'John Doe',
 *   senderUserId: 'user_123',
 *   customMessage: 'Please upload your tax documents here.',
 *   linkUrl: 'https://foldly.com/john/tax-docs-2024',
 *   linkName: 'Tax Documents 2024'
 * });
 * ```
 */
export async function sendInvitationEmailAction(
  data: SendInvitationInput
): Promise<EmailActionResponse> {
  try {
    // Validate recipient email
    const cleanEmail = sanitizeEmail(data.recipientEmail);
    if (!cleanEmail) {
      return {
        success: false,
        error: 'Invalid recipient email address format.',
      };
    }

    // Validate custom message length (if provided)
    if (data.customMessage && data.customMessage.length > EMAIL_LIMITS.MAX_CUSTOM_MESSAGE_LENGTH) {
      return {
        success: false,
        error: `Custom message is too long. Maximum ${EMAIL_LIMITS.MAX_CUSTOM_MESSAGE_LENGTH} characters.`,
      };
    }

    // Apply rate limiting (20 per minute per sender)
    const rateLimitKey = RateLimitKeys.invitation(data.senderUserId);
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.MODERATE);

    if (!rateLimitResult.allowed) {
      logger.warn('Invitation rate limit exceeded', {
        senderUserId: data.senderUserId,
        resetAt: rateLimitResult.resetAt,
      });

      return {
        success: false,
        error: 'Too many invitations sent. Please try again later.',
        blocked: true,
        resetAt: rateLimitResult.resetAt,
      };
    }

    // Render email template
    const emailHtml = await render(
      InvitationEmailTemplate({
        inviterName: data.senderName,
        inviterEmail: data.senderEmail,
        linkName: data.linkName,
        linkUrl: data.linkUrl,
        message: data.customMessage,
      })
    );

    // Send email via Resend
    const result = await sendEmailWithErrorHandling(async () => {
      return await resend.emails.send({
        from: EMAIL_SENDER.DEFAULT,
        to: cleanEmail,
        subject: EMAIL_SUBJECTS.INVITATION,
        html: emailHtml,
        replyTo: EMAIL_SENDER.REPLY_TO,
      });
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    logger.info('Invitation email sent successfully', {
      recipientEmail: cleanEmail,
      senderUserId: data.senderUserId,
      emailId: result.data?.id,
    });

    return {
      success: true,
    };
  } catch (error) {
    logger.error('Failed to send invitation email', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: 'An unexpected error occurred while sending invitation.',
    };
  }
}

// =============================================================================
// 4. SEND BULK INVITATION EMAILS
// =============================================================================

/**
 * Send bulk invitation emails to multiple recipients
 *
 * @param data - Bulk invitation data with multiple recipients
 * @returns BulkEmailActionResponse with sent/failed counts
 *
 * @example
 * ```typescript
 * const result = await sendBulkInvitationEmailsAction({
 *   recipients: [
 *     { email: 'client1@example.com', name: 'Client One' },
 *     { email: 'client2@example.com', name: 'Client Two' }
 *   ],
 *   senderUserId: 'user_123',
 *   senderName: 'John Doe',
 *   customMessage: 'Please upload your documents.',
 *   linkUrl: 'https://foldly.com/john/docs',
 *   linkName: 'Client Documents'
 * });
 * ```
 */
export async function sendBulkInvitationEmailsAction(
  data: SendBulkInvitationInput
): Promise<BulkEmailActionResponse> {
  try {
    // Validate recipients count
    if (data.recipients.length === 0) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        errors: ['No recipients provided.'],
      };
    }

    if (data.recipients.length > EMAIL_LIMITS.MAX_BULK_RECIPIENTS) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        errors: [`Maximum ${EMAIL_LIMITS.MAX_BULK_RECIPIENTS} recipients per bulk send.`],
      };
    }

    // Validate custom message length (if provided)
    if (data.customMessage && data.customMessage.length > EMAIL_LIMITS.MAX_CUSTOM_MESSAGE_LENGTH) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        errors: [`Custom message is too long. Maximum ${EMAIL_LIMITS.MAX_CUSTOM_MESSAGE_LENGTH} characters.`],
      };
    }

    // Apply rate limiting for bulk sends (stricter)
    const rateLimitKey = RateLimitKeys.bulkInvitation(data.senderUserId);
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.STRICT);

    if (!rateLimitResult.allowed) {
      logger.warn('Bulk invitation rate limit exceeded', {
        senderUserId: data.senderUserId,
        resetAt: rateLimitResult.resetAt,
      });

      return {
        success: false,
        sent: 0,
        failed: 0,
        errors: ['Too many bulk invitations sent. Please try again later.'],
      };
    }

    // Send emails with delay between each
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const recipient of data.recipients) {
      try {
        // Validate recipient email
        const cleanEmail = sanitizeEmail(recipient.email);
        if (!cleanEmail) {
          failed++;
          errors.push(`Invalid email: ${recipient.email}`);
          continue;
        }

        // Render email template for this recipient
        const emailHtml = await render(
          InvitationEmailTemplate({
            inviterName: data.senderName,
            inviterEmail: data.senderEmail,
            linkName: data.linkName,
            linkUrl: data.linkUrl,
            message: data.customMessage,
          })
        );

        // Send email
        const result = await sendEmailWithErrorHandling(async () => {
          return await resend.emails.send({
            from: EMAIL_SENDER.DEFAULT,
            to: cleanEmail,
            subject: EMAIL_SUBJECTS.INVITATION,
            html: emailHtml,
            replyTo: EMAIL_SENDER.REPLY_TO,
          });
        });

        if (result.success) {
          sent++;
        } else {
          failed++;
          errors.push(`Failed to send to ${cleanEmail}: ${result.error}`);
        }

        // Delay between sends to respect Resend rate limits
        if (data.recipients.indexOf(recipient) < data.recipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, EMAIL_LIMITS.BULK_SEND_DELAY_MS));
        }
      } catch (error) {
        failed++;
        errors.push(
          `Error sending to ${recipient.email}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    logger.info('Bulk invitations completed', {
      senderUserId: data.senderUserId,
      totalRecipients: data.recipients.length,
      sent,
      failed,
    });

    return {
      success: sent > 0,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    logger.error('Failed to send bulk invitations', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      sent: 0,
      failed: data.recipients.length,
      errors: ['An unexpected error occurred while sending invitations.'],
    };
  }
}

// =============================================================================
// 5. SEND EDITOR PROMOTION EMAIL
// =============================================================================

/**
 * Send editor promotion email to user
 *
 * @param data - Editor promotion email data
 * @returns EmailActionResponse with success status
 *
 * @example
 * ```typescript
 * const result = await sendEditorPromotionEmailAction({
 *   email: 'editor@example.com',
 *   ownerName: 'John Doe',
 *   ownerEmail: 'john@example.com',
 *   resourceType: 'link',
 *   resourceName: 'Tax Documents 2024',
 *   resourceUrl: 'https://foldly.com/john/tax-docs-2024'
 * });
 * ```
 */
export async function sendEditorPromotionEmailAction(
  data: SendEditorPromotionInput
): Promise<EmailActionResponse> {
  try {
    // Validate email format
    const cleanEmail = sanitizeEmail(data.email);
    if (!cleanEmail) {
      return {
        success: false,
        error: 'Invalid email address format.',
      };
    }

    // Validate OTP format
    if (!isValidOTPFormat(data.otp)) {
      return {
        success: false,
        error: 'Invalid OTP format. Must be 6 digits.',
      };
    }

    // Apply rate limiting (same as OTP emails - 5 per minute)
    const rateLimitKey = RateLimitKeys.otpEmail(cleanEmail);
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.STRICT);

    if (!rateLimitResult.allowed) {
      logger.warn('Editor promotion email rate limit exceeded', {
        email: cleanEmail,
        resetAt: rateLimitResult.resetAt,
      });

      return {
        success: false,
        error: 'Too many promotion emails sent. Please try again later.',
        blocked: true,
        resetAt: rateLimitResult.resetAt,
      };
    }

    // Render email template
    const emailHtml = await render(
      EditorPromotionEmailTemplate({
        ownerName: data.ownerName,
        ownerEmail: data.ownerEmail,
        resourceType: data.resourceType,
        resourceName: data.resourceName,
        resourceUrl: data.resourceUrl,
        otp: data.otp,
      })
    );

    // Send email via Resend
    const result = await sendEmailWithErrorHandling(async () => {
      return await resend.emails.send({
        from: EMAIL_SENDER.DEFAULT,
        to: cleanEmail,
        subject: EMAIL_SUBJECTS.EDITOR_PROMOTION,
        html: emailHtml,
        replyTo: data.ownerEmail,
      });
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    logger.info('Editor promotion email sent successfully', {
      email: cleanEmail,
      ownerEmail: data.ownerEmail,
      resourceType: data.resourceType,
      emailId: result.data?.id,
    });

    return {
      success: true,
    };
  } catch (error) {
    logger.error('Failed to send editor promotion email', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: 'An unexpected error occurred while sending promotion email.',
    };
  }
}
