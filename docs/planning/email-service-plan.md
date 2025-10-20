# Email Service Implementation Plan

**Created:** October 13, 2025
**Status:** ✅ Phases 1-4 Complete - Ready for Integration
**Priority:** High (Required for OTP verification, upload notifications, invitations)

---

## Overview

Global email service infrastructure using Resend + React Email, following Foldly's three-layer architecture pattern.

---

## Three-Layer Architecture

```
CLIENT COMPONENT  →  REACT QUERY HOOK  →  SERVER ACTION  →  RESEND CLIENT
(UI)                 (src/hooks/data/)     (src/lib/actions/)  (src/lib/email/)
```

**Example Flow:**
```typescript
// 1. Component calls hook
const { mutate: sendOTP } = useSendOTPEmail();
sendOTP({ email: 'user@example.com', otp: '123456' });

// 2. Hook wraps action with React Query
const { mutate, isLoading } = useMutation({
  mutationFn: (data) => sendOTPEmailAction(data)
});

// 3. Action handles business logic + sends email
export async function sendOTPEmailAction(data) {
  await resend.emails.send({
    from: 'Foldly <noreply@foldly.com>',
    to: data.email,
    subject: 'Your OTP Code',
    react: OTPVerificationEmail({ otp: data.otp })
  });
}

// 4. Resend client sends email
```

---

## Directory Structure

```
src/
├── lib/
│   ├── email/
│   │   ├── client.ts              # Resend client configuration
│   │   ├── types.ts               # Email-related TypeScript types
│   │   ├── utils.ts               # Email validation, formatting utilities
│   │   └── constants.ts           # Email sender addresses, rate limits
│   │
│   └── actions/
│       └── email.actions.ts       # Global email sending actions
│
├── components/
│   └── email/
│       ├── templates/              # React Email templates (sent via email)
│       │   ├── otp-verification-template.tsx
│       │   ├── upload-notification-template.tsx
│       │   ├── invitation-template.tsx
│       │   ├── editor-promotion-template.tsx
│       │   └── index.ts
│       └── ui/                     # Email-related UI components (in-app)
│           ├── OTPVerificationModal.tsx  # Placeholder until modal system ready
│           └── index.ts
│
└── hooks/
    └── data/
        └── use-email.ts            # React Query hooks for email operations
```

---

## Implementation Checklist

### Phase 1: Infrastructure Setup ✅ COMPLETE

**1. Email Client Configuration** (`src/lib/email/client.ts`)
- ✅ Import and configure Resend client
- ✅ Add error handling wrapper (`sendEmailWithErrorHandling()`)
- ✅ Export singleton instance (`resend`)
- ✅ Add TypeScript types (`EmailSendResult`)

**2. Email Types** (`src/lib/email/types.ts`)
- ✅ Define email template types (4 template prop types)
- ✅ Define email payload interfaces (5 action input types)
- ✅ Define email response types (`EmailActionResponse`, `BulkEmailActionResponse`)
- ✅ Export all types (10 total types)

**3. Email Constants** (`src/lib/email/constants.ts`)
- ✅ Define sender addresses (`EMAIL_ADDRESSES`, `EMAIL_SENDER`)
- ✅ Define email subjects (`EMAIL_SUBJECTS`)
- ✅ Define email rate limit keys (added to `RateLimitKeys` in `@/lib/middleware/rate-limit`)
- ✅ Define email categories and limits (`EMAIL_LIMITS`, `OTP_CONFIG`)

**4. OTP Generation Utility** (`src/lib/utils/security.ts`)
- ✅ Add `generateSecureOTP()` function using Node.js built-in `crypto.randomInt(100000, 999999)`
- ✅ Generate cryptographically secure 6-digit OTP
- ✅ Add OTP expiration utilities: `getOTPExpiration()`, `isOTPExpired()`
- ✅ Add OTP validation: `isValidOTPFormat()`
- ✅ Export all OTP utility functions

**5. Redis Rate Limiting Integration** ✅ BONUS (Not in original plan)
- ✅ Migrated rate limiting from in-memory to distributed Redis (`src/lib/redis/client.ts`)
- ✅ Upstash Redis client configured for serverless environments
- ✅ Added email-specific rate limit keys to `RateLimitKeys` helper
- ✅ Health check function: `testRedisConnection()`

**Note:** Email validation and sanitization already exist in `src/lib/utils/security.ts` (`sanitizeEmail()`, email regex)

