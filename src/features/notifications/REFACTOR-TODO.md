# Notification System Refactor TODO

## 📋 Executive Summary

Transform the current hybrid notification system into a centralized, event-driven architecture that matches Silicon Valley standards for SaaS platforms. This refactor will eliminate manual toast calls scattered across 35+ files and create a single source of truth for all application notifications.

---

## 🔴 Current Issues & Problems

### 1. **Scattered Manual Toast Calls**
- **Issue**: 35+ files directly calling `toast.success()`, `toast.error()`, etc.
- **Impact**: 
  - No central control over message format
  - Inconsistent messaging for same events
  - Impossible to track analytics
  - Difficult to test notification behavior
  - Can't batch or throttle similar notifications

### 2. **Mixed Notification Approaches**
- **Internal notifications** (`workspace-notifications.ts`) - Has event types but still uses toast directly
- **Link notifications** - Custom components but manual triggers
- **Upload notifications** - Real-time but separate from other events
- **Error handling** - Scattered across components with different formats

### 3. **No Central Event System**
- Each feature handles its own notifications independently
- No way to correlate related events
- Can't prevent duplicate notifications for same action
- No central logging or analytics capability
- No event replay or debugging tools

### 4. **Inconsistent Event Naming & Types**
```typescript
// Current inconsistencies found:
'file_moved' vs 'folder.created' vs 'new_upload'
'Items reordered' vs 'Link deleted successfully'
```

### 5. **Limited Notification Context**
- Most toasts are simple strings without metadata
- No information about what triggered the notification
- Can't group related notifications together
- No action buttons except in custom components

### 6. **No Queue Management**
- Multiple rapid operations create notification spam
- No priority system (critical vs info)
- No deduplication logic
- No rate limiting or throttling
- Users can be overwhelmed during batch operations

---

## ✅ Current Good Parts (Keep & Enhance)

1. **NotificationProvider** - Already intercepts all toasts
2. **Zustand Store** - Manages notification state
3. **Real-time Subscriptions** - WebSocket notifications via Supabase
4. **User Settings Integration** - DND mode, silent notifications
5. **Sound Support** - Audio feedback system

---

## 🎯 Target Architecture: Event-Driven System

### Core Components

```typescript
// 1. Central Event Bus
EventBus.emit('file.upload.success', { 
  fileId, 
  fileName, 
  size,
  metadata: { priority: 'low', groupId: 'batch-123' }
});

// 2. Notification Manager (decides what to show)
NotificationManager.on('file.upload.success', (data) => {
  // Business logic, throttling, deduplication
  // User preferences, DND mode, etc.
});

// 3. Analytics & Logging (automatic)
// Every event automatically tracked
```

---

## 📝 Implementation Tasks

### Phase 1: Foundation (Week 1)

#### Task 1.1: Create Event System Core
- [ ] Create `/notifications/core/event-bus.ts`
  - Implement EventEmitter-based event bus
  - Add TypeScript types for all events
  - Add event metadata interface
- [ ] Create `/notifications/core/event-types.ts`
  - Define comprehensive event taxonomy
  - Create consistent naming convention
  - Add event priority levels

#### Task 1.2: Define Event Taxonomy
- [ ] Workspace Events
  ```typescript
  'workspace.file.upload.start'
  'workspace.file.upload.success'
  'workspace.file.upload.error'
  'workspace.folder.create'
  'workspace.folder.rename'
  'workspace.folder.delete'
  'workspace.item.move'
  'workspace.item.reorder'
  ```
- [ ] Link Events
  ```typescript
  'link.create.success'
  'link.update.success'
  'link.delete.success'
  'link.copy.clipboard'
  'link.generate.success'
  ```
- [ ] Storage Events
  ```typescript
  'storage.threshold.warning' // 80%
  'storage.threshold.critical' // 95%
  'storage.limit.exceeded'
  ```
- [ ] System Events
  ```typescript
  'system.error.network'
  'system.error.permission'
  'system.maintenance'
  ```

#### Task 1.3: Create Notification Manager
- [ ] Create `/notifications/core/notification-manager.ts`
  - Event listener registration
  - Notification routing logic
  - Priority queue implementation
  - Deduplication logic
  - Rate limiting/throttling

### Phase 2: Integration Layer (Week 1-2)

#### Task 2.1: Create Event Hooks
- [ ] `useEventBus()` - Hook for emitting events
- [ ] `useNotificationEvents()` - Hook for listening to events
- [ ] `useNotificationConfig()` - Hook for user preferences

#### Task 2.2: Enhance Existing Components
- [ ] Update `NotificationProvider` to use event bus
- [ ] Integrate with existing Zustand store
- [ ] Connect to real-time subscriptions

#### Task 2.3: Create Migration Utilities
- [ ] Create codemod script to replace toast calls
- [ ] Add backwards compatibility wrapper
- [ ] Create migration guide

### Phase 3: Feature Migration (Week 2-3)

#### Task 3.1: Migrate Workspace Features
Files to update:
- [ ] `workspace-container.tsx` (4 toast calls)
- [ ] `workspace-toolbar.tsx` (4 toast calls)
- [ ] `use-file-upload.ts` (9 toast calls)
- [ ] `drop-handler.ts` (multiple calls)
- [ ] Other workspace components

