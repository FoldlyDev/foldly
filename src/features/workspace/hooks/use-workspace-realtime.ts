'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getRealtimeClient } from '@/lib/config/supabase-client';
import { workspaceQueryKeys } from '../lib/query-keys';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

/**
 * Realtime hook that subscribes to workspace, files, and folders changes
 * and invalidates React Query cache for immediate UI updates
 */
export function useWorkspaceRealtime(workspaceId?: string) {
  const queryClient = useQueryClient();
  const supabase = getRealtimeClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [connectionState, setConnectionState] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('disconnected');

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
          console.log('Workspace change detected:', payload);

          // Invalidate workspace settings and tree
          queryClient.invalidateQueries({
            queryKey: workspaceQueryKeys.settings(),
          });
          queryClient.invalidateQueries({
            queryKey: workspaceQueryKeys.tree(),
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
          console.log('Folder change detected:', payload);

          // Invalidate workspace tree and stats for immediate UI updates
          queryClient.invalidateQueries({
            queryKey: workspaceQueryKeys.tree(),
          });
          queryClient.invalidateQueries({
            queryKey: workspaceQueryKeys.stats(),
          });
        }
      )
      .subscribe(status => {
        console.log('Realtime subscription status:', status);

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
      if (channelRef.current) {
        console.log('Unsubscribing from workspace realtime');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setConnectionState('disconnected');
      }
    };
  }, [workspaceId, queryClient, supabase]);

  return {
    isSubscribed: connectionState === 'connected',
    connectionState,
  };
}
