/**
 * Notification Event Types and Definitions
 * Central registry for all notification events in the application
 */

// =============================================================================
// EVENT CATEGORIES
// =============================================================================

/**
 * Event categories for grouping and filtering
 */
export enum EventCategory {
  WORKSPACE = 'workspace',
  LINK = 'link',
  STORAGE = 'storage',
  AUTH = 'auth',
  BILLING = 'billing',
  SYSTEM = 'system',
}

/**
 * UI types for different notification presentations
 */
export enum NotificationUIType {
  TOAST_SIMPLE = 'toast_simple',        // Simple text toast
  TOAST_INTERACTIVE = 'toast_interactive', // Toast with actions
  BANNER = 'banner',                    // Top/bottom banner
  MODAL = 'modal',                      // Modal dialog
  INLINE = 'inline',                    // Inline notification
  STACKED = 'stacked',                  // Stacked notifications list
  PROGRESS = 'progress',                // Progress indicator
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = 'low',        // Informational, can be missed
  MEDIUM = 'medium',  // Important but not urgent
  HIGH = 'high',      // Important and urgent
  CRITICAL = 'critical', // Requires immediate attention
}

/**
 * Notification channels for multi-channel delivery
 */
export enum NotificationChannel {
  INTERNAL = 'internal',  // In-app notification
  EMAIL = 'email',       // Email notification
  PUSH = 'push',         // Push notification
  SMS = 'sms',           // SMS notification
  WEBHOOK = 'webhook',   // Webhook delivery
}

// =============================================================================
// EVENT TYPE DEFINITIONS
// =============================================================================

/**
 * Comprehensive event type enum following consistent naming pattern:
 * {category}.{resource}.{action}.{status}
 */
export enum NotificationEventType {
  // Workspace Events
  WORKSPACE_FILE_UPLOAD_START = 'workspace.file.upload.start',
  WORKSPACE_FILE_UPLOAD_PROGRESS = 'workspace.file.upload.progress',
  WORKSPACE_FILE_UPLOAD_SUCCESS = 'workspace.file.upload.success',
  WORKSPACE_FILE_UPLOAD_ERROR = 'workspace.file.upload.error',
  WORKSPACE_FILE_DELETE_SUCCESS = 'workspace.file.delete.success',
  WORKSPACE_FILE_DELETE_ERROR = 'workspace.file.delete.error',
  WORKSPACE_FILE_MOVE_SUCCESS = 'workspace.file.move.success',
  WORKSPACE_FILE_RENAME_SUCCESS = 'workspace.file.rename.success',
  
  WORKSPACE_FOLDER_CREATE_SUCCESS = 'workspace.folder.create.success',
  WORKSPACE_FOLDER_CREATE_ERROR = 'workspace.folder.create.error',
  WORKSPACE_FOLDER_DELETE_SUCCESS = 'workspace.folder.delete.success',
  WORKSPACE_FOLDER_DELETE_ERROR = 'workspace.folder.delete.error',
  WORKSPACE_FOLDER_MOVE_SUCCESS = 'workspace.folder.move.success',
  WORKSPACE_FOLDER_RENAME_SUCCESS = 'workspace.folder.rename.success',
  
  WORKSPACE_ITEMS_REORDER_SUCCESS = 'workspace.items.reorder.success',
  WORKSPACE_BATCH_DELETE_START = 'workspace.batch.delete.start',
  WORKSPACE_BATCH_DELETE_PROGRESS = 'workspace.batch.delete.progress',
  WORKSPACE_BATCH_DELETE_SUCCESS = 'workspace.batch.delete.success',
  WORKSPACE_BATCH_DELETE_ERROR = 'workspace.batch.delete.error',
  
  WORKSPACE_FILES_LIMIT_EXCEEDED = 'workspace.files.limit.exceeded',
  WORKSPACE_FOLDER_DROPPED = 'workspace.folder.dropped',
  
  WORKSPACE_BATCH_UPLOAD_START = 'workspace.batch.upload.start',
  WORKSPACE_BATCH_UPLOAD_PROGRESS = 'workspace.batch.upload.progress',
  WORKSPACE_BATCH_UPLOAD_SUCCESS = 'workspace.batch.upload.success',
  WORKSPACE_BATCH_UPLOAD_ERROR = 'workspace.batch.upload.error',
  
