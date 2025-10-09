import { createClient, SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// CENTRALIZED SUPABASE CLIENT - Singleton Pattern
// =============================================================================
// Prevents multiple GoTrueClient instances and ensures consistent configuration

function createSupabaseClient(): SupabaseClient {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Use unique storage key to prevent multiple instances
        storageKey: 'foldly-auth-session',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'X-Client-Info': '@supabase/foldly-app',
        },
      },
    }
  );
}

// Singleton instance - only create one client per browser session
let browserSupabaseClient: SupabaseClient | undefined = undefined;

export function getSupabaseClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Server: always create a new client (for SSR)
    return createSupabaseClient();
  } else {
    // Browser: reuse the same client instance
    if (!browserSupabaseClient) {
      browserSupabaseClient = createSupabaseClient();
    }
    return browserSupabaseClient;
  }
}

// =============================================================================
// SINGLE CLIENT APPROACH - No separate realtime client
// =============================================================================
// Use the same client for all operations to prevent multiple instances

// For backward compatibility, getRealtimeClient() now returns the same client
export function getRealtimeClient(): SupabaseClient {
  return getSupabaseClient();
}

// =============================================================================
// EXPORTS
// =============================================================================

// Type export
export type { SupabaseClient };
