# Email Service Implementation Plan

**Created:** October 13, 2025
**Status:** 🚧 Planning Phase
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

### Phase 1: Infrastructure Setup

**1. Email Client Configuration** (`src/lib/email/client.ts`)
- [ ] Import and configure Resend client
- [ ] Add error handling wrapper
- [ ] Export singleton instance
- [ ] Add TypeScript types

**2. Email Types** (`src/lib/email/types.ts`)
- [ ] Define email template types
- [ ] Define email payload interfaces
- [ ] Define email response types
- [ ] Export all types

**3. Email Constants** (`src/lib/email/constants.ts`)
- [ ] Define sender addresses (from/reply-to)
- [ ] Define email subjects
- [ ] Define email rate limit keys (use `RateLimitKeys` helper from `@/lib/middleware/rate-limit`)
- [ ] Define email categories

**4. OTP Generation Utility** (`src/lib/utils/security.ts`)
- [ ] Add `generateSecureOTP()` function using Node.js built-in `crypto.randomInt(100000, 999999)`
- [ ] Generate cryptographically secure 6-digit OTP (NOT using bcrypt - bcrypt is for password hashing)
- [ ] Add OTP expiration time constant: `OTP_EXPIRY_MINUTES = 10`
- [ ] Export OTP utility functions
- [ ] Optional: Add `hashOTP()` function if storing OTPs in database (for extra security)

**Note:** Email validation and sanitization already exist in `src/lib/utils/security.ts` (`sanitizeEmail()`, email regex)

---

### Phase 2: React Email Templates

**Location:** `src/components/email/templates/`

**Templates Needed (sent via email):**

1. **OTP Verification Email** (`otp-verification-template.tsx`)
   - [ ] Layout with branding
   - [ ] OTP code display (large, centered)
   - [ ] Expiration warning (e.g., "Valid for 10 minutes")
   - [ ] Security disclaimer ("Never share this code")
   - [ ] Props: `{ otp: string, expiresInMinutes: number }`

2. **Upload Notification Email** (`upload-notification-template.tsx`)
   - [ ] File upload summary
   - [ ] Uploader details (name, email)
   - [ ] Link to view files
   - [ ] Folder/link name
   - [ ] Props: `{ uploaderName?: string, uploaderEmail: string, fileName: string, linkName: string, linkUrl: string }`

3. **Invitation Email** (`invitation-template.tsx`)
   - [ ] Personalized greeting
   - [ ] Custom message from sender (if provided)
   - [ ] Upload link button (CTA)
   - [ ] Instructions
   - [ ] Props: `{ recipientName?: string, senderName: string, customMessage?: string, linkUrl: string, linkName: string }`

4. **Editor Promotion Email** (`editor-promotion-template.tsx`)
   - [ ] Promotion announcement
   - [ ] OTP verification prompt
   - [ ] New permissions explanation
   - [ ] Link to verify (placeholder until modal components ready)
   - [ ] Props: `{ email: string, otp: string, linkName: string, ownerName: string }`

**Template Shared Components:**
- [ ] Email layout wrapper (header, footer, branding)
- [ ] Button component
- [ ] Section divider
- [ ] Text styles (heading, paragraph, muted)

**UI Components** (`src/components/email/ui/`):
- [ ] **OTPVerificationModal.tsx** - Placeholder for OTP input modal (to be implemented after reusable modal components are ready)
  - Props: `{ isOpen: boolean, onClose: () => void, onVerify: (otp: string) => void, email: string }`
  - Note: Leave as placeholder component that returns `null` until modal system is ready

---

### Phase 3: Server Actions

**Location:** `src/lib/actions/email.actions.ts`

**Actions to Implement:**

1. **sendOTPEmailAction**
   ```typescript
   export async function sendOTPEmailAction(data: {
     email: string;
     otp: string;
     expiresInMinutes: number;
   }): Promise<{ success: boolean; error?: string }>
   ```
   - [ ] Validate email format (use `sanitizeEmail()` from `@/lib/utils/security`)
   - [ ] Validate OTP format (6 digits)
   - [ ] Apply rate limiting (use `checkRateLimit()` with `RateLimitKeys.otpEmail(email)`)
   - [ ] Render OTPVerificationEmail template
   - [ ] Send via Resend
   - [ ] Handle errors
   - [ ] Return success/error response

2. **sendUploadNotificationEmailAction**
   ```typescript
   export async function sendUploadNotificationEmailAction(data: {
     ownerEmail: string;
     uploaderEmail: string;
     uploaderName?: string;
     fileName: string;
     linkName: string;
     linkUrl: string;
   }): Promise<{ success: boolean; error?: string }>
   ```
   - [ ] Validate emails (use `sanitizeEmail()`)
   - [ ] Apply rate limiting (use `RateLimitKeys.emailNotification(ownerEmail)`)
   - [ ] Render UploadNotificationEmail template
   - [ ] Send via Resend
   - [ ] Handle errors
   - [ ] Return success/error response