  // Link Events
  LINK_CREATE_SUCCESS = 'link.create.success',
  LINK_CREATE_ERROR = 'link.create.error',
  LINK_UPDATE_SUCCESS = 'link.update.success',
  LINK_UPDATE_ERROR = 'link.update.error',
  LINK_DELETE_SUCCESS = 'link.delete.success',
  LINK_DELETE_ERROR = 'link.delete.error',
  LINK_GENERATE_SUCCESS = 'link.generate.success',
  LINK_GENERATE_ERROR = 'link.generate.error',
  LINK_COPY_SUCCESS = 'link.copy.success',
  LINK_NEW_UPLOAD = 'link.upload.new',
  LINK_BATCH_UPLOAD = 'link.upload.batch',
  
  // Storage Events
  STORAGE_THRESHOLD_WARNING = 'storage.threshold.warning',
  STORAGE_THRESHOLD_CRITICAL = 'storage.threshold.critical',
  STORAGE_LIMIT_EXCEEDED = 'storage.limit.exceeded',
  STORAGE_UPLOAD_BLOCKED = 'storage.upload.blocked',
  STORAGE_CLEANUP_SUGGESTED = 'storage.cleanup.suggested',
  
  // Auth Events
  AUTH_SESSION_EXPIRED = 'auth.session.expired',
  AUTH_LOGIN_SUCCESS = 'auth.login.success',
  AUTH_LOGOUT_SUCCESS = 'auth.logout.success',
  
  // Billing Events
  BILLING_SUBSCRIPTION_UPGRADED = 'billing.subscription.upgraded',
  BILLING_SUBSCRIPTION_DOWNGRADED = 'billing.subscription.downgraded',
  BILLING_PAYMENT_FAILED = 'billing.payment.failed',
  BILLING_TRIAL_ENDING = 'billing.trial.ending',
  
  // System Events
  SYSTEM_MAINTENANCE_SCHEDULED = 'system.maintenance.scheduled',
  SYSTEM_UPDATE_AVAILABLE = 'system.update.available',
  SYSTEM_ERROR_NETWORK = 'system.error.network',
  SYSTEM_ERROR_PERMISSION = 'system.error.permission',
  
  // Settings Events
  SETTINGS_UPDATE_SUCCESS = 'settings.update.success',
  SETTINGS_UPDATE_ERROR = 'settings.update.error',
}

// =============================================================================
// EVENT PAYLOAD DEFINITIONS
// =============================================================================

/**
 * Base event metadata that all events share
 */
export interface EventMetadata {
  timestamp: number;
  userId?: string;
  sessionId?: string;
  source?: string; // Component or service that triggered the event
  correlationId?: string; // For tracking related events
  version?: string; // Event schema version
}

/**
 * Base notification configuration
 */
export interface NotificationConfig {
  priority: NotificationPriority;
  uiType: NotificationUIType;
  channels: Partial<Record<NotificationChannel, ChannelConfig>>;
  groupId?: string; // For grouping related notifications
  deduplicationKey?: string; // For preventing duplicates
  persistent?: boolean; // Should notification persist
  duration?: number; // Auto-dismiss duration in ms
  sound?: boolean | string; // Play sound or specific sound file
  vibrate?: boolean; // Mobile vibration
  actions?: NotificationAction[]; // Available actions
}

/**
 * Channel-specific configuration
 */
export interface ChannelConfig {
  enabled: boolean;
  delay?: number; // Delay before sending (for batching)
  template?: string; // Template ID for external channels
  priority?: NotificationPriority; // Override priority for this channel
  metadata?: Record<string, any>; // Channel-specific metadata
}

/**
 * Notification action definition
 */
export interface NotificationAction {
  id: string;
  label: string;
  icon?: string;
  style?: 'primary' | 'secondary' | 'danger';
  handler?: () => void | Promise<void>;
  href?: string; // For navigation actions
}

// =============================================================================
// EVENT PAYLOAD TYPES
// =============================================================================

/**
 * File operation event payload
 */
export interface FileEventPayload {
  fileId: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  parentId?: string;
  workspaceId?: string;
  uploadProgress?: number;
  error?: string;
}

/**
 * Folder operation event payload
 */
export interface FolderEventPayload {
  folderId: string;
  folderName: string;
  parentId?: string;
  workspaceId?: string;
  itemCount?: number;
  error?: string;
}

/**
 * Batch operation event payload
 */