#### Task 3.2: Migrate Link Features
Files to update:
- [ ] `use-create-link-mutation.ts`
- [ ] `use-update-link-mutation.ts`
- [ ] `use-delete-link-mutation.ts`
- [ ] `LinkCard.tsx`
- [ ] `BrandingSettingsForm.tsx`

#### Task 3.3: Migrate Upload Features
- [ ] Connect file upload events
- [ ] Batch upload notifications
- [ ] Progress notifications

### Phase 4: Advanced Features (Week 3-4)

#### Task 4.1: Smart Notification Features
- [ ] Implement notification grouping
  - Group similar notifications (e.g., "5 files uploaded")
- [ ] Add action buttons to notifications
  - Undo actions
  - View details
  - Quick actions
- [ ] Create notification center/history
- [ ] Add notification persistence (important ones)

#### Task 4.2: Analytics & Monitoring
- [ ] Add event analytics tracking
- [ ] Create notification metrics dashboard
- [ ] Add error tracking for failed notifications
- [ ] Implement A/B testing framework

#### Task 4.3: Developer Experience
- [ ] Create comprehensive TypeScript types
- [ ] Add development mode with event logging
- [ ] Create testing utilities
- [ ] Write documentation

---

## 📊 Migration Statistics

### Current State
- **35 files** with direct toast calls
- **10+ different** notification patterns
- **3 separate** notification systems
- **No central** event definitions

### Target State
- **0 direct** toast calls in components
- **1 unified** event-driven system
- **100% typed** events with metadata
- **Full analytics** coverage

---

## 🔄 Migration Strategy

### Step 1: Parallel Implementation
1. Build new event system alongside existing
2. No breaking changes initially
3. Gradual migration file by file

### Step 2: Progressive Migration
```typescript
// Old way (to be removed)
toast.success('File uploaded');

// Transition phase (both work)
EventBus.emit('file.upload.success', { fileId, fileName });
// Event handler shows toast internally

// Final state (clean)
EventBus.emit('file.upload.success', { fileId, fileName });
```

### Step 3: Cleanup
1. Remove all direct toast imports
2. Delete legacy notification code
3. Update documentation

---

## 📈 Success Metrics

1. **Code Quality**
   - Zero direct toast calls in components
   - 100% event type coverage
   - Full TypeScript type safety

2. **User Experience**
   - Reduced notification spam by 50%
   - Consistent messaging across platform
   - Smart grouping for batch operations

3. **Developer Experience**
   - Single source of truth for notifications
   - Easy to test notification logic
   - Clear documentation and examples

4. **Business Value**
   - Complete notification analytics
   - A/B testing capability
   - User engagement tracking

---

## 🚀 Quick Wins (Can Do Now)

1. **Define Event Types** - Create comprehensive type definitions
2. **Create Event Bus** - Basic implementation with TypeScript
3. **Migrate High-Traffic Areas** - Start with file upload notifications
4. **Add Analytics** - Track existing toast calls for baseline

---

## 📚 Reference Implementation

```typescript
// Example: New event-driven approach
class NotificationEventBus extends EventEmitter {
  emit<T extends NotificationEvent>(
    event: T,
    data: NotificationEventData[T]
  ): void {
    // Analytics tracking
    analytics.track(`notification.${event}`, data);
    
    // Emit to listeners
    super.emit(event, data);
  }
}

// Usage in component
function MyComponent() {
  const { emit } = useEventBus();
  
  const handleFileUpload = async () => {
    emit('file.upload.start', { fileName });
    
    try {
      const result = await uploadFile();
      emit('file.upload.success', { 
        fileId: result.id,
        fileName: result.name 
      });
    } catch (error) {
      emit('file.upload.error', { 
        fileName,
        error: error.message 
      });
    }
  };
}
```

---

## 🎓 Learning Resources

- [Event-Driven Architecture in React](https://www.patterns.dev/posts/event-driven/)
- [Notification Systems at Scale - Stripe](https://stripe.com/blog/notifications)
- [Building Slack's Notification System](https://slack.engineering/building-slacks-notification-system/)

---

## ⚠️ Risk Mitigation

1. **Backwards Compatibility** - Maintain toast wrapper during migration
2. **Testing** - Comprehensive test suite before removing old system
3. **Gradual Rollout** - Feature flag for new system
4. **Rollback Plan** - Keep old code in separate branch

---

## 📅 Timeline

- **Week 1**: Foundation & Core System
- **Week 2**: Integration & Start Migration
- **Week 3**: Complete Migration & Advanced Features
- **Week 4**: Testing, Documentation & Cleanup

---

## 👥 Team Notes

This refactor will touch many parts of the codebase but will result in:
- Better user experience with smart notifications
- Easier maintenance and testing
- Foundation for advanced features (push notifications, email, etc.)
- Analytics and insights into user behavior

The investment is worth it for a production-grade SaaS platform.

---

*Last Updated: January 2025*
*Status: Ready for Implementation*