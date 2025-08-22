# ⚠️ DEPRECATED - Internal Notification System

**Status:** DEPRECATED as of January 2025  
**Replacement:** New Event-Driven System in `/core`

## Migration Guide

### Old System (This Folder)
The files in this folder represent the old notification implementation:
- `types.ts` - Old event types and interfaces
- `workspace-notifications.ts` - Direct toast calls for workspace events
- `index.ts` - Old exports

### New System (`/core`)
- `event-types.ts` - Comprehensive type-safe event definitions
- `event-bus.ts` - Central event bus for all notifications
- `notification-manager.ts` - Smart routing and deduplication

## Migration Examples

### Before (Old System):
```typescript
import { showWorkspaceNotification } from '@/features/notifications/internal/workspace-notifications';

// Direct toast call
showWorkspaceNotification('file_uploaded', {
  itemName: 'document.pdf',
  itemType: 'file',
});
```

### After (New System):
```typescript
import { useEventBus, NotificationEventType } from '@/features/notifications/core';

const { emit } = useEventBus();

// Event-driven approach
emit(NotificationEventType.WORKSPACE_FILE_UPLOAD_SUCCESS, {
  fileId: 'file-123',
  fileName: 'document.pdf',
  fileSize: 1024000,
});
```

## Deprecation Timeline

1. **Phase 1** (Current): New system available, old system marked deprecated
2. **Phase 2** (Next Sprint): Migrate all components to new system
3. **Phase 3** (Future): Remove this folder completely

## Files to Keep Temporarily

These files are still referenced and need migration:
- `workspace-notifications.ts` - Used by workspace components
- Functions: `showStorageWarning`, `showStorageCritical`, `checkAndShowStorageThresholds`

## DO NOT USE FOR NEW FEATURES

All new notification implementations should use the event-driven system in `/core`.