**Implementation Documentation:** See [`docs/execution/infrastructure/email-and-redis.md`](../../execution/infrastructure/email-and-redis.md) for completed infrastructure details.

---

### Phase 2: React Email Templates ✅ COMPLETE

**Location:** `src/components/email/` (flat structure)

**Templates Created (sent via email):**

1. **Email Body Layout** (`email-body-layout.tsx`)
   - ✅ Shared layout wrapper with Foldly branding
   - ✅ Header with "Foldly" logo text
   - ✅ Footer with copyright and navigation links
   - ✅ Responsive container (max-width: 600px)

2. **Welcome Email** (`welcome-email-template.tsx`) ✅ BONUS
   - ✅ Warm greeting with personalized name
   - ✅ Feature highlights (4 bullet points)
   - ✅ Dashboard CTA button
   - ✅ Friendly team signature
   - ✅ Props: `{ firstName?: string, username: string }`

3. **OTP Verification Email** (`otp-verification-email-template.tsx`)
   - ✅ Large, centered OTP code display (48px, monospace)
   - ✅ Dashed border styling for visual emphasis
   - ✅ Expiration warning ("Valid for X minutes")
   - ✅ Security reminders (3 bullet points)
   - ✅ Props: `{ otp: string, expiresInMinutes: number }`

4. **Upload Notification Email** (`upload-notification-email-template.tsx`)
   - ✅ File upload summary with uploader details
   - ✅ Details box with file name, uploader info, link name
   - ✅ Dashboard CTA button
   - ✅ Notification settings footer note
   - ✅ Props: `{ uploaderName?: string, uploaderEmail: string, fileName: string, linkName: string, linkUrl: string }`

5. **Invitation Email** (`invitation-email-template.tsx`)
   - ✅ Personalized greeting
   - ✅ Optional custom message box
   - ✅ Upload link CTA button
   - ✅ 3-step instructions
   - ✅ Props: `{ inviterName: string, inviterEmail: string, linkName: string, linkUrl: string, message?: string }`

6. **Editor Promotion Email** (`editor-promotion-email-template.tsx`)
   - ✅ Promotion announcement
   - ✅ Green-highlighted permissions box (5 permissions listed)
   - ✅ Email verification note (no account required)
   - ✅ Supports both link and folder resources
   - ✅ Props: `{ ownerName: string, ownerEmail: string, resourceType: 'link' | 'folder', resourceName: string, resourceUrl: string }`

**Component Exports** (`src/components/email/index.ts`):
- ✅ All templates and props exported centrally

---

### Phase 3: Server Actions ✅ COMPLETE

**Location:** `src/lib/actions/email.actions.ts`

**Actions Implemented:**

1. **sendOTPEmailAction** ✅
   - ✅ Email validation with `sanitizeEmail()`
   - ✅ OTP format validation (6 digits)
   - ✅ Rate limiting (5 per minute - STRICT preset)
   - ✅ Template rendering with `@react-email/render`
   - ✅ Resend integration with error handling
   - ✅ Returns `{ success, error?, blocked?, resetAt? }`

