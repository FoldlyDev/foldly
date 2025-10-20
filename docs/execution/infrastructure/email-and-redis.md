# Email Service & Redis Rate Limiting Infrastructure

**Last Updated:** October 13, 2025
**Status:** Phase 1 Complete (Infrastructure Ready)

---

## Overview

This document tracks the **completed implementation** of email service infrastructure and Redis-based distributed rate limiting for Foldly V2. For the full implementation plan, see [`docs/planning/email-service-plan.md`](../../planning/email-service-plan.md).

---

## What Was Implemented

### Phase 1: Email Infrastructure (COMPLETE)

**Status:** ✅ Infrastructure layer ready for Phase 2-4 integration

**Completed Files:**
- `src/lib/email/client.ts` - Resend client configuration with error handling wrapper
- `src/lib/email/types.ts` - TypeScript type definitions (10 types for templates and actions)
- `src/lib/email/constants.ts` - Email addresses, subjects, limits, OTP configuration
- `src/lib/utils/security.ts` - OTP generation utilities (`generateSecureOTP()`, validation, expiration)

**Key Features:**
1. **Resend Client** (`resend`)
   - Singleton instance with environment validation
   - Error handling wrapper: `sendEmailWithErrorHandling()`
   - Returns structured `EmailSendResult` type

2. **Type System** (10 types)
   - Template props: `OTPVerificationEmailProps`, `UploadNotificationEmailProps`, etc.
   - Action inputs: `SendOTPEmailInput`, `SendInvitationInput`, `SendBulkInvitationInput`
   - Responses: `EmailActionResponse`, `BulkEmailActionResponse`

3. **Configuration Constants**
   - Email addresses: `EMAIL_ADDRESSES.NO_REPLY`, `EMAIL_ADDRESSES.SUPPORT`
   - Sender config: `EMAIL_SENDER.DEFAULT`, `EMAIL_SENDER.SUPPORT`
   - Subjects: `EMAIL_SUBJECTS.OTP_VERIFICATION`, `EMAIL_SUBJECTS.UPLOAD_NOTIFICATION`
   - Limits: `EMAIL_LIMITS.MAX_BULK_RECIPIENTS` (100), `BULK_SEND_DELAY_MS` (100ms)
   - OTP config: `OTP_CONFIG.EXPIRY_MINUTES` (10), `LENGTH` (6)

4. **Security Utilities** (OTP)
   - `generateSecureOTP()` - Cryptographically secure 6-digit codes using `crypto.randomInt()`
   - `isValidOTPFormat(otp)` - Validates 6-digit format
   - `getOTPExpiration(minutes)` - Calculates expiration timestamp
   - `isOTPExpired(expiresAt)` - Checks if OTP expired

---

### Redis Rate Limiting Integration (COMPLETE)

**Status:** ✅ Distributed rate limiting operational

**Completed Files:**
- `src/lib/redis/client.ts` - Upstash Redis client configuration
- `src/lib/middleware/rate-limit.ts` - Migrated from in-memory to distributed Redis

**Migration Summary:**
- **Before:** In-memory Map-based rate limiting (not serverless-safe)
- **After:** Upstash Redis with sliding window algorithm (distributed across Vercel instances)

**Key Features:**

