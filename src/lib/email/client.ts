// =============================================================================
// RESEND EMAIL CLIENT
// =============================================================================
// Configuration for Resend email service
// Provides singleton client instance for sending transactional emails

import { Resend } from 'resend';
import { logger } from '@/lib/utils/logger';

/**
 * Resend API client singleton instance
 * Initialized with API key from environment variables
 *
 * @throws {Error} If RESEND_API_KEY environment variable is not set
 */
if (!process.env.RESEND_API_KEY) {
  throw new Error(
    'RESEND_API_KEY environment variable is not set. ' +
    'Please add it to your .env.local file.'
  );
}

export const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Email send result type
 */
export type EmailSendResult = {
  success: boolean;
  data?: { id: string };
  error?: string;
};

/**
 * Wrapper function for sending emails with error handling
 * Catches and logs Resend API errors without exposing details to client
 *
 * @param sendFn - Async function that calls resend.emails.send()
 * @returns Promise resolving to EmailSendResult
 *
 * @example
 * ```typescript
 * const result = await sendEmailWithErrorHandling(async () => {
 *   return await resend.emails.send({
 *     from: 'noreply@foldly.com',
 *     to: 'user@example.com',
 *     subject: 'Welcome',
 *     react: WelcomeEmail({ name: 'John' })
 *   });
 * });
 *
 * if (result.success) {
 *   console.log('Email sent:', result.data?.id);
 * } else {
 *   console.error('Failed to send email:', result.error);
 * }
 * ```
 */
export async function sendEmailWithErrorHandling(
  sendFn: () => Promise<any>
): Promise<EmailSendResult> {
  try {
    const response = await sendFn();

    if (response.error) {
      logger.error('Resend API error', {
        error: response.error,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        error: 'Failed to send email. Please try again later.'
      };
    }

    return {
      success: true,
      data: { id: response.data?.id || '' }
    };
  } catch (error) {
    logger.error('Email send exception', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      error: 'An unexpected error occurred while sending email.'
    };
  }
}
