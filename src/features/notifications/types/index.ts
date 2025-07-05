// Notification Types for Foldly - System and Email Notifications
// Feature-specific types for notification and communication functionality
// Following 2025 TypeScript best practices with strict type safety

import type { EmailAddress } from '@/types';

// =============================================================================
// SYSTEM NOTIFICATION TYPES
// =============================================================================

/**
 * Notification types for the system (backend/email notifications)
 */
export const NOTIFICATION_TYPE = {
  UPLOAD_RECEIVED: 'upload_received',
  LINK_CREATED: 'link_created',
  STORAGE_WARNING: 'storage_warning',
  SECURITY_ALERT: 'security_alert',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
} as const satisfies Record<string, string>;

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

/**
 * @deprecated Use NOTIFICATION_TYPE const object instead
 */
export enum NotificationTypeEnum {
  UPLOAD_RECEIVED = 'upload_received',
  LINK_CREATED = 'link_created',
  STORAGE_WARNING = 'storage_warning',
  SECURITY_ALERT = 'security_alert',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
}

// =============================================================================
// EMAIL NOTIFICATION TYPES
// =============================================================================

/**
 * Email template data structure
 */
export interface EmailTemplateData {
  readonly recipientName: string;
  readonly recipientEmail: EmailAddress;
  readonly subject: string;
  readonly templateVariables: Record<string, string | number | boolean>;
}

/**
 * Email notification configuration
 */
export interface EmailNotificationConfig {
  readonly enabled: boolean;
  readonly templateId: string;
  readonly recipientEmail: EmailAddress;
  readonly priority: 'low' | 'normal' | 'high' | 'urgent';
  readonly scheduleDelay?: number; // seconds to delay sending
  readonly retryAttempts?: number;
}

/**
 * Email notification payload
 */
export interface EmailNotification {
  readonly id: string;
  readonly type: NotificationType;
  readonly template: EmailTemplateData;
  readonly config: EmailNotificationConfig;
  readonly status: 'pending' | 'sent' | 'failed' | 'cancelled';
  readonly createdAt: Date;
  readonly sentAt?: Date;
  readonly error?: string;
}

// =============================================================================
// SYSTEM NOTIFICATION PAYLOADS
// =============================================================================

/**
 * Upload received notification payload
 */
export interface UploadReceivedPayload {
  readonly linkId: string;
  readonly uploaderName: string;
  readonly uploaderEmail?: EmailAddress;
  readonly fileCount: number;
  readonly totalSize: number;
  readonly timestamp: Date;
}

/**
 * Link created notification payload
 */
export interface LinkCreatedPayload {
  readonly linkId: string;
  readonly linkTitle: string;
  readonly linkUrl: string;
  readonly createdBy: string;
  readonly timestamp: Date;
}

/**
 * Storage warning notification payload
 */
export interface StorageWarningPayload {
  readonly currentUsage: number; // bytes
  readonly storageLimit: number; // bytes
  readonly usagePercentage: number;
  readonly warningLevel: 'approaching' | 'critical' | 'exceeded';
  readonly timestamp: Date;
}

/**
 * Security alert notification payload
 */
export interface SecurityAlertPayload {
  readonly alertType:
    | 'malware_detected'
    | 'suspicious_activity'
    | 'failed_login_attempts'
    | 'unusual_access_pattern';
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly description: string;
  readonly affectedResource?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly timestamp: Date;
}

/**
 * Payment notification payload
 */
export interface PaymentNotificationPayload {
  readonly paymentId: string;
  readonly amount: number;
  readonly currency: string;
  readonly subscriptionTier: string;
  readonly status: 'success' | 'failed' | 'cancelled';
  readonly timestamp: Date;
  readonly error?: string;
}

// =============================================================================
// NOTIFICATION PREFERENCES
// =============================================================================

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  readonly email: {
    readonly uploadReceived: boolean;
    readonly linkCreated: boolean;
    readonly storageWarning: boolean;
    readonly securityAlert: boolean;
    readonly paymentSuccess: boolean;
    readonly paymentFailed: boolean;
    readonly weeklyDigest: boolean;
  };
  readonly browser: {
    readonly uploadReceived: boolean;
    readonly securityAlert: boolean;
    readonly storageWarning: boolean;
  };
  readonly slack?: {
    readonly enabled: boolean;
    readonly webhookUrl: string;
    readonly uploadReceived: boolean;
    readonly linkCreated: boolean;
  };
}

// =============================================================================
// TYPE GUARDS FOR NOTIFICATIONS
// =============================================================================

/**
 * Type guard for notification types
 */
export const isValidNotificationType = (
  type: unknown
): type is NotificationType => {
  return (
    typeof type === 'string' &&
    Object.values(NOTIFICATION_TYPE).includes(type as NotificationType)
  );
};

// =============================================================================
// EXPORT ALL NOTIFICATION TYPES
// =============================================================================

export type * from './index';
