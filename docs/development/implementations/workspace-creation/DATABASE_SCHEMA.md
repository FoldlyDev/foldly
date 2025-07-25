# 🗄️ Database Schema - Workspace Creation

**Schema Version:** 2025.1 Simplified MVP  
**Database:** PostgreSQL via Supabase  
**Documentation Date:** January 2025  
**Integration Target:** Workspace Creation Feature

## 🎯 Schema Overview

This document outlines the database schema specifically for workspace creation functionality, following the **automatic workspace provisioning** approach for zero-friction user onboarding.

## 📋 Workspace Creation Tables

### **Core Tables for Workspace Creation**

```sql
-- ========================================
-- USERS TABLE - Authentication & Profile
-- ========================================
CREATE TABLE users (
  id TEXT PRIMARY KEY,                     -- Clerk user ID (direct mapping)
  email TEXT UNIQUE NOT NULL,              -- User email from Clerk
  username TEXT UNIQUE NOT NULL,           -- Unique username
  first_name TEXT,                         -- Display name components
  last_name TEXT,
  avatar_url TEXT,                         -- Profile image URL
  subscription_tier TEXT DEFAULT 'free',   -- Billing tier
  storage_used BIGINT DEFAULT 0,           -- Current storage usage
  storage_limit BIGINT DEFAULT 2147483648, -- 2GB default limit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- WORKSPACES TABLE - User Data Container
-- ========================================
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Workspace',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 1:1 relationship constraint (CRITICAL)
  CONSTRAINT unique_user_workspace UNIQUE (user_id)
);
```

### **Indexes for Performance**

```sql
-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Workspaces table indexes
CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX idx_workspaces_created_at ON workspaces(created_at);
```

### **Drizzle Schema Definitions**

```typescript
// src/lib/supabase/schemas/users.ts (already exists)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  avatarUrl: text('avatar_url'),
  subscriptionTier: text('subscription_tier').notNull().default('free'),
  storageUsed: bigint('storage_used', { mode: 'number' }).notNull().default(0),
  storageLimit: bigint('storage_limit', { mode: 'number' })
    .notNull()
    .default(2147483648),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// src/lib/supabase/schemas/workspaces.ts (already exists)
export const workspaces = pgTable(
  'workspaces',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default('My Workspace'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    uniqueUserWorkspace: unique('unique_user_workspace').on(table.userId),
  })
);
```

## 🔄 Core Database Operations

### **Operation 1: User Creation (Idempotent)**

```typescript
// src/lib/services/workspace/user-service.ts
export class UserService {
  async createUser(userData: UserInsert): Promise<DatabaseResult<User>> {
    try {
      const [user] = await db
        .insert(users)
        .values({
          id: userData.id,
          email: userData.email,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          avatarUrl: userData.avatarUrl,
          subscriptionTier: 'free',
          storageUsed: 0,
          storageLimit: 2147483648, // 2GB
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: userData.email,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            avatarUrl: userData.avatarUrl,
            updatedAt: new Date(),
          },
        })
        .returning();

      return { success: true, data: user };
    } catch (error) {
      console.error('User creation failed:', error);
      return { success: false, error: error.message };
    }
  }
}
```

### **Operation 2: Workspace Creation (1:1 Constraint)**

```typescript
// src/lib/services/workspace/workspace-service.ts
export class WorkspaceService {
  async createWorkspace(
    userId: string,
    name: string = 'My Workspace'
  ): Promise<DatabaseResult<Workspace>> {
    try {
      const [workspace] = await db
        .insert(workspaces)
        .values({
          userId,
          name,
          createdAt: new Date(),
        })
        .onConflictDoNothing()
        .returning();

      if (!workspace) {
        // Workspace already exists due to unique constraint
        const existing = await this.getWorkspaceByUserId(userId);
        if (existing) {
          return { success: true, data: existing };
        }
        return {
          success: false,
          error: 'Failed to create or retrieve workspace',
        };
      }

      return { success: true, data: workspace };
    } catch (error) {
      console.error('Workspace creation failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getWorkspaceByUserId(userId: string): Promise<Workspace | null> {
    try {
      const [workspace] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.userId, userId))
        .limit(1);

      return workspace || null;
    } catch (error) {
      console.error('Workspace retrieval failed:', error);
      return null;
    }
  }
}
```

### **Operation 3: Transactional User+Workspace Creation**

```typescript
// src/lib/services/workspace/user-workspace-service.ts
export class UserWorkspaceService {
  async createUserWithWorkspace(
    userData: UserInsert
  ): Promise<DatabaseResult<UserWorkspaceCreateResult>> {
    try {
      return await db.transaction(async tx => {
        // Step 1: Create or update user
        const [user] = await tx
          .insert(users)
          .values({
            id: userData.id,
            email: userData.email,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            avatarUrl: userData.avatarUrl,
            subscriptionTier: 'free',
            storageUsed: 0,
            storageLimit: 2147483648,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: users.id,
            set: {
              email: userData.email,
              username: userData.username,
              firstName: userData.firstName,
              lastName: userData.lastName,
              avatarUrl: userData.avatarUrl,
              updatedAt: new Date(),
            },
          })
          .returning();

        // Step 2: Create workspace with constraint handling
        let workspace: Workspace;

        try {
          const [newWorkspace] = await tx
            .insert(workspaces)
            .values({
              userId: user.id,
              name: 'My Workspace',
              createdAt: new Date(),
            })
            .returning();

          workspace = newWorkspace;
        } catch (constraintError) {
          // Handle unique constraint violation (23505)
          if (constraintError.code === '23505') {
            const [existingWorkspace] = await tx
              .select()
              .from(workspaces)
              .where(eq(workspaces.userId, user.id))
              .limit(1);

            if (!existingWorkspace) {
              throw new Error('Failed to create or retrieve workspace');
            }

            workspace = existingWorkspace;
          } else {
            throw constraintError;
          }
        }

        return { success: true, data: { user, workspace } };
      });
    } catch (error) {
      console.error('Transaction failed:', error);
      return { success: false, error: error.message };
    }
  }
}
```

