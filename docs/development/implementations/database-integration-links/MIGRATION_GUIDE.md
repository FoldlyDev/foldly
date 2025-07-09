# 🚀 Migration Guide - Database Integration for Links Feature

**Migration Version:** 2025.1  
**Target:** Production Database Integration  
**Status:** 🎯 **Phase 2 In Progress** - Database Service Layer Complete  
**Current Task:** Server Actions Implementation  
**Dependencies:** ✅ Database schema deployed, db-service.ts implemented

## 🎯 Migration Overview

This guide provides step-by-step instructions for integrating your existing links feature with the database, following the hybrid architecture pattern while preserving all existing components. **Phase 1 (Database Foundation) has been completed successfully**.

## ✅ **Phase 1: Database Foundation (COMPLETED)**

### **What Has Been Implemented**

- ✅ **Database Schema**: Complete PostgreSQL schema with 6 tables
- ✅ **Type System**: Full TypeScript type definitions
- ✅ **Drizzle ORM**: Configured with Supabase
- ✅ **Row Level Security**: Multi-tenant security policies
- ✅ **MVP Simplification**: Removed tasks, simplified folders
- ✅ **Schema Organization**: Modular schema files in `src/lib/supabase/schemas/`

### **Completed Files Structure**

```
src/lib/supabase/
├── schemas/
│   ├── enums.ts           # ✅ PostgreSQL enums
│   ├── users.ts           # ✅ User schema
│   ├── workspaces.ts      # ✅ Workspace schema
│   ├── links.ts           # ✅ Multi-link system
│   ├── folders.ts         # ✅ Simplified folder system
│   ├── batches.ts         # ✅ Upload batch management
│   ├── files.ts           # ✅ File storage
│   ├── relations.ts       # ✅ Database relationships
│   └── index.ts           # ✅ Schema exports
├── types/
│   ├── [all_types].ts     # ✅ Complete type system
│   └── index.ts           # ✅ Type exports
└── schema.ts              # ✅ Legacy schema reference

src/lib/db/
└── db.ts                  # ✅ Database connection

drizzle/
└── schema.ts              # ✅ Drizzle schema imports

drizzle.config.ts          # ✅ Drizzle configuration
```

### **Database Schema Implemented**

```sql
-- ✅ COMPLETED: 6-table simplified MVP schema
CREATE TABLE users (id, email, username, subscription_tier, ...);
CREATE TABLE workspaces (id, user_id, name, ...);
CREATE TABLE links (id, user_id, workspace_id, slug, topic, link_type, ...);
CREATE TABLE folders (id, user_id, workspace_id, parent_folder_id, ...);
CREATE TABLE batches (id, link_id, user_id, uploader_name, ...);
CREATE TABLE files (id, link_id, batch_id, folder_id, file_name, ...);
```

### **Environment Setup (COMPLETED)**

```bash
# ✅ Required environment variables (should be configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url
POSTGRES_URL=your_postgres_url

# ✅ Clerk integration (should already exist)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

---

## 🎯 **Phase 2: Service Layer Implementation (IN PROGRESS)**

### **Step 2.1: Create Database Service Layer** - ✅ **COMPLETED**

The database service layer has been implemented with comprehensive CRUD operations:

```bash
# ✅ COMPLETED: Database service layer
src/features/links/lib/db-service.ts    # Full CRUD operations implemented

# ✅ COMPLETED: Type alignment fixes
- Adapter pattern for database-UI type transformation
- Service-specific types for clean separation
- Comprehensive error handling with DatabaseResult pattern
```

**Key Features Implemented:**

- ✅ Complete LinksDbService with all CRUD operations
- ✅ Type alignment between database and UI layers
- ✅ Adapter pattern for clean data transformation
- ✅ Comprehensive error handling and validation
- ✅ Performance optimization with proper indexing

### **Step 2.2: Type Alignment and Migration** - 🎯 **CRITICAL NEXT TASK**

**PRIORITY**: Before implementing server actions, ensure all links feature code uses database types as the single source of truth:

```bash
# 🎯 CRITICAL: Migrate from feature types to database types
# This step is essential for maintaining type consistency

