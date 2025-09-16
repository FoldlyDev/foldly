'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getRealtimeClient } from '@/lib/config/supabase-client';
import { useAuth } from '@clerk/nextjs';
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
  const { userId } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const broadcastChannelRef = useRef<RealtimeChannel | null>(null);
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

    // Subscribe to file update broadcasts for this user
    if (userId) {
      const broadcastChannel = supabase
        .channel(`files:user:${userId}`)
        .on('broadcast', { event: 'file_update' }, (payload) => {
          const data = payload.payload as any;
          console.log('[Workspace] File update broadcast received:', data);

          // When a batch completes or files are added, invalidate queries
          if (data.type === 'batch_completed' || data.type === 'file_added') {
            debouncedInvalidation();
          }
        })
        .subscribe();

      broadcastChannelRef.current = broadcastChannel;
    }

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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'links',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          // Listen for link changes (especially generated links) to update folder icons
          // This ensures the hasGeneratedLink flag is updated in real-time
          console.log('[Workspace Realtime] Link change detected:', payload.eventType, payload.new, payload.old);

          // For INSERT/DELETE events on generated links, we need immediate invalidation
          // to ensure the folder icon updates right away
          if (payload.eventType === 'INSERT') {
            // Check if it's a generated link being created
            const newLink = payload.new as any;
            if (newLink?.linkType === 'generated' && newLink?.sourceFolderId) {
              console.log('[Workspace Realtime] Generated link creation detected, immediate invalidation for folder:', newLink.sourceFolderId);
              // Immediate invalidation for generated link creation
              queryClient.invalidateQueries({
                queryKey: workspaceQueryKeys.data(),
              });
              return; // Skip debounced invalidation
            }
          } else if (payload.eventType === 'DELETE') {
            // Check if it was a generated link (old payload contains the deleted record)
            const deletedLink = payload.old as any;
            if (deletedLink?.linkType === 'generated' && deletedLink?.sourceFolderId) {
              console.log('[Workspace Realtime] Generated link deletion detected, immediate invalidation for folder:', deletedLink.sourceFolderId);
              // Immediate invalidation for generated link deletion
              queryClient.invalidateQueries({
                queryKey: workspaceQueryKeys.data(),
              });
              return; // Skip debounced invalidation
            }
          }

          // Use debounced invalidation for other changes
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
      }

      if (broadcastChannelRef.current) {
        supabase.removeChannel(broadcastChannelRef.current);
        broadcastChannelRef.current = null;
      }

      setConnectionState('disconnected');
    };
  }, [workspaceId, userId, queryClient, supabase, debouncedInvalidation]);

  return {
    isSubscribed: connectionState === 'connected',
    connectionState,
  };
}
