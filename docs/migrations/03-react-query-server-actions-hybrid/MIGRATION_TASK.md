# Migration Task: React Query + Server Actions Hybrid

> **Sprint Duration**: 3-4 days  
> **Team Size**: 1 developer  
> **Status**: 📋 Ready to Start

## Task Breakdown

### Phase 1: Dependencies & Setup (4 hours)

#### Task 1.1: Install Dependencies

- [ ] Install `@tanstack/react-query@^5.0.0`
- [ ] Install `@tanstack/react-query-devtools@^5.0.0`
- [ ] Update `package.json` dependencies
- [ ] Run `npm install` and verify build

**Acceptance Criteria:**

- [ ] Dependencies installed successfully
- [ ] Project builds without errors
- [ ] TypeScript compilation passes

#### Task 1.2: Query Client Provider Setup

- [ ] Create `src/lib/providers/query-client-provider.tsx`
- [ ] Configure QueryClient with optimal defaults
- [ ] Add ReactQueryDevtools for development
- [ ] Integrate provider in `src/app/layout.tsx`

**Acceptance Criteria:**

- [ ] QueryClientProvider wraps the app
- [ ] DevTools visible in development mode
- [ ] Console shows React Query initialization

#### Task 1.3: Server Query Client

- [ ] Create `src/lib/query-client.ts`
- [ ] Implement cached server-side QueryClient
- [ ] Configure for SSR/RSC compatibility

**Acceptance Criteria:**

- [ ] Server QueryClient created successfully
- [ ] SSR hydration works correctly
- [ ] No hydration mismatches

### Phase 2: Query Infrastructure (8 hours)

#### Task 2.1: Query Keys Factory

- [ ] Create `src/features/links/lib/query-keys.ts`
- [ ] Define type-safe query key factory
- [ ] Include all query variations (list, detail, stats)
- [ ] Export consistent key patterns

**Acceptance Criteria:**

- [ ] Query keys follow hierarchical structure
- [ ] TypeScript autocomplete works
- [ ] Keys are reusable across hooks

#### Task 2.2: Query Hooks

- [ ] Create `src/features/links/hooks/use-links-query.ts`
- [ ] Create `src/features/links/hooks/use-link-query.ts`
- [ ] Implement error handling and loading states
- [ ] Add proper TypeScript types from `/lib/supabase/types`

**Acceptance Criteria:**

- [ ] Query hooks return proper data types
- [ ] Loading and error states handled
- [ ] Server Actions integration works
- [ ] Caching strategies implemented

#### Task 2.3: Mutation Hooks

- [ ] Create `src/features/links/hooks/use-create-link-mutation.ts`
- [ ] Create `src/features/links/hooks/use-update-link-mutation.ts`
- [ ] Create `src/features/links/hooks/use-delete-link-mutation.ts`
- [ ] Implement optimistic updates
- [ ] Add error rollback functionality

**Acceptance Criteria:**

- [ ] Optimistic updates work correctly
- [ ] Error rollback restores previous state
- [ ] Query invalidation triggers properly
- [ ] Mutation success/error feedback

### Phase 3: Component Integration (6 hours)

#### Task 3.1: Update LinksContainer

- [ ] Remove manual state management
- [ ] Integrate `useLinksQuery` hook
- [ ] Update loading/error/empty states
- [ ] Test data fetching and caching

**Acceptance Criteria:**

- [ ] No manual `useState` for links data
- [ ] React Query manages all server state
- [ ] Loading states display correctly
- [ ] Error handling works as expected

#### Task 3.2: Update Modal Components

- [ ] Integrate mutation hooks in create/edit modals
- [ ] Remove manual API calls
- [ ] Add optimistic updates feedback
- [ ] Test form submissions

**Acceptance Criteria:**

- [ ] Modals use mutation hooks
- [ ] Optimistic updates visible
- [ ] Form validation still works
- [ ] Success/error feedback displayed

#### Task 3.3: RSC Integration

- [ ] Update `src/app/dashboard/links/page.tsx`
- [ ] Add server-side prefetching
- [ ] Implement HydrationBoundary
- [ ] Remove placeholder comments

**Acceptance Criteria:**

- [ ] Server-side data prefetching works
- [ ] Client-side hydration seamless
- [ ] Performance improves on page load
- [ ] No flash of loading state

### Phase 4: Cleanup & Testing (2 hours)

#### Task 4.1: Remove Redundant Code

- [ ] Follow [Cleanup Instructions](./CLEANUP_INSTRUCTIONS.md) checklist
- [ ] Delete `src/app/api/links/route.ts`
- [ ] Remove manual fetch calls
- [ ] Clean up unused state management
- [ ] Update imports across components
- [ ] Run automated cleanup script

**Acceptance Criteria:**

- [ ] No API route files for links
- [ ] No manual fetch() calls
- [ ] No orphaned imports
- [ ] Clean build with no warnings
- [ ] All cleanup checklist items completed

#### Task 4.2: Testing & Validation

- [ ] Test all CRUD operations
- [ ] Verify optimistic updates
- [ ] Test error scenarios
- [ ] Validate caching behavior

**Acceptance Criteria:**

- [ ] All operations work correctly
- [ ] Optimistic updates smooth
- [ ] Error handling graceful
- [ ] Performance metrics improved

## Success Metrics

### Performance Targets

- [ ] **Page Load**: 30% faster initial load
- [ ] **API Calls**: 50% reduction in redundant requests
- [ ] **UX**: Optimistic updates for all mutations
- [ ] **Caching**: 5-minute stale time, 10-minute garbage collection

### Code Quality

- [ ] **TypeScript**: 100% type coverage
- [ ] **Imports**: All from `@/lib/supabase/types`
- [ ] **Architecture**: Clean separation of concerns
- [ ] **Testing**: All existing tests still pass

### Feature Completeness

- [ ] **Create Link**: Works with optimistic updates
- [ ] **Edit Link**: Real-time updates
- [ ] **Delete Link**: Immediate UI feedback
- [ ] **List Links**: Server-side rendering + client caching
- [ ] **Link Details**: Individual query with caching

## Risk Mitigation

### High Risk Items

- **SSR Hydration**: Test thoroughly across different scenarios
- **Type Safety**: Ensure all hooks use proper types from single source
- **Optimistic Updates**: Verify rollback works correctly

### Rollback Plan

- Keep current implementation in separate branch
- Staged deployment with feature flags
- Quick rollback to API routes if needed

## Post-Migration Tasks

### Documentation Updates

- [ ] Update README with new patterns
- [ ] Document query key conventions
- [ ] Add troubleshooting guide

### Future Enhancements

- [ ] Add background refetch on window focus
- [ ] Implement infinite queries for large datasets
- [ ] Add real-time subscriptions with WebSockets

## Developer Notes

### Key Conventions

- All types from `@/lib/supabase/types`
- Query keys use factory pattern
- Mutations include optimistic updates
- Server Actions for all database operations

### Testing Strategy

- Unit tests for hooks
- Integration tests for components
- E2E tests for user flows
- Performance benchmarks

### Deployment

- Deploy to staging first
- Monitor React Query DevTools
- Validate performance improvements
- Full rollout after validation

## 📚 **References & Documentation**

- [React Query v5 Documentation](https://tanstack.com/query/v5)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Store Migration Analysis](./STORE_MIGRATION_ANALYSIS.md)
- [Cleanup Instructions](./CLEANUP_INSTRUCTIONS.md)