# 1. Update all imports across the links feature
src/features/links/components/     # Update component prop types
src/features/links/store/          # Update store interfaces
src/features/links/hooks/          # Update hook return types

# 2. Remove duplicate type definitions
src/features/links/types/          # Remove obsolete feature-specific types

# 3. Align validation schemas
src/features/links/schemas/index.ts # Use database constraint rules
```

**Key Migration Tasks (Refactor-First Approach):**

- ✅ Replace all `@/features/links/types` imports with `@/lib/supabase/types`
- ✅ **REFACTOR existing** Zustand store interfaces to use `Link`, `LinkWithStats`, etc.
- ✅ **REFACTOR existing** form schemas (`schemas/index.ts`) with database validation constraints
- ✅ **DELETE** entire `src/features/links/types/` directory (no longer needed)
- ✅ **DELETE** obsolete `services/` directory files
- ✅ **REFACTOR existing** components to use consistent database types
- ✅ **CLEANUP** workspace - remove all orphaned files

### **Step 2.3: Create Server Actions** - 📋 **AFTER TYPE MIGRATION**

Create server actions to connect the service layer to your components:

```typescript
// src/features/links/lib/db-service.ts
import { db } from '@/lib/db/db';
import { links, files, batches, folders } from '@/lib/supabase/schemas';
import { eq, desc } from 'drizzle-orm';
import type { Link, LinkWithStats } from '@/lib/supabase/types';

export class LinksDbService {
  async getByUserId(userId: string): Promise<LinkWithStats[]> {
    const result = await db
      .select({
        link: links,
        fileCount: count(files.id),
        batchCount: count(batches.id),
      })
      .from(links)
      .leftJoin(files, eq(files.linkId, links.id))
      .leftJoin(batches, eq(batches.linkId, links.id))
      .where(eq(links.userId, userId))
      .groupBy(links.id)
      .orderBy(desc(links.createdAt));

    return result.map(row => ({
      ...row.link,
      fileCount: row.fileCount || 0,
      batchCount: row.batchCount || 0,
      totalSize: 0, // Calculate separately if needed
      fullUrl: this.buildLinkUrl(row.link),
    }));
  }

  async create(
    linkData: Omit<Link, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Link> {
    const [newLink] = await db
      .insert(links)
      .values({
        ...linkData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return newLink;
  }

  async update(id: string, updates: Partial<Link>): Promise<Link> {
    const [updatedLink] = await db
      .update(links)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(links.id, id))
      .returning();

    return updatedLink;
  }

  async delete(id: string): Promise<void> {
    await db.delete(links).where(eq(links.id, id));
  }

  private buildLinkUrl(link: Link): string {
    const baseUrl = 'foldly.com';
    return link.topic
      ? `${baseUrl}/${link.slug}/${link.topic}`
      : `${baseUrl}/${link.slug}`;
  }
}

export const linksDbService = new LinksDbService();
```

### **Step 2.2: Create Zod Validation Schemas**

```typescript
// src/features/links/schemas/index.ts
import { z } from 'zod';

// Re-export types from main type system
export type { Link, LinkWithStats } from '@/lib/supabase/types';

export const createLinkSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be 100 characters or less')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must contain only lowercase letters, numbers, and hyphens'
    ),
  topic: z
    .string()
    .min(1, 'Topic is required')
    .max(100, 'Topic must be 100 characters or less')
    .regex(
      /^[a-z0-9-]+$/,
      'Topic must contain only lowercase letters, numbers, and hyphens'
    )
    .optional(),
  linkType: z.enum(['base', 'custom', 'generated']),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or less'),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
  requireEmail: z.boolean().default(false),
  requirePassword: z.boolean().default(false),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional(),
  isPublic: z.boolean().default(true),
  maxFiles: z.number().int().min(1).max(1000).default(100),
  maxFileSize: z.number().int().min(1).default(104857600), // 100MB
  expiresAt: z.date().optional(),
  brandEnabled: z.boolean().default(false),
  brandColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Brand color must be a valid hex color')
    .optional(),
});

export const updateLinkSchema = createLinkSchema.partial();

