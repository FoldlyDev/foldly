# Foldly V2 Documentation

Last Updated: October 8, 2025

Welcome to the Foldly V2 documentation hub. This directory contains all planning, implementation, and technical documentation for the project.

---

## Quick Navigation

### 📋 Planning Documentation
**What we're building** - Design decisions, features, and architecture

👉 **[View Planning Docs](./planning)**

Key documents:
- [Finalized Decisions](./planning/decisions/finalized-decisions.md) - 21 locked architectural choices
- [MVP Features](./planning/features/mvp-features.md) - Phase 1 feature roadmap (8 weeks)
- [Core User Journeys](./planning/user-flows/core-user-journeys.md) - 5 primary workflows
- [Tech Stack](./planning/architecture/tech-stack.md) - Technology choices

---

### 🚀 Execution Documentation
**What we've built** - Implementation specs, technical details, progress tracking

👉 **[View Execution Docs](./execution)**

Current status:
- ✅ **Database Schema** - 6 tables implemented with Drizzle ORM
- ✅ **Testing Infrastructure** - 47 tests across 5 suites
- ⏳ Next.js project setup (pending)
- ⏳ API endpoints (pending)
- ⏳ UI components (pending)

---

## Project Overview

**Foldly V2** is an email-centric collaborative file workspace that allows users to:
- Create shareable folder links for file collection (like Calendly for files)
- Organize and filter files by uploader email across all folders
- Manage multi-person file collection with role-based permissions

**Core Innovation:** Filter all uploaded files by email address across entire workspace, perfect for tax accountants managing 30+ clients, freelancers collecting assets, or HR teams gathering resumes.

**Evolution from V1:**
- V1: Simple file requester (like Dropbox file requests)
- V2: People-centric file organization with email filtering as primary feature

---

## Documentation Structure

```
docs/
├── README.md (this file)
│
├── planning/                    What we're GOING TO build
│   ├── decisions/               Locked architectural choices
│   ├── features/                MVP feature roadmap
│   ├── user-flows/              User journey maps
│   └── architecture/            Tech stack and design patterns
│
└── execution/                   What we've ALREADY built
    ├── database/                Database implementation specs
    ├── testing/                 Testing strategy & patterns
    ├── api/                     API endpoint documentation
    └── components/              Component specifications
```

---

## Current Status

**Phase:** Foundation (Week 1-2 of 8-week MVP timeline)
**Progress:** 1/6 foundation tasks completed

### Completed ✅
- Planning phase (all decisions locked)
- Database schema design and implementation

### In Progress 🔄
- Nothing currently

### Next Up ⏳
- Generate database migrations
- Initialize Next.js 14+ project
- Set up Supabase connection
- Configure Google Cloud Storage

---

## How to Use This Documentation

### For New Team Members
1. Start with [Planning Overview](./planning) to understand the vision
2. Read [Finalized Decisions](./planning/decisions/finalized-decisions.md) for context
3. Review [Execution Docs](./execution) to see what's been built
4. Check [Tech Stack](./planning/architecture/tech-stack.md) for technology choices

### For Developers
1. Check [Execution Status](./execution) for implementation progress
2. Review [Database Schema](./execution/database/schema.md) before building features
3. Reference [MVP Features](./planning/features/mvp-features.md) for roadmap
4. Follow [User Journeys](./planning/user-flows/core-user-journeys.md) when building flows

### For Product/Design
1. Review [User Flows](./planning/user-flows/core-user-journeys.md) for workflows
2. Check [MVP Features](./planning/features/mvp-features.md) for scope
3. See [Execution Progress](./execution) for what's live
4. Reference [Finalized Decisions](./planning/decisions/finalized-decisions.md) for constraints

---

## Tech Stack Summary

**Frontend:**
- Next.js 14+ (App Router)
- React 18+
- Tailwind CSS + shadcn/ui
- TypeScript

**Backend:**
- Supabase (PostgreSQL)
- Drizzle ORM
- Next.js Server Actions
- API Routes

**Services:**
- Clerk (Authentication + Payments)
- Google Cloud Storage (File storage)
- Vercel (Hosting)
- Resend (Email)

**Full details:** [Tech Stack Documentation](./planning/architecture/tech-stack.md)

---

## Key Features (MVP)

### Priority 1: MUST HAVE ✅
1. Authentication & User Management
2. Folder Management (hierarchical)
3. Shareable Link Generation
4. Email-Based Access Control
5. File Upload (no-login for external users)
6. File Management (owner view)
7. Email-Based Filtering (core V2 feature)
8. Dashboard Views (Files, By Email, By Date)

### Priority 2: SHOULD HAVE ⏳
- Role Promotion (Uploader → Editor)
- Email Invitations
- Notifications
- Link Customization

**Full feature list:** [MVP Features](./planning/features/mvp-features.md)

---

## Timeline

**MVP Target:** 6-8 weeks from start
**Start Date:** October 8, 2025
**Current Week:** Week 1 (Foundation)

### Week-by-Week Breakdown
- **Week 1-2:** Foundation (database, base setup) - IN PROGRESS
- **Week 3:** User & Folder Management
- **Week 4:** Link Generation & Permissions
- **Week 5:** File Upload
- **Week 6:** File Management
- **Week 7:** Email Filtering
- **Week 8:** Polish & Testing

---

## Contributing

When adding documentation:

1. **Planning docs** (`/planning`) → Design decisions, future features
2. **Execution docs** (`/execution`) → Implementation specs, technical details
3. Update READMEs when adding new sections
4. Keep both planning and execution in sync
5. Mark items complete when merged/deployed

---

## Related Resources

- [Business Vision](../public/business/vision-v1-vs-v2.md)
- [Source Code](../src)
- [Database Schemas](../src/lib/database/schemas)
- [Drizzle Config](../drizzle.config.ts)

---

## Questions?

- **Planning questions** → See [Planning README](./planning/README.md)
- **Implementation questions** → See [Execution README](./execution/README.md)
- **General questions** → Check [Finalized Decisions](./planning/decisions/finalized-decisions.md)

---

**Status**: 🚀 Implementation in progress | Planning phase complete
