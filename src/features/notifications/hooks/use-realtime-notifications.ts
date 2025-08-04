/**
 * Real-time Notifications Hook - Subscribes to upload notifications
 */

'use client';

import { useEffect, useRef } from 'react';
import { getSupabaseClient } from '@/lib/config/supabase-client';
import { useAuth } from '@clerk/nextjs';
import { useNotificationStore } from '../store/notification-store';
import { showUploadNotification } from '../utils/upload-notifications';
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

    // Subscribe to user-specific notification channel
    const channel = supabase.channel(`notifications:${userId}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'notification' }, (payload) => {
        const data = payload.payload as NotificationPayload;
        
        switch (data.type) {
          case 'new_upload':
            handleNewUpload(data);
            break;
          case 'notification_read':
            if (data.notificationId) {
              markAsRead(data.notificationId);
            }
            break;
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Successfully connected to notifications channel
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

  const handleNewUpload = async (data: NotificationPayload) => {
    // Use link title from the notification payload
    const linkTitle = data.linkTitle || 'your link';

    // Show toast notification
    showUploadNotification({
      linkId: data.linkId,
      linkTitle: linkTitle || 'your link',
      uploaderName: data.uploaderName || 'Someone',
      fileCount: data.fileCount || 0,
      folderCount: data.folderCount || 0,
    });

    // Fetch the actual count from the server instead of incrementing locally
    // This prevents double counting since the server already incremented the count
    fetchInitialCounts();
    
    // Add to recent notifications if we have details
    if (data.notificationId) {
      addRecentNotification({
        id: data.notificationId,
        linkId: data.linkId,
        linkTitle: linkTitle || 'Link',
        title: `New upload to ${linkTitle}`,
        description: `${data.fileCount || 0} files and ${data.folderCount || 0} folders from ${data.uploaderName}`,
        metadata: {
          fileCount: data.fileCount,
          folderCount: data.folderCount,
          uploaderName: data.uploaderName,
        },
        isRead: false,
        createdAt: new Date(),
      });
    }
  };

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