export interface BatchEventPayload {
  batchId: string;
  totalItems: number;
  completedItems: number;
  failedItems?: number;
  currentItem?: string;
  items?: Array<{ id: string; name: string; type: 'file' | 'folder' }>;
  error?: string;
}

/**
 * File limit exceeded event payload
 */
export interface FileLimitEventPayload {
  attemptedCount: number;
  maxAllowed: number;
  currentCount?: number;
  message?: string;
}

/**
 * Folder drop event payload  
 */
export interface FolderDropEventPayload {
  fileCount: number;
  folderCount?: number;
  message: string;
}

/**
 * Link operation event payload
 */
export interface LinkEventPayload {
  linkId: string;
  linkTitle: string;
  linkUrl?: string;
  linkType?: 'base' | 'custom' | 'generated';
  folderName?: string; // For generated links
  uploaderName?: string; // For upload notifications
  fileCount?: number;
  folderCount?: number;
  error?: string;
}

/**
 * Storage event payload
 */
export interface StorageEventPayload {
  currentUsage: number;
  totalLimit: number;
  remainingSpace: number;
  usagePercentage: number;
  planKey: string;
  filesCount?: number;
  threshold?: number;
  message?: string;
}

/**
 * Auth event payload
 */
export interface AuthEventPayload {
  userId?: string;
  email?: string;
  action?: string;
  reason?: string;
}

/**
 * Billing event payload
 */
export interface BillingEventPayload {
  planKey: string;
  previousPlan?: string;
  amount?: number;
  currency?: string;
  daysRemaining?: number;
  error?: string;
}

/**
 * System event payload
 */
export interface SystemEventPayload {
  message: string;
  severity?: 'info' | 'warning' | 'error';
  scheduledAt?: Date;
  affectedServices?: string[];
  error?: string;
}

export interface SettingsEventPayload {
  setting: string;
  value: any;
  message?: string;
  error?: string;
}

// =============================================================================
// MAIN EVENT TYPE
// =============================================================================

/**
 * Map of event types to their payload types
 */
export interface EventPayloadMap {
  // Workspace events
  [NotificationEventType.WORKSPACE_FILE_UPLOAD_START]: FileEventPayload;
  [NotificationEventType.WORKSPACE_FILE_UPLOAD_PROGRESS]: FileEventPayload;
  [NotificationEventType.WORKSPACE_FILE_UPLOAD_SUCCESS]: FileEventPayload;
  [NotificationEventType.WORKSPACE_FILE_UPLOAD_ERROR]: FileEventPayload;
  [NotificationEventType.WORKSPACE_FILE_DELETE_SUCCESS]: FileEventPayload;
  [NotificationEventType.WORKSPACE_FILE_DELETE_ERROR]: FileEventPayload;
  [NotificationEventType.WORKSPACE_FILE_MOVE_SUCCESS]: FileEventPayload;
  [NotificationEventType.WORKSPACE_FILE_RENAME_SUCCESS]: FileEventPayload;
  
  [NotificationEventType.WORKSPACE_FOLDER_CREATE_SUCCESS]: FolderEventPayload;
  [NotificationEventType.WORKSPACE_FOLDER_CREATE_ERROR]: FolderEventPayload;
  [NotificationEventType.WORKSPACE_FOLDER_DELETE_SUCCESS]: FolderEventPayload;
  [NotificationEventType.WORKSPACE_FOLDER_DELETE_ERROR]: FolderEventPayload;
  [NotificationEventType.WORKSPACE_FOLDER_MOVE_SUCCESS]: FolderEventPayload;
  [NotificationEventType.WORKSPACE_FOLDER_RENAME_SUCCESS]: FolderEventPayload;
  
  [NotificationEventType.WORKSPACE_ITEMS_REORDER_SUCCESS]: BatchEventPayload;
  [NotificationEventType.WORKSPACE_BATCH_DELETE_START]: BatchEventPayload;
  [NotificationEventType.WORKSPACE_BATCH_DELETE_PROGRESS]: BatchEventPayload;
  [NotificationEventType.WORKSPACE_BATCH_DELETE_SUCCESS]: BatchEventPayload;
  [NotificationEventType.WORKSPACE_BATCH_DELETE_ERROR]: BatchEventPayload;
  
  [NotificationEventType.WORKSPACE_FILES_LIMIT_EXCEEDED]: FileLimitEventPayload;
  [NotificationEventType.WORKSPACE_FOLDER_DROPPED]: FolderDropEventPayload;
  
