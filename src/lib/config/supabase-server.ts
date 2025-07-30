import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

// =============================================================================
// SERVER-SIDE SUPABASE CLIENT - With Clerk Integration
// =============================================================================

/**
 * Create an authenticated Supabase client for server-side use
 * This client uses Clerk's JWT for authentication with Supabase
 */
export async function createServerSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  const { getToken } = await auth();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          // Pass the Clerk JWT in the Authorization header
          // Supabase will validate this against the Clerk domain configured
          Authorization: `Bearer ${await getToken()}`,
        },
      },
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
}