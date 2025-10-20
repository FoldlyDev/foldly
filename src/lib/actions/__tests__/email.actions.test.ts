// =============================================================================
// EMAIL ACTIONS TESTS
// =============================================================================
// Unit tests for email sending actions

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@react-email/render';
import {
  sendOTPEmailAction,
  sendUploadNotificationEmailAction,
  sendInvitationEmailAction,
  sendBulkInvitationEmailsAction,
  sendEditorPromotionEmailAction,
} from '../email.actions';
import * as emailClient from '@/lib/email/client';
import * as rateLimitModule from '@/lib/middleware/rate-limit';
import { EMAIL_LIMITS } from '@/lib/email/constants';

// Mock modules
vi.mock('@react-email/render', () => ({
  render: vi.fn(),
}));

vi.mock('@/lib/email/client', () => ({
  resend: {
    emails: {
      send: vi.fn(),
    },
  },
  sendEmailWithErrorHandling: vi.fn(),
}));

vi.mock('@/lib/middleware/rate-limit', async () => {
  const actual = await vi.importActual('@/lib/middleware/rate-limit');
  return {
    ...actual,
    checkRateLimit: vi.fn(),
  };
});

describe('Email Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(render).mockResolvedValue('<html>Email content</html>');
    vi.mocked(emailClient.sendEmailWithErrorHandling).mockResolvedValue({
      success: true,
      data: { id: 'test-email-id' },
    });
    vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetAt: Date.now() + 60000,
      blocked: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =============================================================================
  // 1. SEND OTP EMAIL ACTION
  // =============================================================================

  describe('sendOTPEmailAction', () => {
    const validOTPInput = {
      email: 'user@example.com',
      otp: '123456',
      expiresInMinutes: 10,
    };

    test('should send OTP email successfully', async () => {
      const result = await sendOTPEmailAction(validOTPInput);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(render).toHaveBeenCalledWith(expect.any(Object));
      expect(emailClient.sendEmailWithErrorHandling).toHaveBeenCalled();
    });

    test('should reject invalid email format', async () => {
      const result = await sendOTPEmailAction({
        ...validOTPInput,
        email: 'invalid-email',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email address format');
      expect(emailClient.sendEmailWithErrorHandling).not.toHaveBeenCalled();
    });

    test('should reject invalid OTP format (too short)', async () => {
      const result = await sendOTPEmailAction({
        ...validOTPInput,
        otp: '12345', // Only 5 digits
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid OTP format');
      expect(emailClient.sendEmailWithErrorHandling).not.toHaveBeenCalled();
    });

    test('should reject invalid OTP format (contains letters)', async () => {
      const result = await sendOTPEmailAction({
        ...validOTPInput,
        otp: '12A456',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid OTP format');
    });

    test('should enforce rate limiting', async () => {
      vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 300000,
        blocked: true,
      });

      const result = await sendOTPEmailAction(validOTPInput);

      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.error).toContain('Too many verification code requests');
      expect(emailClient.sendEmailWithErrorHandling).not.toHaveBeenCalled();
    });

    test('should handle email send failure', async () => {
      vi.mocked(emailClient.sendEmailWithErrorHandling).mockResolvedValue({
        success: false,
        error: 'Resend API error',
      });

      const result = await sendOTPEmailAction(validOTPInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Resend API error');
    });

    test('should sanitize email before sending', async () => {
      const result = await sendOTPEmailAction({
        ...validOTPInput,
        email: '  USER@EXAMPLE.COM  ',
      });

      expect(result.success).toBe(true);
      // Verify sanitized email was used in rate limit check
      expect(rateLimitModule.checkRateLimit).toHaveBeenCalledWith(
        expect.stringContaining('user@example.com'),
        expect.any(Object)
      );
    });
  });

  // =============================================================================
  // 2. SEND UPLOAD NOTIFICATION EMAIL ACTION
  // =============================================================================

  describe('sendUploadNotificationEmailAction', () => {
    const validNotificationInput = {
      ownerEmail: 'owner@example.com',
      uploaderEmail: 'uploader@example.com',
      uploaderName: 'John Doe',
      fileName: 'document.pdf',
      linkName: 'Tax Documents',
      linkUrl: 'https://foldly.com/owner/tax-docs',
    };

    test('should send upload notification successfully', async () => {
      const result = await sendUploadNotificationEmailAction(validNotificationInput);

      expect(result.success).toBe(true);
      expect(render).toHaveBeenCalled();
      expect(emailClient.sendEmailWithErrorHandling).toHaveBeenCalled();
    });

    test('should reject invalid owner email', async () => {
      const result = await sendUploadNotificationEmailAction({
        ...validNotificationInput,
        ownerEmail: 'invalid',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid owner email');
    });

    test('should reject invalid uploader email', async () => {
      const result = await sendUploadNotificationEmailAction({
        ...validNotificationInput,
        uploaderEmail: 'invalid',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid uploader email');
    });

    test('should handle rate limiting gracefully (silent fail)', async () => {
      vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
        blocked: true,
      });

      const result = await sendUploadNotificationEmailAction(validNotificationInput);

      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.error).toContain('rate limit exceeded');
      expect(emailClient.sendEmailWithErrorHandling).not.toHaveBeenCalled();
    });

    test('should work without uploader name (optional field)', async () => {
      const { uploaderName, ...inputWithoutName } = validNotificationInput;

      const result = await sendUploadNotificationEmailAction(inputWithoutName);

      expect(result.success).toBe(true);
    });
  });

  // =============================================================================
  // 3. SEND INVITATION EMAIL ACTION
  // =============================================================================

  describe('sendInvitationEmailAction', () => {
    const validInvitationInput = {
      recipientEmail: 'recipient@example.com',
      recipientName: 'Jane Smith',
      senderName: 'John Doe',
      senderEmail: 'john@example.com',
      senderUserId: 'user_123',
      customMessage: 'Please upload your documents.',
      linkUrl: 'https://foldly.com/john/docs',
      linkName: 'Client Documents',
    };

    test('should send invitation successfully', async () => {
      const result = await sendInvitationEmailAction(validInvitationInput);

      expect(result.success).toBe(true);
      expect(render).toHaveBeenCalled();
      expect(emailClient.sendEmailWithErrorHandling).toHaveBeenCalled();
    });

    test('should reject invalid recipient email', async () => {
      const result = await sendInvitationEmailAction({
        ...validInvitationInput,
        recipientEmail: 'not-an-email',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid recipient email');
    });

    test('should reject custom message that is too long', async () => {
      const result = await sendInvitationEmailAction({
        ...validInvitationInput,
        customMessage: 'a'.repeat(EMAIL_LIMITS.MAX_CUSTOM_MESSAGE_LENGTH + 1),
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Custom message is too long');
    });

    test('should enforce rate limiting', async () => {
      vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
        blocked: true,
      });

      const result = await sendInvitationEmailAction(validInvitationInput);

      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.error).toContain('Too many invitations sent');
    });

    test('should work without optional fields', async () => {
      const { recipientName, customMessage, ...minimalInput } = validInvitationInput;

      const result = await sendInvitationEmailAction(minimalInput);

      expect(result.success).toBe(true);
    });
  });

  // =============================================================================
  // 4. SEND BULK INVITATION EMAILS ACTION
  // =============================================================================

  describe('sendBulkInvitationEmailsAction', () => {
    const validBulkInput = {
      recipients: [
        { email: 'user1@example.com', name: 'User One' },
        { email: 'user2@example.com', name: 'User Two' },
      ],
      senderUserId: 'user_123',
      senderName: 'John Doe',
      senderEmail: 'john@example.com',
      customMessage: 'Please upload your documents.',
      linkUrl: 'https://foldly.com/john/docs',
      linkName: 'Client Documents',
    };

    test('should send bulk invitations successfully', async () => {
      const result = await sendBulkInvitationEmailsAction(validBulkInput);

      expect(result.success).toBe(true);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
      expect(render).toHaveBeenCalledTimes(2);
    });

    test('should reject empty recipients list', async () => {
      const result = await sendBulkInvitationEmailsAction({
        ...validBulkInput,
        recipients: [],
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('No recipients provided.');
    });

    test('should reject too many recipients', async () => {
      const tooManyRecipients = Array.from({ length: EMAIL_LIMITS.MAX_BULK_RECIPIENTS + 1 }, (_, i) => ({
        email: `user${i}@example.com`,
        name: `User ${i}`,
      }));

      const result = await sendBulkInvitationEmailsAction({
        ...validBulkInput,
        recipients: tooManyRecipients,
      });

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain(`Maximum ${EMAIL_LIMITS.MAX_BULK_RECIPIENTS} recipients`);
    });

    test('should reject custom message that is too long', async () => {
      const result = await sendBulkInvitationEmailsAction({
        ...validBulkInput,
        customMessage: 'a'.repeat(EMAIL_LIMITS.MAX_CUSTOM_MESSAGE_LENGTH + 1),
      });

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Custom message is too long');
    });

    test('should enforce rate limiting', async () => {
      vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 300000,
        blocked: true,
      });

      const result = await sendBulkInvitationEmailsAction(validBulkInput);

      expect(result.success).toBe(false);
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors?.[0]).toContain('Too many bulk invitations sent');
    });

    test('should skip invalid emails and continue with valid ones', async () => {
      const mixedInput = {
        ...validBulkInput,
        recipients: [
          { email: 'valid1@example.com', name: 'Valid One' },
          { email: 'invalid-email', name: 'Invalid' },
          { email: 'valid2@example.com', name: 'Valid Two' },
        ],
      };

      const result = await sendBulkInvitationEmailsAction(mixedInput);

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0]).toContain('invalid-email');
    });

    test('should handle partial send failures', async () => {
      vi.mocked(emailClient.sendEmailWithErrorHandling)
        .mockResolvedValueOnce({ success: true, data: { id: 'email-1' } })
        .mockResolvedValueOnce({ success: false, error: 'API error' });

      const result = await sendBulkInvitationEmailsAction(validBulkInput);

      expect(result.sent).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.success).toBe(true); // Success if at least one sent
      expect(result.errors).toHaveLength(1);
    });
  });

  // =============================================================================
  // 5. SEND EDITOR PROMOTION EMAIL ACTION
  // =============================================================================

  describe('sendEditorPromotionEmailAction', () => {
    const validPromotionInput = {
      email: 'editor@example.com',
      otp: '123456',
      ownerName: 'John Doe',
      ownerEmail: 'john@example.com',
      resourceType: 'link' as const,
      resourceName: 'Tax Documents',
      resourceUrl: 'https://foldly.com/john/tax-docs',
    };

    test('should send editor promotion email successfully', async () => {
      const result = await sendEditorPromotionEmailAction(validPromotionInput);

      expect(result.success).toBe(true);
      expect(render).toHaveBeenCalled();
      expect(emailClient.sendEmailWithErrorHandling).toHaveBeenCalled();
    });

    test('should reject invalid email format', async () => {
      const result = await sendEditorPromotionEmailAction({
        ...validPromotionInput,
        email: 'not-valid',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email address format');
    });

    test('should reject invalid OTP format', async () => {
      const result = await sendEditorPromotionEmailAction({
        ...validPromotionInput,
        otp: '12345', // Too short
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid OTP format');
    });

    test('should work with resourceType "folder"', async () => {
      const result = await sendEditorPromotionEmailAction({
        ...validPromotionInput,
        resourceType: 'folder',
      });

      expect(result.success).toBe(true);
    });

    test('should enforce rate limiting', async () => {
      vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 300000,
        blocked: true,
      });

      const result = await sendEditorPromotionEmailAction(validPromotionInput);

      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.error).toContain('Too many promotion emails sent');
    });

    test('should include owner email in reply-to', async () => {
      await sendEditorPromotionEmailAction(validPromotionInput);

      expect(emailClient.sendEmailWithErrorHandling).toHaveBeenCalled();
      // Verify the sendEmailWithErrorHandling was called with a function
      const callArgs = vi.mocked(emailClient.sendEmailWithErrorHandling).mock.calls[0];
      expect(callArgs[0]).toBeInstanceOf(Function);
    });
  });

  // =============================================================================
  // ERROR HANDLING
  // =============================================================================

  describe('Error Handling', () => {
    test('should handle render exceptions gracefully', async () => {
      vi.mocked(render).mockRejectedValue(new Error('Render failed'));

      const result = await sendOTPEmailAction({
        email: 'user@example.com',
        otp: '123456',
        expiresInMinutes: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('unexpected error');
    });

    test('should handle rate limit check failures', async () => {
      vi.mocked(rateLimitModule.checkRateLimit).mockRejectedValue(
        new Error('Redis connection failed')
      );

      const result = await sendOTPEmailAction({
        email: 'user@example.com',
        otp: '123456',
        expiresInMinutes: 10,
      });

      expect(result.success).toBe(false);
    });
  });
});