  [NotificationEventType.WORKSPACE_BATCH_UPLOAD_START]: BatchEventPayload;
  [NotificationEventType.WORKSPACE_BATCH_UPLOAD_PROGRESS]: BatchEventPayload;
  [NotificationEventType.WORKSPACE_BATCH_UPLOAD_SUCCESS]: BatchEventPayload;
  [NotificationEventType.WORKSPACE_BATCH_UPLOAD_ERROR]: BatchEventPayload;
  
  // Link events
  [NotificationEventType.LINK_CREATE_SUCCESS]: LinkEventPayload;
  [NotificationEventType.LINK_CREATE_ERROR]: LinkEventPayload;
  [NotificationEventType.LINK_UPDATE_SUCCESS]: LinkEventPayload;
  [NotificationEventType.LINK_UPDATE_ERROR]: LinkEventPayload;
  [NotificationEventType.LINK_DELETE_SUCCESS]: LinkEventPayload;
  [NotificationEventType.LINK_DELETE_ERROR]: LinkEventPayload;
  [NotificationEventType.LINK_GENERATE_SUCCESS]: LinkEventPayload;
  [NotificationEventType.LINK_GENERATE_ERROR]: LinkEventPayload;
  [NotificationEventType.LINK_COPY_SUCCESS]: LinkEventPayload;
  [NotificationEventType.LINK_NEW_UPLOAD]: LinkEventPayload;
  [NotificationEventType.LINK_BATCH_UPLOAD]: LinkEventPayload;
  
  // Storage events
  [NotificationEventType.STORAGE_THRESHOLD_WARNING]: StorageEventPayload;
  [NotificationEventType.STORAGE_THRESHOLD_CRITICAL]: StorageEventPayload;
  [NotificationEventType.STORAGE_LIMIT_EXCEEDED]: StorageEventPayload;
  [NotificationEventType.STORAGE_UPLOAD_BLOCKED]: StorageEventPayload;
  [NotificationEventType.STORAGE_CLEANUP_SUGGESTED]: StorageEventPayload;
  
  // Auth events
  [NotificationEventType.AUTH_SESSION_EXPIRED]: AuthEventPayload;
  [NotificationEventType.AUTH_LOGIN_SUCCESS]: AuthEventPayload;
  [NotificationEventType.AUTH_LOGOUT_SUCCESS]: AuthEventPayload;
  
  // Billing events
  [NotificationEventType.BILLING_SUBSCRIPTION_UPGRADED]: BillingEventPayload;
  [NotificationEventType.BILLING_SUBSCRIPTION_DOWNGRADED]: BillingEventPayload;
  [NotificationEventType.BILLING_PAYMENT_FAILED]: BillingEventPayload;
  [NotificationEventType.BILLING_TRIAL_ENDING]: BillingEventPayload;
  
  // System events
  [NotificationEventType.SYSTEM_MAINTENANCE_SCHEDULED]: SystemEventPayload;
  [NotificationEventType.SYSTEM_UPDATE_AVAILABLE]: SystemEventPayload;
  [NotificationEventType.SYSTEM_ERROR_NETWORK]: SystemEventPayload;
  [NotificationEventType.SYSTEM_ERROR_PERMISSION]: SystemEventPayload;
  
  // Settings events
  [NotificationEventType.SETTINGS_UPDATE_SUCCESS]: SettingsEventPayload;
  [NotificationEventType.SETTINGS_UPDATE_ERROR]: SettingsEventPayload;
}

/**
 * Main notification event interface
 */
export interface NotificationEvent<T extends NotificationEventType = NotificationEventType> {
  type: T;
  payload: EventPayloadMap[T];
  metadata: EventMetadata;
  config?: Partial<NotificationConfig>;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Extract event category from event type
 */
export function getEventCategory(eventType: NotificationEventType): EventCategory {
  const category = eventType.split('.')[0];
  return category as EventCategory;
}

/**
 * Check if event is an error event
 */
export function isErrorEvent(eventType: NotificationEventType): boolean {
  return eventType.includes('.error');
}

/**
 * Check if event is a success event
 */
export function isSuccessEvent(eventType: NotificationEventType): boolean {
  return eventType.includes('.success');
}

/**
 * Check if event is a progress event
 */
export function isProgressEvent(eventType: NotificationEventType): boolean {
  return eventType.includes('.progress') || eventType.includes('.start');
}