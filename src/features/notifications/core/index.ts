/**
 * Core Notification System Exports
 * Central hub for the event-driven notification architecture
 */

// Event Types and Definitions
export {
  // Enums
  EventCategory,
  NotificationUIType,
  NotificationPriority,
  NotificationChannel,
  NotificationEventType,
  
  // Types and Interfaces
  type EventMetadata,
  type NotificationConfig,
  type ChannelConfig,
  type NotificationAction,
  type FileEventPayload,
  type FolderEventPayload,
  type BatchEventPayload,
  type LinkEventPayload,
  type StorageEventPayload,
  type AuthEventPayload,
  type BillingEventPayload,
  type SystemEventPayload,
  type EventPayloadMap,
  type NotificationEvent,
  
  // Utility Functions
  getEventCategory,
  isErrorEvent,
  isSuccessEvent,
  isProgressEvent,
} from './event-types';

// Event Bus
export {
  eventBus,
  emitNotification,
  subscribeToNotification,
  subscribeToMultiple,
  getEventAnalytics,
  NotificationEventBus,
  type EventListener,
  type EventBusOptions,
  type EventAnalytics,
} from './event-bus';

// Notification Manager
export {
  notificationManager,
  initializeNotifications,
  type NotificationManagerConfig,
} from './notification-manager';

// Notification Renderer (to be implemented)
// export { NotificationRenderer } from './notification-renderer';