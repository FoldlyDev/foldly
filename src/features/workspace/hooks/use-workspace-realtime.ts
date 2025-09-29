'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getRealtimeClient } from '@/lib/config/supabase-client';
import { workspaceQueryKeys } from '../lib/query-keys';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

/**
 * Realtime hook that subscribes to workspace, files, and folders changes
 * and invalidates React Query cache with debounced updates to prevent race conditions
 */
export function useWorkspaceRealtime(workspaceId?: string) {
  const queryClient = useQueryClient();
  const supabase = getRealtimeClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const invalidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [connectionState, setConnectionState] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('disconnected');

  // Debounced invalidation to batch multiple rapid changes
  const debouncedInvalidation = useCallback(() => {
    if (invalidationTimeoutRef.current) {
      clearTimeout(invalidationTimeoutRef.current);
    }

    invalidationTimeoutRef.current = setTimeout(() => {
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.data(),
      });
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.stats(),
      });
    }, 200); // Reduced from 500ms to 200ms for better responsiveness
  }, [queryClient]);

  useEffect(() => {
    if (!workspaceId) {
      setConnectionState('disconnected');
      return;
    }

    setConnectionState('connecting');

    // Create a single channel for all workspace-related subscriptions
    const channel = supabase
      .channel(`workspace-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspaces',
          filter: `id=eq.${workspaceId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {

          // Invalidate workspace settings and tree
          queryClient.invalidateQueries({
            queryKey: workspaceQueryKeys.settings(),
          });
          queryClient.invalidateQueries({
            queryKey: workspaceQueryKeys.data(),
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folders',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          // Use debounced invalidation to batch multiple rapid changes
          debouncedInvalidation();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          // Use debounced invalidation to batch multiple rapid changes
          debouncedInvalidation();
        }
      )
      .subscribe(status => {

        // Update connection state based on subscription status
        switch (status) {
          case 'SUBSCRIBED':
            setConnectionState('connected');
            break;
          case 'TIMED_OUT':
          case 'CLOSED':
            setConnectionState('disconnected');
            break;
          case 'CHANNEL_ERROR':
            setConnectionState('disconnected');
            break;
          default:
            setConnectionState('connecting');
        }
      });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      // Clear any pending invalidation
      if (invalidationTimeoutRef.current) {
        clearTimeout(invalidationTimeoutRef.current);
        invalidationTimeoutRef.current = null;
      }

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setConnectionState('disconnected');
      }
    };
  }, [workspaceId, queryClient, supabase, debouncedInvalidation]);

  return {
    isSubscribed: connectionState === 'connected',
    connectionState,
  };
}