export type CreateLinkData = z.infer<typeof createLinkSchema>;
export type UpdateLinkData = z.infer<typeof updateLinkSchema>;
```

### **Step 2.3: Create Server Actions**

```typescript
// src/features/links/lib/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { currentUser } from '@clerk/nextjs/server';
import { linksDbService } from './db-service';
import { createLinkSchema, updateLinkSchema } from '../schemas';
import type { CreateLinkData, UpdateLinkData } from '../schemas';

export async function createLinkAction(data: CreateLinkData) {
  try {
    // 1. Get current user
    const user = await currentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    // 2. Validate input
    const validatedData = createLinkSchema.parse(data);

    // 3. Get or create user's workspace
    const workspace = await getUserWorkspace(user.id);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // 4. Create link in database
    const link = await linksDbService.create({
      userId: user.id,
      workspaceId: workspace.id,
      ...validatedData,
    });

    // 5. Revalidate relevant paths
    revalidatePath('/dashboard/links');

    return { success: true, data: link };
  } catch (error) {
    console.error('Failed to create link:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function updateLinkAction(id: string, data: UpdateLinkData) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const validatedData = updateLinkSchema.parse(data);
    const link = await linksDbService.update(id, validatedData);

    revalidatePath('/dashboard/links');
    revalidatePath(`/dashboard/links/${id}`);

    return { success: true, data: link };
  } catch (error) {
    console.error('Failed to update link:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function deleteLinkAction(id: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    await linksDbService.delete(id);

    revalidatePath('/dashboard/links');

    return { success: true };
  } catch (error) {
    console.error('Failed to delete link:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Helper function to get user workspace
async function getUserWorkspace(userId: string) {
  // Implementation depends on your workspace logic
  // For MVP, you might auto-create one workspace per user
  return { id: 'workspace-id' }; // Simplified for example
}
```

### **Step 2.4: Setup Real-time Client**

```typescript
// src/features/links/lib/supabase-client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Real-time channel setup for links
export const createLinksChannel = (userId: string) => {
  return supabase
    .channel(`links:user:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'links',
        filter: `user_id=eq.${userId}`,
      },
      payload => {
        console.log('Link change:', payload);
      }
    )
    .subscribe();
};
```

---

## 🎨 **Phase 3: Component Integration (NEXT PHASE)**

### **Step 3.1: Enhance Existing Links Store**

Modify your existing links store to work with the database:

```typescript
// src/features/links/store/links-store.ts (ENHANCED)
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  createLinkAction,
  updateLinkAction,
  deleteLinkAction,
} from '../lib/actions';
import type { LinkWithStats } from '@/lib/supabase/types';
import type { CreateLinkData, UpdateLinkData } from '../schemas';

interface LinksStore {
  // State
  links: LinkWithStats[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setInitialData: (links: LinkWithStats[]) => void;
  createLink: (data: CreateLinkData) => Promise<void>;
  updateLink: (id: string, data: UpdateLinkData) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;

  // Real-time sync
  syncLinkUpdate: (link: LinkWithStats) => void;
  syncLinkDelete: (linkId: string) => void;

  // Computed
  filteredLinks: () => LinkWithStats[];
}

export const useLinksStore = create<LinksStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    links: [],
    isLoading: false,
    error: null,

    // Initialize with server data
    setInitialData: links => {
      set({ links, isLoading: false, error: null });
    },

    // Optimistic create with server sync
    createLink: async data => {
      const tempId = `temp-${Date.now()}`;
      const optimisticLink: LinkWithStats = {
        id: tempId,
        ...data,
        userId: '',
        workspaceId: '',
        isActive: true,
        fileCount: 0,
        batchCount: 0,
        totalSize: 0,
        fullUrl: `foldly.com/${data.slug}${data.topic ? `/${data.topic}` : ''}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 1. Optimistic update
      set(state => ({
        links: [optimisticLink, ...state.links],
        isLoading: true,
      }));

      try {
        // 2. Server action
        const result = await createLinkAction(data);

        if (result.success && result.data) {
          // 3. Replace optimistic with real data
          set(state => ({
            links: state.links.map(link =>
              link.id === tempId
                ? {
                    ...result.data,
                    fileCount: 0,
                    batchCount: 0,
                    totalSize: 0,
                    fullUrl: optimisticLink.fullUrl,
                  }
                : link
            ),
            isLoading: false,
          }));
        } else {
          throw new Error(result.error || 'Failed to create link');
        }
      } catch (error) {
        // 4. Rollback on error
        set(state => ({
          links: state.links.filter(link => link.id !== tempId),
          error: error instanceof Error ? error.message : 'Unknown error',
          isLoading: false,
        }));
        throw error;
      }
    },

    // Similar implementations for updateLink and deleteLink...
    updateLink: async (id, data) => {
      // Implementation similar to createLink
    },

    deleteLink: async id => {
      // Implementation similar to createLink
    },

    // Real-time sync methods
    syncLinkUpdate: link => {
      set(state => ({
        links: state.links.map(l => (l.id === link.id ? link : l)),
      }));
    },

    syncLinkDelete: linkId => {
      set(state => ({
        links: state.links.filter(l => l.id !== linkId),
      }));
    },

    // Computed getters
    filteredLinks: () => {
      const { links } = get();
      return links.filter(link => link.isActive);
    },
  }))
);
```

### **Step 3.2: Create Server Component for Links Page**

```typescript
// src/app/dashboard/links/page.tsx (NEW SERVER COMPONENT)
import { currentUser } from '@clerk/nextjs/server';
import { linksDbService } from '@/features/links/lib/db-service';
import { LinksContainer } from '@/features/links/components/views/LinksContainer';

export default async function LinksPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Fetch initial data on server
  const initialLinks = await linksDbService.getByUserId(user.id);

  return (
    <div className="links-page">
      <LinksContainer initialData={initialLinks} />
    </div>
  );
}
```

### **Step 3.3: Enhance Existing Components**

Update your existing components to work with real data:

```typescript
// src/features/links/components/views/LinksContainer.tsx (ENHANCED)
'use client';

import { useEffect } from 'react';
import { useLinksStore } from '@/features/links/store/links-store';
import { useRealtimeLinks } from '@/features/links/hooks/use-realtime-links';
import { PopulatedLinksState } from './PopulatedLinksState';
import { EmptyLinksState } from './EmptyLinksState';
import type { LinkWithStats } from '@/lib/supabase/types';

interface LinksContainerProps {
  initialData: LinkWithStats[];
}

export function LinksContainer({ initialData }: LinksContainerProps) {
  const { links, isLoading, setInitialData } = useLinksStore();

  // Initialize real-time subscriptions
  useRealtimeLinks();

  // Set initial data from server
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setInitialData(initialData);
    }
  }, [initialData, setInitialData]);

  if (isLoading) {
    return <div>Loading links...</div>;
  }

  return (
    <div className="links-container">
      {links.length > 0 ? (
        <PopulatedLinksState links={links} />
      ) : (
        <EmptyLinksState />
      )}
    </div>
  );
}
```

### **Step 3.4: Create Real-time Hook**

```typescript
// src/features/links/hooks/use-realtime-links.ts
import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useLinksStore } from '../store/links-store';
import { createLinksChannel } from '../lib/supabase-client';