2. **sendUploadNotificationEmailAction** ✅
   - ✅ Owner and uploader email validation
   - ✅ Rate limiting (20 per minute - MODERATE preset)
   - ✅ Silent failure mode (doesn't block uploads)
   - ✅ Optional uploader name support
   - ✅ Complete error handling

3. **sendInvitationEmailAction** ✅
   - ✅ Recipient email validation
   - ✅ Custom message length validation (max 500 chars)
   - ✅ Rate limiting per sender (20 per minute)
   - ✅ Optional fields (recipientName, customMessage)
   - ✅ Reply-to support

4. **sendBulkInvitationEmailsAction** ✅
   - ✅ Max 100 recipients enforcement
   - ✅ Individual email validation
   - ✅ Rate limiting (5 bulk sends per minute - STRICT)
   - ✅ 100ms delay between sends
   - ✅ Detailed results: `{ success, sent, failed, errors[] }`
   - ✅ Continues on individual failures

5. **sendEditorPromotionEmailAction** ✅
   - ✅ Email and OTP format validation
   - ✅ Rate limiting (5 per minute - STRICT)
   - ✅ Supports link/folder resource types
   - ✅ Owner email in reply-to
   - ✅ Complete error handling

**Rate Limiting Implementation:**
- ✅ `RateLimitKeys.otpEmail(email)` - OTP emails
- ✅ `RateLimitKeys.emailNotification(userId)` - Upload notifications
- ✅ `RateLimitKeys.invitation(userId)` - Single invitations
- ✅ `RateLimitKeys.bulkInvitation(userId)` - Bulk invitations
- ✅ STRICT preset: 5/min, 5min block
- ✅ MODERATE preset: 20/min, 1min block

**Testing:**
- ✅ 32 comprehensive unit tests
- ✅ All actions tested (validation, rate limiting, errors)
- ✅ Mock Resend client and Redis
- ✅ 100% test coverage for happy/sad paths

---

### Phase 4: React Query Hooks ✅ COMPLETE

**Location:** `src/hooks/data/use-email.ts`

**Hooks Implemented:**

1. **useSendOTPEmail** ✅
   - ✅ Wraps `sendOTPEmailAction` with `useMutation`
   - ✅ Success toast: "Verification code sent! Check your email."
   - ✅ Error toast: "Failed to send verification code."
   - ✅ Rate limit toast: "Too many attempts. Please try again later."
   - ✅ No retry on failure

2. **useSendUploadNotification** ✅
   - ✅ Wraps `sendUploadNotificationEmailAction`
   - ✅ Silent operation (no toasts)
   - ✅ Background execution for non-blocking uploads
   - ✅ No retry on failure

3. **useSendInvitation** ✅
   - ✅ Wraps `sendInvitationEmailAction`
   - ✅ Success toast: "Invitation sent successfully!"
   - ✅ Error toast: "Failed to send invitation."
   - ✅ Rate limit handling
   - ✅ No retry on failure

4. **useSendBulkInvitations** ✅
   - ✅ Wraps `sendBulkInvitationEmailsAction`
   - ✅ Detailed success toast with sent/failed counts
   - ✅ Shows first 3 errors in error toast
   - ✅ Partial success handling
   - ✅ No retry on failure

5. **useSendEditorPromotion** ✅
   - ✅ Wraps `sendEditorPromotionEmailAction`
   - ✅ Success toast: "Editor promotion email sent!"
   - ✅ Error toast: "Failed to send promotion email."
   - ✅ Rate limit handling
   - ✅ No retry on failure

**Exports & Integration:**
- ✅ All hooks exported from `src/hooks/data/use-email.ts`
- ✅ Re-exported from `src/hooks/data/index.ts`
- ✅ Available globally via `import { useSendOTPEmail } from '@/hooks'`

**Important Note:**
- ⚠️ Toast notifications are **temporary** until internal notifications module is complete
- ⚠️ Toasts will be replaced with proper notification system
- ⚠️ Comment added in file documenting temporary nature

---

### Phase 5: Environment Variables

**Add to `.env.local`:**
```bash
# Resend API Key
RESEND_API_KEY=re_...

# Email Configuration
RESEND_FROM_EMAIL=noreply@foldly.com
RESEND_FROM_NAME=Foldly
RESEND_REPLY_TO=support@foldly.com
```

**Add to `.env.example`:**
- [ ] Document all email environment variables
- [ ] Add setup instructions

---

## Usage Examples

### Example 1: OTP Verification in Permissions Module

```typescript
// src/modules/permissions/components/forms/PromoteToEditorForm.tsx
'use client';

import { useSendEditorPromotion } from '@/hooks/data/use-email';
import { generateSecureOTP } from '@/lib/utils/security';

export function PromoteToEditorForm({ email, linkName }: Props) {
  const { mutate: sendPromotion, isLoading } = useSendEditorPromotion();

  const handlePromote = () => {
    const otp = generateSecureOTP();

    sendPromotion({
      email,
      otp,
      linkName,
      ownerName: currentUser.name
    });
  };

  return (
    <button onClick={handlePromote} disabled={isLoading}>
      {isLoading ? 'Sending...' : 'Promote to Editor'}
    </button>
  );
}
```

### Example 2: Upload Notification in Uploads Module

```typescript
// src/modules/uploads/lib/actions/file-upload.actions.ts
'use server';

import { sendUploadNotificationEmailAction } from '@/lib/actions/email.actions';

export async function handleFileUploadAction(data: FileUploadData) {
  // ... file upload logic

  // Send notification to workspace owner
  await sendUploadNotificationEmailAction({
    ownerEmail: workspace.user.email,
    uploaderEmail: data.email,
    uploaderName: data.name,
    fileName: data.filename,
    linkName: link.name,
    linkUrl: `https://foldly.com/${workspace.user.username}/${link.slug}`
  });

  return { success: true };
}
```

### Example 3: Bulk Invitations in Links Module

```typescript
// src/modules/links/components/forms/InviteUsersForm.tsx
'use client';

