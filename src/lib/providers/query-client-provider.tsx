'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false, // Critical: Prevent aggressive refetching on tab switch
            refetchOnMount: false, // Prevent refetch on component mount if data exists
            refetchOnReconnect: 'always', // Only refetch on network reconnect
            retry: 2, // Reduced from 3 to 2 for faster error handling
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000), // Max 10s delay
            networkMode: 'online', // Only fetch when online
          },
          mutations: {
            retry: 1,
            networkMode: 'online',
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom-right"
          toggleButtonProps={{
            style: {
              backgroundColor: 'var(--primary)',
              borderRadius: '8px',
            }
          }}
        />
      )}
    </QueryClientProvider>
  );
}