1. **Redis Client** (`redis`)
   - Upstash REST API for serverless compatibility
   - Environment validation for `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
   - Health check: `testRedisConnection()`

2. **Rate Limiting Functions**
   - `checkRateLimit(key, config)` - Sliding window algorithm with auto-cleanup (Redis TTL)
   - `resetRateLimit(key)` - Manual reset for testing or admin operations
   - `getRateLimitStatus(key, config)` - Check status without incrementing

3. **Rate Limit Presets**
   ```typescript
   RateLimitPresets.STRICT     // 5/min (username checks, OTP)
   RateLimitPresets.MODERATE   // 20/min (invitations)
   RateLimitPresets.GENEROUS   // 100/min (general API)
   RateLimitPresets.FILE_UPLOAD // 10/5min (file uploads)
   ```

4. **Email-Specific Rate Limit Keys**
   ```typescript
   RateLimitKeys.otpEmail(email)          // For OTP sending
   RateLimitKeys.emailNotification(userId) // Upload notifications
   RateLimitKeys.invitation(userId)       // Single invitations
   RateLimitKeys.bulkInvitation(userId)   // Bulk invitations
   ```

**Why Redis?**
- **Serverless-Safe:** Works across multiple Vercel Edge instances (no shared memory)
- **Distributed:** Rate limits apply globally, not per-instance
- **Auto-Cleanup:** Redis TTL handles expiration (no manual cleanup needed)
- **Sliding Window:** More accurate than fixed window algorithm

---

## Architecture Integration

### Three-Layer Pattern (Email Service)

```
CLIENT COMPONENT  →  REACT QUERY HOOK  →  SERVER ACTION  →  EMAIL UTILITIES
(UI)                 (src/hooks/data/)     (src/lib/actions/)  (src/lib/email/)
                          ↓                        ↓                    ↓
                   useSendOTPEmail()     sendOTPEmailAction()    resend.emails.send()
                                              ↓
                                    checkRateLimit() (Redis)
```

**When Phase 2-4 are complete:**
1. Component calls hook: `const { mutate } = useSendOTPEmail();`
2. Hook wraps action with React Query (handles loading/error states)
3. Action validates inputs, checks rate limits, sends email via Resend
4. Returns structured response: `{ success: boolean, error?: string, blocked?: boolean }`

### Rate Limiting in Server Actions

**Standard Pattern:**
```typescript
export async function sendOTPEmailAction(data: SendOTPEmailInput) {
  // 1. Validate input
  const email = sanitizeEmail(data.email);
  if (!email) return { success: false, error: 'Invalid email' };

  // 2. Check rate limit (Redis-backed)
  const rateLimit = await checkRateLimit(
    RateLimitKeys.otpEmail(email),
    RateLimitPresets.STRICT
  );

  if (!rateLimit.allowed) {
    return {
      success: false,
      blocked: true,
      resetAt: rateLimit.resetAt
    };
  }

  // 3. Send email via Resend
  const result = await sendEmailWithErrorHandling(async () => {
    return await resend.emails.send({ /* ... */ });
  });

  return result;
}
```

---

## Environment Variables Required

Add to `.env.local`:

```bash
# ============================================
# EMAIL SERVICE (RESEND)
# ============================================
# Get API key from: https://resend.com/api-keys
RESEND_API_KEY=re_...

# ============================================
# DISTRIBUTED RATE LIMITING (UPSTASH REDIS)
# ============================================
# Get credentials from: https://console.upstash.com/
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

**Setup Instructions:**
1. **Resend:** Create account → Create API key → Add to `.env.local`
2. **Upstash:** Create database → Copy REST URL + Token → Add to `.env.local`

---

## File Locations Reference

### Email Infrastructure
```
src/lib/email/
├── client.ts              # Resend singleton + error handler
├── types.ts               # TypeScript types (10 types)
└── constants.ts           # Email config, subjects, limits, OTP
```

### Redis Rate Limiting
```
src/lib/redis/
└── client.ts              # Upstash Redis singleton + health check

src/lib/middleware/
└── rate-limit.ts          # Distributed rate limiting with presets
```

### Security Utilities (OTP)
```
src/lib/utils/
└── security.ts            # OTP generation, validation, expiration
```

---

## Next Steps (Phases 2-4)

**Remaining Implementation** (see [email-service-plan.md](../../planning/email-service-plan.md)):

1. **Phase 2:** React Email templates (4 templates)
   - `src/components/email/templates/otp-verification-template.tsx`
   - `src/components/email/templates/upload-notification-template.tsx`
   - `src/components/email/templates/invitation-template.tsx`
   - `src/components/email/templates/editor-promotion-template.tsx`

