// =============================================================================
// EMAIL SERVICE CONSTANTS
// =============================================================================
// Configuration constants for email service

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================

/**
 * Validate required environment variables on module initialization
 * Throws error if critical variables are missing
 */
function validateEmailEnvironment(): void {
  const requiredVars = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  const missing: string[] = [];

  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for email service: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }
}

// Run validation on module load
validateEmailEnvironment();

/**
 * Validated application URL for email links
 * @throws Error if NEXT_PUBLIC_APP_URL is not set
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

// =============================================================================
// EMAIL ADDRESSES
// =============================================================================

/**
 * Centralized email address configuration
 * Update these values when transitioning to production or changing email addresses
 */
export const EMAIL_ADDRESSES = {
  /**
   * Primary 'no-reply' address for transactional emails
   * Used for OTP codes, notifications, etc.
   */
  NO_REPLY: 'dev@foldly.com',

  /**
   * Support email address for user inquiries
   * Used as reply-to address in transactional emails
   */
  SUPPORT: 'dev@foldly.com',

  /**
   * Contact/sales email address
   * Can be used for business inquiries
   */
  CONTACT: 'dev@foldly.com',

  /**
   * Security/abuse reporting email
   * For reporting security issues or abuse
   */
  SECURITY: 'dev@foldly.com',
} as const;

// =============================================================================
// SENDER CONFIGURATION
// =============================================================================

/**
 * Email sender configuration
 * Builds formatted email addresses for Resend API
 */
export const EMAIL_SENDER = {
  /**
   * Sender name displayed in email clients
   */
  NAME: 'Foldly',

  /**
   * Default 'from' address (no-reply)
   * @example 'Foldly <dev@foldly.com>'
   */
  get DEFAULT(): string {
    return `${this.NAME} <${EMAIL_ADDRESSES.NO_REPLY}>`;
  },

  /**
   * Support 'from' address
   * @example 'Foldly Support <dev@foldly.com>'
   */
  get SUPPORT(): string {
    return `${this.NAME} Support <${EMAIL_ADDRESSES.SUPPORT}>`;
  },

  /**
   * Default reply-to address
   */
  get REPLY_TO(): string {
    return EMAIL_ADDRESSES.SUPPORT;
  },
} as const;

// =============================================================================
// EMAIL SUBJECTS
// =============================================================================

/**
 * Email subject lines for different email types
 */
export const EMAIL_SUBJECTS = {
  OTP_VERIFICATION: 'Your Verification Code',
  UPLOAD_NOTIFICATION: 'New File Uploaded',
  INVITATION: 'You\'re invited to upload files',
  EDITOR_PROMOTION: 'You\'ve been promoted to Editor',
  WELCOME: 'Welcome to Foldly',
} as const;

// =============================================================================
// EMAIL LIMITS
// =============================================================================

/**
 * Email operation limits and constraints
 */
export const EMAIL_LIMITS = {
  /**
   * Maximum recipients per bulk email send
   */
  MAX_BULK_RECIPIENTS: 100,

  /**
   * Delay between bulk email sends (milliseconds)
   * Helps respect Resend rate limits
   */
  BULK_SEND_DELAY_MS: 100,

  /**
   * Maximum custom message length in invitations
   */
  MAX_CUSTOM_MESSAGE_LENGTH: 500,
} as const;

// =============================================================================
// OTP CONFIGURATION
// =============================================================================

/**
 * OTP (One-Time Password) configuration
 */
export const OTP_CONFIG = {
  /**
   * OTP expiration time in minutes
   */
  EXPIRY_MINUTES: 10,

  /**
   * OTP length (digits)
   */
  LENGTH: 6,

  /**
   * Minimum OTP value (100000)
   */
  MIN_VALUE: 100_000,

  /**
   * Maximum OTP value (999999)
   */
  MAX_VALUE: 999_999,
} as const;