import { useSendBulkInvitations } from '@/hooks/data/use-email';

export function InviteUsersForm({ linkUrl, linkName }: Props) {
  const { mutate: sendInvitations, isLoading } = useSendBulkInvitations();

  const handleSend = (emails: string[], message?: string) => {
    sendInvitations({
      recipients: emails.map(email => ({ email })),
      senderName: currentUser.name,
      customMessage: message,
      linkUrl,
      linkName
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send Invitations'}
      </button>
    </form>
  );
}
```

---

## Testing Checklist

- [ ] Unit tests for email utilities (validation, formatting)
- [ ] Test email template rendering (React Email)
- [ ] Test server actions (mock Resend client)
- [ ] Test hooks (React Query mocking)
- [ ] Integration test: Full email send flow
- [ ] Test error handling (invalid emails, API failures)
- [ ] Test rate limiting
- [ ] Manual test: Send real emails in development

---

## Error Handling Strategy

**Email Validation Errors:**
- Validate at action level before sending
- Return `{ success: false, error: 'Invalid email format' }`

**Resend API Errors:**
- Catch and log errors
- Return user-friendly error messages
- Don't expose API error details to client

**Rate Limiting Errors:**
- Use existing `checkRateLimit()` from `@/lib/middleware/rate-limit`
- If rate limit exceeded, return `{ success: false, blocked: true, resetAt: timestamp }`
- Show user-friendly message: "Too many attempts. Please try again in X minutes."
- Log rate limit violations for security monitoring

---

## Security Considerations

1. **Email Validation:**
   - Validate email format (RFC 5322)
   - Sanitize email content to prevent injection
   - Rate limit email sending per user

2. **Sensitive Data:**
   - Never log full email content
   - Don't expose Resend API errors to client
   - Mask recipient emails in logs

3. **OTP Generation & Security:**
   - Use Node.js `crypto.randomInt()` for secure OTP generation (NOT bcrypt)
   - Generate 6-digit OTPs (100000-999999 range)
   - Store OTP with expiration timestamp in database (10 minutes)
   - Rate limit OTP generation and sending per email (use existing `checkRateLimit()`)
   - Optional: Hash OTP before storing in database for extra security

4. **Bulk Emails:**
   - Limit recipients per bulk send (e.g., 100 max)
   - Implement cooldown period between bulk sends
   - Log bulk send attempts for monitoring

---

## Performance Considerations

1. **Async Email Sending:**
   - All email sends are non-blocking
   - Don't wait for email delivery to return response
   - Use background jobs for bulk emails (future enhancement)

2. **Template Rendering:**
   - React Email templates render server-side
   - Cache rendered templates when possible
   - Optimize template size (images, inline CSS)

3. **Rate Limiting:**
   - Respect Resend rate limits
   - Implement client-side rate limiting
   - Queue emails if needed

---

## Future Enhancements (Post-MVP)

- [ ] Email queue system (BullMQ or similar)
- [ ] Email delivery tracking (opened, clicked)
- [ ] A/B testing for email templates
- [ ] Email preference center (unsubscribe management)
- [ ] Email analytics dashboard
- [ ] Transactional email templates (welcome, password reset)
- [ ] Email scheduling (send at specific time)
- [ ] Email bounce handling

---

## Dependencies

**Current:**
- `resend` (^6.1.2) ✅ Installed
- `@react-email/render` (^1.3.2) ✅ Installed

**To Install:**
```bash
npm install @react-email/components
```

---

## Related Documentation

- [MVP Features](../features/mvp-features.md) - Email notification requirements
- [PRD: Global Actions & Hooks](../../prd/03-global-actions-hooks.md) - Three-layer architecture
- [Finalized Decisions](../decisions/finalized-decisions.md) - Email invitation features
- [Resend Documentation](https://resend.com/docs) - API reference
- [React Email Documentation](https://react.email/docs) - Template building

---

**Next Steps:**
1. Review and approve this plan
2. Set up environment variables
3. Implement Phase 1 (Infrastructure)
4. Build email templates (Phase 2)
5. Create server actions (Phase 3)
6. Wrap with hooks (Phase 4)
7. Test end-to-end flow
