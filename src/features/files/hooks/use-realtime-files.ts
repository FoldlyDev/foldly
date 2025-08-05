/**
 * Real-time Files Hook - Subscribes to file/folder updates
 */

'use client';

import { useEffect, useRef } from 'react';
import { getSupabaseClient } from '@/lib/config/supabase-client';
import { useAuth } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import { filesQueryKeys } from '../lib/query-keys';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

interface FileUpdatePayload {
  type: 'file_added' | 'folder_added' | 'file_deleted' | 'folder_deleted' | 'batch_completed';
  linkId: string;
  fileId?: string;
  folderId?: string;
  batchId?: string;
  userId: string;
}

export function useRealtimeFiles(linkId?: string) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Initialize Supabase client
    if (!supabaseRef.current) {
      supabaseRef.current = getSupabaseClient();
    }

    const supabase = supabaseRef.current;

    // Subscribe to file updates channel
    // If linkId is provided, subscribe to link-specific channel
    // Otherwise subscribe to user's workspace channel
    const channelName = linkId 
      ? `files:link:${linkId}` 
      : `files:user:${userId}`;
    
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'file_update' }, (payload) => {
        const data = payload.payload as FileUpdatePayload;
        handleFileUpdate(data);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Connected to real-time files channel: ${channelName}`);
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
  }, [userId, linkId]);

  const handleFileUpdate = async (data: FileUpdatePayload) => {
    console.log('Real-time file update received:', data);
    
    // Invalidate relevant queries to trigger refetch
    switch (data.type) {
      case 'file_added':
      case 'folder_added':
      case 'batch_completed':
        // Invalidate the main links with files query used by FilesContainer
        await queryClient.invalidateQueries({
          queryKey: filesQueryKeys.linksWithFiles(),
        });
        
        // Invalidate specific link files if linkId provided
        if (data.linkId) {
          await queryClient.invalidateQueries({
            queryKey: filesQueryKeys.linkFiles(data.linkId),
          });
          
          // Also invalidate workspace-related queries
          await queryClient.invalidateQueries({
            queryKey: filesQueryKeys.workspace(),
          });
        }
        
        // Invalidate all files queries to ensure everything refreshes
        await queryClient.invalidateQueries({
          queryKey: filesQueryKeys.all,
        });
        
        // Also invalidate storage queries to update storage usage
        await queryClient.invalidateQueries({
          queryKey: filesQueryKeys.storage(),
        });
        break;
        
      case 'file_deleted':
      case 'folder_deleted':
        // Invalidate queries after deletion
        await queryClient.invalidateQueries({
          queryKey: filesQueryKeys.linksWithFiles(),
        });
        
        if (data.linkId) {
          await queryClient.invalidateQueries({
            queryKey: filesQueryKeys.linkFiles(data.linkId),
          });
        }
        
        await queryClient.invalidateQueries({
          queryKey: filesQueryKeys.all,
        });
        break;
    }
    
    console.log('Queries invalidated for update type:', data.type);
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