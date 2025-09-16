/**
 * Real-time Link Updates Hook - Subscribes to link stat updates
 * Updates link stats when files are added/removed
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/config/supabase-client';
import { useAuth } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import { linksQueryKeys } from '../lib/query-keys';
import { useNotificationStore } from '@/features/notifications/store/notification-store';
import { eventBus, NotificationEventType } from '@/features/notifications/core';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

interface LinkUpdatePayload {
  type: 'file_added' | 'file_deleted' | 'batch_completed' | 'link_created';
  linkId: string;
  fileId?: string;
  batchId?: string;
  userId: string;
  uploaderName?: string;
  fileCount?: number;
  linkTitle?: string;
}

export function useRealtimeLinkUpdates() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  const handleLinkUpdate = useCallback(async (data: LinkUpdatePayload) => {
    console.log('Links: Real-time update received:', data);

    // Handle different update types
    switch (data.type) {
      case 'batch_completed':
        // The database trigger will create the actual notification
        // We just need to refresh the counts and show a toast
        if (data.linkId) {
          // Refresh notification counts from the server
          // This will pick up the notification created by the database trigger
          useNotificationStore.getState().refreshUnreadCounts();

          // Emit a notification event for the UI to display a toast
          eventBus.emitNotification(NotificationEventType.LINK_BATCH_UPLOAD, {
            linkId: data.linkId,
            linkTitle: data.linkTitle || 'Your link',
            uploaderName: data.uploaderName || 'Someone',
            fileCount: data.fileCount || 0,
          });
        }
        break;

      case 'file_added':
      case 'file_deleted':
      case 'link_created':
        // These don't need notifications, just query invalidation
        break;
    }

    // Always invalidate queries to update stats
    // Invalidate all link lists to update stats
    await queryClient.invalidateQueries({
      queryKey: linksQueryKeys.lists(),
    });

    // Invalidate specific link detail if linkId provided
    if (data.linkId) {
      await queryClient.invalidateQueries({
        queryKey: linksQueryKeys.detail(data.linkId),
      });
    }

    // Invalidate stats query
    await queryClient.invalidateQueries({
      queryKey: linksQueryKeys.stats(),
    });

    console.log('Links: Queries invalidated for update type:', data.type);
  }, [queryClient]);

  useEffect(() => {
    if (!userId) return;

    // Initialize Supabase client
    if (!supabaseRef.current) {
      supabaseRef.current = getSupabaseClient();
    }

    const supabase = supabaseRef.current;

    // Subscribe to user's file updates channel
    const channelName = `files:user:${userId}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'file_update' }, (payload) => {
        const data = payload.payload as LinkUpdatePayload;
        handleLinkUpdate(data);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Links: Connected to real-time channel: ${channelName}`);
        } else if (status === 'CHANNEL_ERROR') {
          // Silently retry connection after 5 seconds
          setTimeout(() => {
            if (channelRef.current) {
              channelRef.current.subscribe();
            }
          }, 5000);
        }
      });

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, handleLinkUpdate]);

  return {
    isConnected: !!channelRef.current,
    reconnect: () => {
      if (channelRef.current) {
        channelRef.current.subscribe();
      }
    },
  };
}