/**
 * Real-time Notifications Hook - Subscribes to upload notifications
 */

'use client';

import { useEffect, useRef } from 'react';
import { getSupabaseClient } from '@/lib/config/supabase-client';
import { useAuth } from '@clerk/nextjs';
import { useNotificationStore } from '../store/notification-store';
import { showLinkUploadNotification } from '../utils/upload-notifications';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

interface NotificationPayload {
  type: 'new_upload' | 'notification_read';
  linkId: string;
  notificationId?: string;
  fileCount?: number;
  folderCount?: number;
  uploaderName?: string;
  linkTitle?: string;
}

export function useRealtimeNotifications() {
  const { userId } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);
  
  const {
    incrementUnreadCount,
    addRecentNotification,
    markAsRead,
    setUnreadCounts,
    setLoading,
  } = useNotificationStore();

  useEffect(() => {
    if (!userId) return;

    // Initialize Supabase client
    if (!supabaseRef.current) {
      supabaseRef.current = getSupabaseClient();
    }

    const supabase = supabaseRef.current;

    // Subscribe to the same channel the links feature uses: files:user:${userId}
    // This receives the file_update broadcast when batches complete
    const channel = supabase.channel(`files:user:${userId}`)
      .on('broadcast', { event: 'file_update' }, (payload) => {
        const data = payload.payload as any;
        console.log('[Notifications] File update received:', data);

        // Handle batch completion notifications
        if (data.type === 'batch_completed') {
          // Show toast notification immediately
          showLinkUploadNotification({
            linkId: data.linkId,
            linkTitle: data.linkTitle || 'your link',
            fileCount: data.fileCount || 0,
            folderCount: 0, // Not tracked in current payload
          });

          // Refresh counts to pick up the notification created by database trigger
          fetchInitialCounts();

          // Note: The database trigger creates the actual notification record
          // We don't need to add it to the store here, fetchInitialCounts will get it
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Notifications] Connected to real-time channel');
          // Successfully connected - fetch initial counts
          fetchInitialCounts();
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
  }, [userId]);


  const fetchInitialCounts = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/unread-counts');
      if (response.ok) {
        const counts = await response.json();
        setUnreadCounts(counts);
      }
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    isConnected: !!channelRef.current,
    reconnect: () => {
      if (channelRef.current) {
        channelRef.current.subscribe();
      }
    },
  };
}