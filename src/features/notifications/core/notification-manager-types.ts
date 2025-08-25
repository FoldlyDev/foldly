/**
 * Type-safe payload accessor for notification manager
 */

import type {
  NotificationEvent,
  NotificationEventType,
  EventPayloadMap,
  FileEventPayload,
  FolderEventPayload,
  BatchEventPayload,
  LinkEventPayload,
  StorageEventPayload,
  FileLimitEventPayload,
  FolderDropEventPayload,
} from './event-types';

/**
 * Type guard to check if payload has a specific property
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

/**
 * Get typed payload for specific event type
 */
export function getTypedPayload<T extends NotificationEventType>(
  event: NotificationEvent,
  eventType: T
): EventPayloadMap[T] | undefined {
  if (event.type === eventType) {
    return event.payload as EventPayloadMap[T];
  }
  return undefined;
}

/**
 * Type guards for specific payload types
 */
export function isFileEventPayload(payload: unknown): payload is FileEventPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'fileId' in payload &&
    'fileName' in payload
  );
}

export function isFolderEventPayload(payload: unknown): payload is FolderEventPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'folderId' in payload &&
    'folderName' in payload
  );
}

export function isBatchEventPayload(payload: unknown): payload is BatchEventPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'batchId' in payload &&
    'totalItems' in payload
  );
}

export function isLinkEventPayload(payload: unknown): payload is LinkEventPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'linkId' in payload &&
    'linkTitle' in payload
  );
}

export function isStorageEventPayload(payload: unknown): payload is StorageEventPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'currentUsage' in payload
  );
}

export function isFileLimitEventPayload(payload: unknown): payload is FileLimitEventPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'attemptedCount' in payload &&
    'maxAllowed' in payload
  );
}

export function isFolderDropEventPayload(payload: unknown): payload is FolderDropEventPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'fileCount' in payload &&
    'message' in payload
  );
}

/**
 * Safe property accessor with type narrowing
 */
export function getPayloadProperty<T>(
  payload: unknown,
  property: string
): T | undefined;
export function getPayloadProperty<T>(
  payload: unknown,
  property: string,
  defaultValue: T
): T;
export function getPayloadProperty<T>(
  payload: unknown,
  property: string,
  defaultValue?: T
): T | undefined {
  if (payload && typeof payload === 'object' && property in payload) {
    return (payload as Record<string, T>)[property];
  }
  return defaultValue;
}