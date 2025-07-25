# Cleanup Instructions: React Query Migration

## 🗑️ **Phase-by-Phase Cleanup Checklist**

### Phase 1: Dependencies & Setup Cleanup

#### After Installing React Query

- [ ] **Remove unnecessary loading/error state hooks**
  ```typescript
  // REMOVE these patterns from components
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Link[] | null>(null);
  ```

#### After Query Client Setup

- [ ] **Remove manual fetch patterns in components**
  ```typescript
  // REMOVE these useEffect patterns
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/links');
        const data = await response.json();
        setData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  ```

### Phase 2: API Routes Cleanup

#### Files to DELETE

- [ ] **`src/app/api/links/route.ts`** - Replace with Server Actions
- [ ] **Any API route handlers in `/api/links/*`**

#### Imports to REMOVE

- [ ] **Remove API route imports from components**
  ```typescript
  // REMOVE these imports
  import { fetchLinksFromAPI } from '@/lib/api/links';
  import { createLinkAPI } from '@/lib/api/links';
  ```

### Phase 3: Server Actions Cleanup

#### Files to MODIFY

- [ ] **`src/features/links/lib/actions/create.ts`**
  - Remove HTTP response handling
  - Return plain data objects
  - Remove `redirect()` calls (handle in components)

- [ ] **`src/features/links/lib/actions/update.ts`**
  - Remove HTTP response handling
  - Return plain data objects

- [ ] **`src/features/links/lib/actions/delete.ts`**
  - Remove HTTP response handling
  - Return plain data objects

#### Patterns to REMOVE

```typescript
// REMOVE these patterns from server actions
export async function createLink(formData: FormData) {
  // Remove redirect() calls
  redirect('/dashboard/links');

  // Remove Response objects
  return Response.json({ success: true });

  // Remove error handling that returns responses
  return Response.json({ error: 'Failed' }, { status: 500 });
}
```

### Phase 4: Component Cleanup

#### Loading States

- [ ] **Remove manual loading state management**

  ```typescript
  // REMOVE these patterns
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Replace with React Query states
  const { isLoading, isPending } = useLinksQuery();
  ```

#### Error States

- [ ] **Remove manual error handling**

  ```typescript
  // REMOVE these patterns
  const [error, setError] = useState<string | null>(null);

  try {
    // operation
  } catch (err) {
    setError(err.message);
  }

  // Replace with React Query error handling
  const { error, isError } = useLinksQuery();
  ```

#### Data Fetching

- [ ] **Remove manual data fetching in components**

  ```typescript
  // REMOVE these patterns
  useEffect(() => {
    fetchData();
  }, []);

  // Replace with React Query hooks
  const { data: links } = useLinksQuery();
  ```

### Phase 5: Hooks Cleanup

#### Files to REVIEW & CLEAN

- [ ] **`src/features/links/hooks/index.ts`**
  - Remove data fetching hooks
  - Keep only UI-related hooks

- [ ] **`src/features/links/hooks/use-create-link-form.ts`**
  - Remove manual submission logic
  - Integrate with React Query mutations

- [ ] **`src/features/links/hooks/use-link-card-actions.ts`**
  - Remove manual API calls
  - Integrate with React Query mutations

#### Patterns to REMOVE

```typescript
// REMOVE these custom hooks patterns
export function useLinksData() {
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLinks = async () => {
    setIsLoading(true);
    // manual fetch logic
    setIsLoading(false);
  };

  return { links, isLoading, fetchLinks };
}
```

### Phase 6: Utility Functions Cleanup

#### Files to REVIEW

- [ ] **`src/features/links/utils/`** - Remove any data fetching utilities
- [ ] **`src/lib/utils/`** - Remove any links-specific data fetching utilities

#### Patterns to REMOVE

```typescript
// REMOVE these utility functions
export async function fetchLinksFromAPI() {
  const response = await fetch('/api/links');
  return response.json();
}

export async function createLinkAPI(data: LinkInsert) {
  const response = await fetch('/api/links', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}
```

### Phase 7: Final Cleanup

#### Unused Imports

- [ ] **Run automated import cleanup**
  ```bash
  # Use your IDE's "Organize Imports" feature
  # Or run ESLint with auto-fix
  npx eslint --fix src/features/links/
  ```

#### Unused Files

- [ ] **Remove any remaining unused files**
  - Empty hook files
  - Unused utility files
  - Old API route files

#### Type Definitions

- [ ] **Clean up unnecessary type definitions**

  ```typescript
  // REMOVE these if unused after migration
  interface APIResponse<T> {
    data: T;
    error?: string;
  }

  interface LoadingState {
    isLoading: boolean;
    error: string | null;
  }
  ```

## 🧹 **Automated Cleanup Script**

Create a cleanup script to run after migration:

```bash
#!/bin/bash
# cleanup-migration.sh

echo "🧹 Starting React Query Migration Cleanup..."

# Remove API routes
rm -rf src/app/api/links/

# Remove unused imports (requires eslint-plugin-unused-imports)
npx eslint --fix src/features/links/ --ext .ts,.tsx

# Remove unused files
find src/features/links/ -name "*.ts" -o -name "*.tsx" | xargs grep -L "export" | xargs rm -f

echo "✅ Cleanup completed!"
```

## 🔍 **Post-Migration Verification**

### Check for Unused Code

- [ ] **Search for unused patterns**

  ```bash
  # Search for manual loading states
  grep -r "useState.*Loading" src/features/links/

  # Search for manual error states
  grep -r "useState.*Error" src/features/links/

  # Search for manual fetch calls
  grep -r "fetch.*api/links" src/features/links/
  ```

### Verify All Imports

- [ ] **Check all import statements are used**
- [ ] **Remove any commented-out code**
- [ ] **Update index.ts export files**

## 🎯 **Success Criteria**

✅ **Migration cleanup is complete when:**

- No manual loading/error states remain
- No API route files exist
- No unused imports in any files
- All components use React Query patterns
- Build runs without warnings
- All tests pass
- No commented-out code remains
