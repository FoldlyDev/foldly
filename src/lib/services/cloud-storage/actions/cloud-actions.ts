'use server';

import { auth } from '@clerk/nextjs/server';
import { getCloudStorageToken, disconnectCloudStorage as disconnectProvider } from './oauth-actions';
import type { CloudProvider } from '../providers/types';

/**
 * Connect to a cloud storage provider using Clerk OAuth
 */
export async function connectCloudProvider(provider: CloudProvider['id']) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Map provider ID to Clerk OAuth provider name
  const clerkProvider = provider === 'google-drive' ? 'google' : 'microsoft';
  
  // Get OAuth token from Clerk
  const tokenResult = await getCloudStorageToken(clerkProvider);
  
  if (!tokenResult.success) {
    return { 
      success: false, 
      needsConnection: tokenResult.needsConnection,
      error: tokenResult.error 
    };
  }

  return { 
    success: true, 
    provider,
    token: tokenResult.token,
    email: tokenResult.email 
  };
}

/**
 * Get cloud provider token (for direct API calls)
 */
export async function getCloudProviderToken(provider: CloudProvider['id']) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // Map provider ID to Clerk OAuth provider name
  const clerkProvider = provider === 'google-drive' ? 'google' : 'microsoft';

  // Get OAuth token from Clerk
  const tokenResult = await getCloudStorageToken(clerkProvider);

  return tokenResult;
}

/**
 * Disconnect from a cloud storage provider
 */
export async function disconnectCloudProvider(provider: CloudProvider['id']) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Map provider ID to Clerk OAuth provider name
  const clerkProvider = provider === 'google-drive' ? 'google' : 'microsoft';
  
  // Disconnect the provider
  const result = await disconnectProvider(clerkProvider);
  
  return { 
    success: result.success, 
    provider,
    error: result.error 
  };
}

/**
 * Refresh OAuth token for a cloud provider
 * Note: Clerk handles token refresh automatically, but this is kept for compatibility
 */
export async function refreshCloudProviderToken(provider: CloudProvider['id']) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Clerk automatically refreshes tokens, so we just get a fresh one
  const tokenResult = await getCloudProviderToken(provider);

  return {
    success: tokenResult.success,
    provider,
    token: tokenResult.token
  };
}