3. **sendInvitationEmailAction**
   ```typescript
   export async function sendInvitationEmailAction(data: {
     recipientEmail: string;
     recipientName?: string;
     senderName: string;
     customMessage?: string;
     linkUrl: string;
     linkName: string;
   }): Promise<{ success: boolean; error?: string }>
   ```
   - [ ] Validate emails (use `sanitizeEmail()`)
   - [ ] Apply rate limiting (use `RateLimitKeys.invitation(senderUserId)`)
   - [ ] Render InvitationEmail template
   - [ ] Send via Resend
   - [ ] Handle errors
   - [ ] Return success/error response

4. **sendBulkInvitationEmailsAction** (for bulk invites)
   ```typescript
   export async function sendBulkInvitationEmailsAction(data: {
     recipients: Array<{ email: string; name?: string }>;
     senderUserId: string;
     senderName: string;
     customMessage?: string;
     linkUrl: string;
     linkName: string;
   }): Promise<{ success: boolean; sent: number; failed: number; errors?: string[] }>
   ```
   - [ ] Validate all emails (use `sanitizeEmail()`)
   - [ ] Limit recipients (max 100 per bulk send)
   - [ ] Apply rate limiting (use `checkRateLimit()` with `RateLimitKeys.bulkInvitation(senderUserId)`)
   - [ ] Batch send with delay between emails (respect Resend limits)
   - [ ] Track successes/failures
   - [ ] Return aggregated results

5. **sendEditorPromotionEmailAction**
   ```typescript
   export async function sendEditorPromotionEmailAction(data: {
     email: string;
     otp: string;
     linkName: string;
     ownerName: string;
   }): Promise<{ success: boolean; error?: string }>
   ```
   - [ ] Validate email (use `sanitizeEmail()`)
   - [ ] Validate OTP format (6 digits)
   - [ ] Apply rate limiting (use `checkRateLimit()` with `RateLimitKeys.otpEmail(email)`)
   - [ ] Render EditorPromotionEmail template
   - [ ] Send via Resend
   - [ ] Handle errors
   - [ ] Return success/error response

**Note on Rate Limiting:**
- Use existing `checkRateLimit()` from `@/lib/middleware/rate-limit`
- Use `RateLimitPresets.STRICT` for OTP emails (5 per minute)
- Use `RateLimitPresets.MODERATE` for invitations (20 per minute)
- Add new keys to `RateLimitKeys` helper:
  ```typescript
  otpEmail: (email: string) => `otp-email:${email}`,
  emailNotification: (userId: string) => `email-notify:${userId}`,
  invitation: (userId: string) => `invitation:${userId}`,
  bulkInvitation: (userId: string) => `bulk-invite:${userId}`
  ```

---

### Phase 4: React Query Hooks

**Location:** `src/hooks/data/use-email.ts`

**Hooks to Implement:**

1. **useSendOTPEmail**
   ```typescript
   export function useSendOTPEmail() {
     return useMutation({
       mutationFn: (data: SendOTPEmailInput) => sendOTPEmailAction(data),
       onSuccess: () => { /* toast notification */ },
       onError: () => { /* error toast */ }
     });
   }
   ```
   - [ ] Wrap sendOTPEmailAction with useMutation
   - [ ] Add success toast notification
   - [ ] Add error toast notification
   - [ ] Export hook

2. **useSendUploadNotification**
   ```typescript
   export function useSendUploadNotification() {
     return useMutation({
       mutationFn: sendUploadNotificationEmailAction,
       // No toast - this is automatic/background
     });
   }
   ```
   - [ ] Wrap action with useMutation
   - [ ] Silent operation (no user-facing notifications)
   - [ ] Export hook

3. **useSendInvitation**
   ```typescript
   export function useSendInvitation() {
     return useMutation({
       mutationFn: sendInvitationEmailAction,
       onSuccess: () => { /* toast: "Invitation sent!" */ },
       onError: () => { /* error toast */ }
     });
   }
   ```
   - [ ] Wrap action with useMutation
   - [ ] Add success/error toasts
   - [ ] Export hook

4. **useSendBulkInvitations**
   ```typescript
   export function useSendBulkInvitations() {
     return useMutation({
       mutationFn: sendBulkInvitationEmailsAction,
       onSuccess: (data) => { /* toast: "${data.sent} invitations sent" */ },
       onError: () => { /* error toast */ }
     });
   }
   ```
   - [ ] Wrap action with useMutation
   - [ ] Show detailed results in toast
   - [ ] Export hook

5. **useSendEditorPromotion**
   ```typescript
   export function useSendEditorPromotion() {
     return useMutation({
       mutationFn: sendEditorPromotionEmailAction,
       onSuccess: () => { /* toast: "Promotion email sent" */ },
       onError: () => { /* error toast */ }
     });
   }
   ```
   - [ ] Wrap action with useMutation
   - [ ] Add success/error toasts
   - [ ] Export hook

**Hook Exports** (`src/hooks/data/use-email.ts`):
```typescript
export {
  useSendOTPEmail,
  useSendUploadNotification,
  useSendInvitation,
  useSendBulkInvitations,
  useSendEditorPromotion
};
```

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