2. **Phase 3:** Server actions (5 actions)
   - `src/lib/actions/email.actions.ts`
   - Integrate Phase 1 utilities (client, types, rate limiting)

3. **Phase 4:** React Query hooks (5 hooks)
   - `src/hooks/data/use-email.ts`
   - Wrap Phase 3 actions with `useMutation`

**Dependencies to Install:**
```bash
npm install @react-email/components
```

---

## Testing

**Manual Testing (After Phase 2-4):**
```typescript
// Test OTP generation
import { generateSecureOTP } from '@/lib/utils/security';
const otp = generateSecureOTP(); // "456789"

// Test Redis connection
import { testRedisConnection } from '@/lib/redis/client';
await testRedisConnection(); // Returns true if connected

// Test rate limiting
import { checkRateLimit, RateLimitKeys, RateLimitPresets } from '@/lib/middleware/rate-limit';
const result = await checkRateLimit(
  RateLimitKeys.otpEmail('test@example.com'),
  RateLimitPresets.STRICT
);
console.log(result); // { allowed: true, remaining: 4, resetAt: ..., blocked: false }
```

---

## Security Considerations

### OTP Security
- **Generation:** Uses `crypto.randomInt()` (not `Math.random()`)
- **Format:** Exactly 6 digits (100000-999999)
- **Expiration:** 10 minutes (configurable via `OTP_CONFIG.EXPIRY_MINUTES`)
- **Storage:** Store with expiration timestamp in database (implementation pending)
- **Optional:** Hash OTP before storing (extra security layer)

### Rate Limiting Protection
- **Per-Email OTP Sending:** 5 per minute (blocks for 5 minutes if exceeded)
- **Per-User Invitations:** 20 per minute (blocks for 1 minute)
- **Bulk Invitations:** Separate rate limit key + delay between sends
- **Logging:** All rate limit violations logged for security monitoring

### Email Validation
- Uses existing `sanitizeEmail()` from `security.ts` (RFC 5322 format)
- Rejects invalid formats before sending
- Prevents email injection attacks

---

## Performance Notes

### Resend Client
- Singleton pattern (one instance per process)
- Non-blocking email sends (async by default)
- Error handling prevents API errors from crashing app

### Redis Operations
- TTL auto-cleanup (no manual expiration needed)
- REST API optimized for serverless (no persistent connections)
- Sliding window algorithm: O(n) where n = attempts in window (typically < 100)

---

## Related Documentation

- **Planning:** [`docs/planning/email-service-plan.md`](../../planning/email-service-plan.md) - Full implementation plan
- **Project Overview:** [`CLAUDE.md`](../../../CLAUDE.md) - Three-layer architecture pattern
- **PRD:** [`docs/prd/03-global-actions-hooks.md`](../../prd/03-global-actions-hooks.md) - Global actions pattern
- **MVP Features:** [`docs/planning/features/mvp-features.md`](../../planning/features/mvp-features.md) - Email notification requirements

---

## Summary

**Phase 1 Status:** ✅ Complete

**What's Ready:**
- Resend email client with error handling
- TypeScript type system (10 types)
- Email configuration constants
- OTP generation and validation utilities
- Distributed Redis rate limiting (replacing in-memory)
- Email-specific rate limit keys and presets

**What's Next:**
- Phase 2: Build 4 React Email templates
- Phase 3: Implement 5 server actions (integrate Phase 1 utilities)
- Phase 4: Create 5 React Query hooks (wrap Phase 3 actions)

**Environment Setup:**
- Add `RESEND_API_KEY` to `.env.local`
- Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `.env.local`

**Architecture Impact:**
- Email service follows three-layer pattern (Components → Hooks → Actions → Utilities)
- Rate limiting now distributed across serverless instances (no more in-memory Map)
- All email operations protected by Redis-backed rate limiting
