# Product Requirements Documents (PRDs)

**Last Updated:** October 12, 2025

This directory contains comprehensive Product Requirements Documents for all major features in Foldly V2.

---

## Directory Structure

```
prd/
├── README.md (this file)
├── 01-authentication-onboarding.md     ✅ Complete
├── 02-database-architecture.md         ✅ Complete
├── 03-global-actions-hooks.md          ✅ Complete
└── 04-file-upload-system.md            ⏳ Planned
```

---

## Completed PRDs

### 01. Authentication & Onboarding Flow
**Status:** ✅ Implemented (Phase 1)
**File:** [01-authentication-onboarding.md](./01-authentication-onboarding.md)

**Summary:** Complete user authentication and onboarding system using Clerk, featuring 4-step onboarding with atomic workspace creation, username capture with reverification, and automatic first link generation.

**Key Features:**
- Clerk authentication (email/password + magic links)
- Username availability checking with reverification
- Atomic transaction for workspace setup
- Multi-step loading with visual progress
- Security-first design with rollback safety

**Metrics:**
- 27 tests passing (100% coverage)
- < 30 second onboarding time
- Zero partial onboarding states

### 02. Database Architecture
**Status:** ✅ Implemented (Phase 1)
**File:** [02-database-architecture.md](./02-database-architecture.md)

**Summary:** PostgreSQL database schema via Supabase and Drizzle ORM, designed for email-centric file organization with 6 core tables, 8 foreign key constraints, and comprehensive data integrity measures.

**Key Features:**
- 6-table schema (users, workspaces, links, folders, files, permissions)
- Email-centric filtering with uploader tracking
- Flat GCS storage with database-driven hierarchy
- Strategic cascade vs set null deletion behavior
- 1:1 user-workspace relationship (MVP constraint)

**Metrics:**
- 46 database query tests passing
- 8 foreign key constraints enforced
- 8 unique constraints implemented
- 100% migration success rate

### 03. Global Actions & Hooks Architecture
**Status:** ✅ Implemented (Phase 1)
**File:** [03-global-actions-hooks.md](./03-global-actions-hooks.md)

**Summary:** Three-layer data flow pattern separating database queries, server actions, and React Query hooks. Establishes clear conventions for global vs module-specific code organization.

**Key Features:**
- Three-layer pattern: Query → Action → Hook
- Server actions handle auth, validation, business logic
- React Query hooks provide caching and state management
- Clear global vs module-specific decision tree
- End-to-end TypeScript type safety

**Metrics:**
- 17 reusable query functions
- 8 global server actions
- 5 React Query hooks
- 76 tests passing (queries + actions)
- 100% three-layer adherence

---

## Planned PRDs

### 04. File Upload System
**Status:** ⏳ Planned
**Phase:** Upload & File Management (Phase 5)

**Scope:**
- External uploader UI (no-login upload)
- Google Cloud Storage integration
- Drag-and-drop functionality
- Progress tracking
- Metadata collection (email, name, message)

---

## How to Use This Directory

### For Product Managers
1. Review PRDs to understand feature scope and acceptance criteria
2. Track implementation status against PRD requirements
3. Update PRDs when requirements change

### For Engineers
1. Use PRDs as implementation specifications
2. Reference technical architecture diagrams
3. Follow security and testing requirements
4. Update PRD status as features are completed

### For Designers
1. Review user journey sections for UX flows
2. Check UI requirements and wireframes
3. Validate implemented designs against PRD specs

### For QA
1. Use PRDs to create test plans
2. Validate all functional requirements
3. Check non-functional requirements (performance, security)
4. Reference test coverage sections

---

## PRD Template Structure

Each PRD follows this standard structure:

1. **Executive Summary** - High-level overview
2. **Problem Statement** - User pain points and context
3. **Goals & Success Metrics** - Measurable outcomes
4. **User Personas** - Target users and their needs
5. **User Journey** - Step-by-step user flows
6. **Feature Requirements** - Functional and non-functional
7. **Technical Architecture** - System design and data flow
8. **Implementation Details** - Code structure and snippets
9. **Security & Compliance** - Security measures and compliance
10. **Testing Strategy** - Test coverage and QA checklist
11. **Future Enhancements** - Post-MVP improvements
12. **Appendix** - Glossary, related docs, changelog

---

## Contributing

When creating a new PRD:

1. Copy the structure from an existing PRD
2. Use sequential numbering (e.g., `05-feature-name.md`)
3. Update this README with the new PRD entry
4. Mark status as ⏳ Planned, 🚧 In Progress, or ✅ Complete
5. Link to related execution and planning docs

---

## Related Documentation

- [Execution Documentation](../execution/README.md) - Implementation tracking
- [Planning Documentation](../planning/README.md) - Design decisions
- [Database Schema](../execution/database/schema.md) - Database specification
- [Testing Guide](../execution/testing/testing-guide.md) - Testing patterns

---

## Version History

| Date | Changes | Author |
|------|---------|--------|
| Oct 12, 2025 | Created PRD directory with first PRD | Engineering Team |
| Oct 12, 2025 | Added Database Architecture PRD | Engineering Team |
| Oct 12, 2025 | Added Global Actions & Hooks Architecture PRD | Engineering Team |

---

**End of README**
