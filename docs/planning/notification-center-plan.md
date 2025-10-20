# Notification Center Plan

**Decision Date:** October 15, 2025
**Status:** Deferred to Post-MVP
**Tech Lead Review:** Approved deferral

---

## Decision: Defer to Post-MVP

**Current MVP Approach:**
- Ephemeral toast notifications (Origin UI toast system)
- Email notifications for critical updates (Resend)
- User preference: `emailNotificationsEnabled` in user settings

**Rationale:**
- MVP priorities focus on core file upload/folder features
- Current toast + email system provides sufficient coverage
- Need real user behavior data to inform proper architecture
- Avoid premature optimization and tight coupling

---

## Future Implementation (Post-MVP)

### Recommended Approach: Hybrid System

**Database Schema:**
```typescript
notifications table:
  - id: text (UUID)
  - user_id: text (FK to users)
  - category: varchar ('upload' | 'permission' | 'system')
  - event_type: varchar (flexible, module-defined)
  - title: varchar
  - message: text
  - metadata: jsonb (module-specific data)
  - actions: jsonb[] (structured action objects)
  - priority: varchar ('low' | 'medium' | 'high')
  - read_at: timestamp
  - dismissed_at: timestamp
  - expires_at: timestamp
  - created_at: timestamp

notification_event_registry table:
  - event_type: varchar (PK)
  - module: varchar
  - display_config: jsonb (icon, color, default_priority)
```

**Action Object Structure:**
```typescript
type NotificationAction = {
  type: 'navigate' | 'execute' | 'external';
  label: string;
  url?: string;
  actionId?: string; // Server action reference
  params?: Record<string, any>;
  expiresAt?: Date;
  prerequisite?: string; // Action ID dependency
};
```

**Module Registration Pattern:**
- Modules register event types at startup
- Registry validates all notification events
- No schema migrations needed for new event types

**Benefits:**
- Categories provide structure (analytics, filtering)
- Event types are flexible (no tight coupling)
- Type safety via registry validation
- Actions support expiration and prerequisites
- Maintains three-layer architecture pattern

---

## Implementation Trigger

Build notification center when:
- 100+ active users with real usage data
- User feedback indicates need for persistent notifications
- Dashboard analytics show frequent check-in patterns

---

## References

- Tech Lead Decision: October 15, 2025
- MVP Features: `docs/planning/features/mvp-features.md` (Section 2.3 - notifications deferred)
- Current toast system: `src/components/ui/originui/`
- Email system: `src/lib/actions/email.actions.ts`
