# Implementation Guide: React Query + Server Actions Hybrid

## 1. Query Client Setup

### Query Client Provider

```typescript
// src/lib/providers/query-client-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        retry: 3,
      },
      mutations: {
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Layout Integration

```typescript
// src/app/layout.tsx
import { QueryProvider } from '@/lib/providers/query-client-provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

## 2. Query Keys Factory

```typescript
// src/features/links/lib/query-keys.ts
import type { DatabaseId } from '@/lib/supabase/types';

export const linksKeys = {
  all: ['links'] as const,
  lists: () => [...linksKeys.all, 'list'] as const,
  list: (filters: string) => [...linksKeys.lists(), { filters }] as const,
  details: () => [...linksKeys.all, 'detail'] as const,
  detail: (id: DatabaseId) => [...linksKeys.details(), id] as const,
  stats: () => [...linksKeys.all, 'stats'] as const,
} as const;
```

## 3. Query Hooks

### Links List Query

```typescript
// src/features/links/hooks/use-links-query.ts
import { useQuery } from '@tanstack/react-query';
import { fetchLinksAction } from '../lib/actions';
import { linksKeys } from '../lib/query-keys';
import type { LinkWithStats } from '@/lib/supabase/types';

interface UseLinksQueryOptions {
  includeInactive?: boolean;
  initialData?: LinkWithStats[];
}

export function useLinksQuery(options: UseLinksQueryOptions = {}) {
  return useQuery({
    queryKey: linksKeys.list(JSON.stringify(options)),
    queryFn: async () => {
      const result = await fetchLinksAction(options);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    initialData: options.initialData,
    staleTime: 5 * 60 * 1000,
  });
}
```

### Individual Link Query

```typescript
// src/features/links/hooks/use-link-query.ts
import { useQuery } from '@tanstack/react-query';
import { fetchLinkByIdAction } from '../lib/actions';
import { linksKeys } from '../lib/query-keys';
import type { DatabaseId, LinkWithStats } from '@/lib/supabase/types';

export function useLinkQuery(linkId: DatabaseId) {
  return useQuery({
    queryKey: linksKeys.detail(linkId),
    queryFn: async () => {
      const result = await fetchLinkByIdAction(linkId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!linkId,
  });
}
```

## 4. Mutation Hooks

### Create Link Mutation

```typescript
// src/features/links/hooks/use-create-link-mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLinkAction } from '../lib/actions';
import { linksKeys } from '../lib/query-keys';
import type { LinkInsert, Link } from '@/lib/supabase/types';

export function useCreateLinkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLinkAction,
    onMutate: async (newLink: LinkInsert) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: linksKeys.all });

      // Snapshot previous value
      const previousLinks = queryClient.getQueryData(linksKeys.lists());

      // Optimistically update
      queryClient.setQueryData(linksKeys.lists(), (old: Link[] = []) => [
        ...old,
        {
          ...newLink,
          id: `temp-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Link,
      ]);

      return { previousLinks };
    },
    onError: (err, newLink, context) => {
      // Rollback on error
      if (context?.previousLinks) {
        queryClient.setQueryData(linksKeys.lists(), context.previousLinks);
      }
    },
    onSettled: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: linksKeys.all });
    },
  });
}
```

### Update Link Mutation

```typescript
// src/features/links/hooks/use-update-link-mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateLinkAction } from '../lib/actions';
import { linksKeys } from '../lib/query-keys';
import type { DatabaseId, LinkUpdate, Link } from '@/lib/supabase/types';

export function useUpdateLinkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updates }: LinkUpdate & { id: DatabaseId }) =>
      updateLinkAction(id, updates),
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: linksKeys.detail(id) });

      const previousLink = queryClient.getQueryData(linksKeys.detail(id));

      queryClient.setQueryData(linksKeys.detail(id), (old: Link) => ({
        ...old,
        ...updates,
        updatedAt: new Date(),
      }));

      return { previousLink };
    },
    onError: (err, { id }, context) => {
      if (context?.previousLink) {
        queryClient.setQueryData(linksKeys.detail(id), context.previousLink);
      }
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: linksKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: linksKeys.lists() });
    },
  });
}
```

## 5. RSC Integration

### Server Page with Prefetching

```typescript
// src/app/dashboard/links/page.tsx
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { fetchLinksAction } from '@/features/links/lib/actions';
import { linksKeys } from '@/features/links/lib/query-keys';
import { LinksContainer } from '@/features/links';

export default async function LinksPage() {
  const queryClient = getQueryClient();

  // Prefetch data on the server
  await queryClient.prefetchQuery({
    queryKey: linksKeys.lists(),
    queryFn: async () => {
      const result = await fetchLinksAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LinksContainer />
    </HydrationBoundary>
  );
}
```

### Server Query Client

```typescript
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';

export const getQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,
          gcTime: 10 * 60 * 1000,
        },
      },
    })
);
```

## 6. Component Integration

### Updated LinksContainer

```typescript
// src/features/links/components/containers/LinksContainer.tsx
'use client';

import { useLinksQuery } from '../../hooks/use-links-query';
import { EmptyLinksState } from '../views/EmptyLinksState';
import { PopulatedLinksState } from '../views/PopulatedLinksState';
import { LoadingState } from '../views/LoadingState';
import { ErrorState } from '../views/ErrorState';

export function LinksContainer() {
  const { data: links, isLoading, error } = useLinksQuery();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!links || links.length === 0) return <EmptyLinksState />;

  return <PopulatedLinksState links={links} />;
}
```

## 7. Error Handling

```typescript
// src/features/links/components/views/ErrorState.tsx
'use client';

import { useQueryClient } from '@tanstack/react-query';
import { linksKeys } from '../../lib/query-keys';

interface ErrorStateProps {
  error: Error;
}

export function ErrorState({ error }: ErrorStateProps) {
  const queryClient = useQueryClient();

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: linksKeys.all });
  };

  return (
    <div className="error-state">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={handleRetry}>Try Again</button>
    </div>
  );
}
```

## 8. Types Integration

All types are imported from the single source of truth:

```typescript
// All hooks and components import from:
import type {
  Link,
  LinkInsert,
  LinkUpdate,
  LinkWithStats,
  DatabaseId,
  DatabaseResult,
} from '@/lib/supabase/types';
```

## 9. DevTools Configuration

```typescript
// src/lib/providers/query-client-provider.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// In development only
{process.env.NODE_ENV === 'development' && (
  <ReactQueryDevtools initialIsOpen={false} />
)}
```