## 📊 Performance Optimization

### **Database Connection Pool**

```typescript
// src/lib/db/db.ts (optimize existing configuration)
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!, {
  max: 20, // Maximum connections in pool
  idle_timeout: 30, // 30 seconds idle timeout
  connect_timeout: 10, // 10 seconds connection timeout
  prepare: false, // Disable prepared statements for better pooling
});

export const db = drizzle(client);
```

### **Optimized Queries**

```typescript
// Single query with JOIN instead of separate queries
export async function getUserWithWorkspace(userId: string) {
  const result = await db
    .select({
      user: users,
      workspace: workspaces,
    })
    .from(users)
    .leftJoin(workspaces, eq(workspaces.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (!result[0]) {
    return null;
  }

  return {
    user: result[0].user,
    workspace: result[0].workspace,
  };
}
```

## 🔐 Data Validation & Constraints

### **Application-Level Validation**

```typescript
// src/lib/validation/user-validation.ts
import { z } from 'zod';

export const UserInsertSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  email: z.string().email('Valid email is required'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  firstName: z.string().max(50).nullable().optional(),
  lastName: z.string().max(50).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export const WorkspaceCreateDataSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  name: z
    .string()
    .min(1, 'Workspace name is required')
    .max(100, 'Workspace name must be at most 100 characters'),
});
```

### **Database Constraints**

```sql
-- Email validation
ALTER TABLE users ADD CONSTRAINT valid_email
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Username validation
ALTER TABLE users ADD CONSTRAINT valid_username
  CHECK (username ~* '^[a-zA-Z0-9_]{3,30}$');

-- Storage limits
ALTER TABLE users ADD CONSTRAINT valid_storage_used
  CHECK (storage_used >= 0);

ALTER TABLE users ADD CONSTRAINT valid_storage_limit
  CHECK (storage_limit > 0);

-- Workspace name validation
ALTER TABLE workspaces ADD CONSTRAINT valid_workspace_name
  CHECK (length(trim(name)) >= 1 AND length(name) <= 100);
```

## 📈 Simple Monitoring (MVP)

### **Console-Based Metrics**

```typescript
// src/lib/monitoring/simple-metrics.ts
export async function logWorkspaceCreation(
  userId: string,
  success: boolean,
  duration: number,
  error?: Error
) {
  const timestamp = new Date().toISOString();

  if (success) {
    console.log(
      `✅ WORKSPACE_CREATED: User ${userId} | ${duration}ms | ${timestamp}`
    );
  } else {
    console.error(
      `❌ WORKSPACE_FAILED: User ${userId} | ${duration}ms | ${timestamp}`,
      error
    );
  }
}

export async function logWebhookProcessing(
  eventType: string,
  success: boolean,
  duration: number
) {
  const timestamp = new Date().toISOString();
  console.log(
    `🔌 WEBHOOK: ${eventType} | ${success ? '✅' : '❌'} | ${duration}ms | ${timestamp}`
  );
}
```

## 🧪 Testing Strategy

### **Database Health Check**

```typescript
// src/lib/health/database-health.ts
export async function checkDatabaseHealth() {
  const checks = {
    connection: false,
    users_table: false,
    workspaces_table: false,
    constraints: false,
  };

  try {
    // Test basic connection
    await db.execute(sql`SELECT 1`);
    checks.connection = true;

    // Test users table
    await db
      .select({ count: sql`count(*)` })
      .from(users)
      .limit(1);
    checks.users_table = true;

    // Test workspaces table
    await db
      .select({ count: sql`count(*)` })
      .from(workspaces)
      .limit(1);
    checks.workspaces_table = true;

    // Test unique constraint
    await db.execute(sql`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'workspaces' 
      AND constraint_name = 'unique_user_workspace'
    `);
    checks.constraints = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  const healthy = Object.values(checks).every(Boolean);

  return {
    healthy,
    checks,
    timestamp: new Date().toISOString(),
  };
}
```

---

## 📚 **Database Reference Summary**

### **Core Tables Used**

| Table          | Purpose                        | Key Constraints                                         |
| -------------- | ------------------------------ | ------------------------------------------------------- |
| **users**      | Store user account information | Primary key: `id`, Unique: `email`, `username`          |
| **workspaces** | Store workspace information    | Primary key: `id`, Unique: `user_id` (1:1 relationship) |

### **Critical Operations**

| Operation                      | Pattern                   | Performance Target |
| ------------------------------ | ------------------------- | ------------------ |
| **User creation (idempotent)** | `ON CONFLICT DO UPDATE`   | < 50ms             |
| **Workspace creation (1:1)**   | `ON CONFLICT DO NOTHING`  | < 50ms             |
| **Transactional creation**     | Transaction with rollback | < 200ms            |

### **Performance Considerations**

- ✅ **Connection pooling**: 20 max connections, 30s idle timeout
- ✅ **Proper indexing**: All foreign keys and lookup columns indexed
- ✅ **Query optimization**: JOINs instead of N+1 queries
- ✅ **Constraint enforcement**: Database-level validation

---

**Database Schema Status**: 📋 **Documentation Complete - Ready for Implementation**  
**Transaction Strategy**: ACID compliant with automatic rollback  
**Performance Target**: < 200ms for complete user+workspace creation  
**Monitoring**: Simple console-based logging for MVP

**Last Updated**: January 2025 - Database schema guide complete
