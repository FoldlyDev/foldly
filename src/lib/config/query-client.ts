import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache for 5 minutes (stale time) - data is considered fresh
        staleTime: 5 * 60 * 1000,
        // Garbage collect after 10 minutes of being unused
        gcTime: 10 * 60 * 1000,

        // Performance optimizations
        refetchOnWindowFocus: false, // Prevent unnecessary refetches
        refetchOnMount: true, // Refetch when component mounts
        refetchOnReconnect: true, // Refetch when reconnecting

        // Retry strategy with exponential backoff
        retry: (failureCount, error) => {
          // Don't retry on 401/403 errors
          if (
            error instanceof Error &&
            error.message.includes('Unauthorized')
          ) {
            return false;
          }
          return failureCount < 3;
        },
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Network optimizations
        networkMode: 'online', // Only run when online

        // Structural sharing to prevent unnecessary re-renders
        structuralSharing: true,
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
        retryDelay: 1000,

        // Network optimizations
        networkMode: 'online',

        // Mutation callbacks for better error handling
        onError: (error, variables, context) => {
          console.error('Mutation error:', error);
          // Could integrate with error tracking service here
        },

        onSuccess: (data, variables, context) => {
          console.log('Mutation success:', data);
          // Could integrate with analytics here
        },
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