export const useRealtimeLinks = () => {
  const { user } = useUser();
  const { syncLinkUpdate, syncLinkDelete } = useLinksStore();

  useEffect(() => {
    if (!user) return;

    const channel = createLinksChannel(user.id);

    channel.on('postgres_changes', { event: '*' }, payload => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        syncLinkUpdate(payload.new as any);
      } else if (payload.eventType === 'DELETE') {
        syncLinkDelete(payload.old.id);
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [user, syncLinkUpdate, syncLinkDelete]);
};
```

---

## ✅ **Phase 4: Testing & Validation**

### **Step 4.1: Test Database Operations**

```typescript
// scripts/test-database.ts
import { linksDbService } from '@/features/links/lib/db-service';

async function testDatabaseOperations() {
  try {
    console.log('Testing database operations...');

    // Test create
    const testLink = await linksDbService.create({
      userId: 'test-user-id',
      workspaceId: 'test-workspace-id',
      slug: 'test-user',
      topic: 'test-collection',
      linkType: 'custom',
      title: 'Test Collection',
      description: 'A test collection',
      requireEmail: false,
      requirePassword: false,
      isPublic: true,
      isActive: true,
      maxFiles: 100,
      maxFileSize: 104857600,
      brandEnabled: false,
    });

    console.log('✅ Created link:', testLink);

    // Test update
    const updatedLink = await linksDbService.update(testLink.id, {
      title: 'Updated Test Collection',
    });

    console.log('✅ Updated link:', updatedLink);

    // Test delete
    await linksDbService.delete(testLink.id);
    console.log('✅ Deleted link successfully');

    console.log('🎉 All database operations working correctly!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

// Run the test
testDatabaseOperations();
```

### **Step 4.2: Test Component Integration**

```bash
# Start development server
npm run dev

# Test the following user flows:
# 1. Navigate to /dashboard/links
# 2. Create a new link
# 3. Update an existing link
# 4. Delete a link
# 5. Verify real-time updates work (open multiple tabs)
```

### **Step 4.3: Validate Performance**

```typescript
// Performance testing
import { performance } from 'perf_hooks';

async function testPerformance() {
  const start = performance.now();

  const links = await linksDbService.getByUserId('test-user-id');

  const end = performance.now();
  console.log(`Query took ${end - start} milliseconds`);

  // Target: < 200ms for link queries
  if (end - start < 200) {
    console.log('✅ Performance target met');
  } else {
    console.log('❌ Performance needs optimization');
  }
}
```

---

## 🔧 **Troubleshooting**

### **Common Issues and Solutions**

#### **1. Database Connection Issues**

```bash
# Check database connection
npm run db:check

# Verify environment variables
echo $POSTGRES_URL
echo $NEXT_PUBLIC_SUPABASE_URL
```

#### **2. Schema Generation Issues**

```bash
# Regenerate schema
npm run db:generate

# Check for schema conflicts
npm run db:check
```

#### **3. Type Errors**

```typescript
// Verify type imports
import type { Link, LinkWithStats } from '@/lib/supabase/types';

// Check if types are generated correctly
npm run build
```

#### **4. Real-time Not Working**

```typescript
// Debug real-time connection
import { createLinksChannel } from '@/features/links/lib/supabase-client';

const channel = createLinksChannel('test-user-id');
channel.on('postgres_changes', { event: '*' }, payload => {
  console.log('Real-time event:', payload);
});
```

---

## 📊 **Migration Checklist**

### **✅ Phase 1: Database Foundation (COMPLETED)**

- ✅ Database schema implemented with 6 tables
- ✅ PostgreSQL enums defined
- ✅ Drizzle ORM configured
- ✅ TypeScript types generated
- ✅ Row Level Security policies set
- ✅ MVP simplification completed

### **🎯 Phase 2: Service Layer (IN PROGRESS)**

- ✅ Links database service created (`lib/db-service.ts`)
- ✅ Type alignment fixes and adapter pattern implemented
- [ ] **CRITICAL**: Type migration to database types (`types/`, `components/`, `store/`)
- [ ] Server actions implemented (`lib/actions.ts`)
- [ ] Zod validation schemas defined (`schemas/index.ts`)
- [ ] Real-time client configured (`lib/supabase-client.ts`)

### **📋 Phase 3: Component Integration (NEXT)**

- [ ] Links store enhanced with database integration
- [ ] Real-time hooks created (`hooks/use-realtime-links.ts`)
- [ ] LinksContainer enhanced with server data
- [ ] Server component created (`app/dashboard/links/page.tsx`)

### **📋 Phase 4: Testing & Validation (FINAL)**

- [ ] Database operations tested
- [ ] Component integration verified
- [ ] Real-time updates working
- [ ] Performance targets met (< 200ms)
- [ ] Error handling tested
- [ ] Documentation updated

---

## 🎯 **Next Steps**

1. **CRITICAL PRIORITY**: Complete type alignment and migration (Step 2.2)
2. **Phase 2 Completion**: Implement server actions and validation schemas
3. **Test Service Integration**: Verify all components work with database types
4. **Begin Phase 3**: Start component integration with enhanced stores
5. **Implement Real-time**: Add real-time subscriptions for live updates
6. **Final Testing**: Comprehensive testing of all functionality

---

**Result**: 🚀 **Your links feature will be fully integrated with the database while preserving all existing components and providing excellent performance with real-time capabilities built on the solid foundation that's already in place.**
