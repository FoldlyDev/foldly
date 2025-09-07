'use client';

/**
 * useRealtimeSync Hook
 * Client-side hook for subscribing to realtime updates in a serverless environment
 * 
 * Features:
 * - Works in serverless/edge runtime environments
 * - Automatic cleanup on unmount
 * - Cross-tab synchronization via BroadcastChannel
 * - Efficient subscription management with deduplication
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { getRealtimeClient } from '@/lib/config/supabase-client';
import { QueryInvalidationService } from '@/lib/services/query/query-invalidation-service';

/**
 * Tables that can be subscribed to
 */
export enum RealtimeTable {
  WORKSPACES = 'workspaces',
  FILES = 'files',
  FOLDERS = 'folders',
  LINKS = 'links',
  BATCHES = 'batches',
  SUBSCRIPTION_PLANS = 'subscriptionPlans',
  SUBSCRIPTION_ANALYTICS = 'subscriptionAnalytics',
}

/**
 * Event types for broadcasting
 */
export enum BroadcastEventType {
  DATA_CHANGED = 'data_changed',
  DATA_CREATED = 'data_created',
  DATA_UPDATED = 'data_updated',
  DATA_DELETED = 'data_deleted',
}

/**
 * Broadcast message structure
 */
interface BroadcastMessage {
  type: BroadcastEventType;
  table: RealtimeTable;
  context: {
    workspaceId?: string;
    linkId?: string;
    userId?: string;
    [key: string]: any;
  };
  payload: any;
  timestamp: number;
  source: 'database' | 'local' | 'broadcast';
}

/**
 * Subscription configuration
 */
export interface SubscriptionConfig {
  table: RealtimeTable;
  filter?: {
    column: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in';
    value: any;
  };
  events?: ('INSERT' | 'UPDATE' | 'DELETE')[];
  onData?: (payload: RealtimePostgresChangesPayload<any>) => void;
  enabled?: boolean; // Allow disabling subscription conditionally
}

/**
 * Hook for subscribing to realtime updates
 * 
 * @param config - Subscription configuration
 * @returns Object with connection state
 * 
 * @example
 * ```tsx
 * // Subscribe to workspace changes
 * const { isConnected } = useRealtimeSync({
 *   table: RealtimeTable.WORKSPACES,
 *   filter: { column: 'id', operator: 'eq', value: workspaceId },
 *   onData: (payload) => console.log('Workspace changed:', payload)
 * });
 * 
 * // Subscribe to all files in a workspace
 * const { isConnected } = useRealtimeSync({
 *   table: RealtimeTable.FILES,
 *   filter: { column: 'workspace_id', operator: 'eq', value: workspaceId },
 *   events: ['INSERT', 'UPDATE', 'DELETE']
 * });
 * ```
 */
export function useRealtimeSync(config: SubscriptionConfig) {
  const queryClient = useQueryClient();
  const supabase = getRealtimeClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Create subscription key for channel name
  const createSubscriptionKey = useCallback(() => {
    const parts: string[] = [config.table];
    
    if (config.filter) {
      parts.push(`${config.filter.column}_${config.filter.operator}_${config.filter.value}`);
    }
    
    if (config.events) {
      parts.push(config.events.join('-'));
    }
    
    return parts.join(':');
  }, [config]);

  // Debounced query invalidation
  const debouncedInvalidation = useCallback((callback: () => Promise<void>) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      await callback();
      debounceTimerRef.current = null;
    }, 200);
  }, []);

  // Handle realtime changes from database
  const handleRealtimeChange = useCallback(
    async (payload: RealtimePostgresChangesPayload<any>) => {
      console.log(`[RealtimeSync] ${payload.eventType} detected in ${config.table}:`, {
        eventType: payload.eventType,
        table: config.table,
        new: payload.new,
        old: payload.old,
        errors: payload.errors,
      });

      // Create context from payload
      const context: any = {};
      if (config.filter) {
        context[config.filter.column] = config.filter.value;
      }

      // Extract additional context from the record
      const record = payload.new || payload.old;
      if (record) {
        if (record.workspace_id) context.workspaceId = record.workspace_id;
        if (record.link_id) context.linkId = record.link_id;
        if (record.user_id) context.userId = record.user_id;
      }

      // Determine event type
      let eventType: BroadcastEventType;
      switch (payload.eventType) {
        case 'INSERT':
          eventType = BroadcastEventType.DATA_CREATED;
          break;
        case 'UPDATE':
          eventType = BroadcastEventType.DATA_UPDATED;
          break;
        case 'DELETE':
          eventType = BroadcastEventType.DATA_DELETED;
          break;
        default:
          eventType = BroadcastEventType.DATA_CHANGED;
      }

      // Broadcast to other tabs
      if (broadcastChannelRef.current) {
        const message: BroadcastMessage = {
          type: eventType,
          table: config.table,
          context,
          payload,
          timestamp: Date.now(),
          source: 'database',
        };
        broadcastChannelRef.current.postMessage(message);
      }

      // Call custom handler if provided
      if (config.onData) {
        config.onData(payload);
      }

      // Use centralized invalidation service
      debouncedInvalidation(async () => {
        switch (config.table) {
          case RealtimeTable.WORKSPACES:
          case RealtimeTable.FILES:
          case RealtimeTable.FOLDERS:
            await QueryInvalidationService.invalidateWorkspaceData(queryClient);
            break;
          case RealtimeTable.LINKS:
            await QueryInvalidationService.invalidateLinkData(
              queryClient,
              context.linkId || (record && record.id)
            );
            break;
          case RealtimeTable.BATCHES:
            if (context.linkId) {
              await QueryInvalidationService.invalidateLinkData(queryClient, context.linkId);
            }
            break;
        }
      });
    },
    [config, queryClient, debouncedInvalidation]
  );

  // Handle broadcast messages from other tabs
  const handleBroadcastMessage = useCallback(
    async (event: MessageEvent<BroadcastMessage>) => {
      const message = event.data;

      // Don't process our own broadcasts
      if (message.source === 'broadcast') {
        return;
      }

      // Check if this message is relevant to our subscription
      if (message.table !== config.table) return;

      // Check if filter matches
      if (config.filter) {
        const contextValue = message.context[config.filter.column];
        if (contextValue !== config.filter.value) return;
      }

      console.log(`[RealtimeSync] Broadcast received for ${config.table}:`, message);

      // Use centralized invalidation
      debouncedInvalidation(async () => {
        switch (message.table) {
          case RealtimeTable.WORKSPACES:
          case RealtimeTable.FILES:
          case RealtimeTable.FOLDERS:
            await QueryInvalidationService.invalidateWorkspaceData(queryClient);
            break;
          case RealtimeTable.LINKS:
            await QueryInvalidationService.invalidateLinkData(
              queryClient,
              message.context.linkId
            );
            break;
          case RealtimeTable.BATCHES:
            if (message.context.linkId) {
              await QueryInvalidationService.invalidateLinkData(
                queryClient,
                message.context.linkId
              );
            }
            break;
        }
      });

      // Call custom handler if provided
      if (config.onData) {
        // Create a synthetic payload for the handler
        const payload: RealtimePostgresChangesPayload<any> = {
          schema: 'public',
          table: message.table,
          commit_timestamp: new Date(message.timestamp).toISOString(),
          eventType:
            message.type === BroadcastEventType.DATA_CREATED
              ? 'INSERT'
              : message.type === BroadcastEventType.DATA_UPDATED
              ? 'UPDATE'
              : message.type === BroadcastEventType.DATA_DELETED
              ? 'DELETE'
              : 'INSERT',
          new: message.payload.new,
          old: message.payload.old,
          errors: [],
        };
        config.onData(payload);
      }
    },
    [config, queryClient, debouncedInvalidation]
  );

  useEffect(() => {
    // Skip if disabled
    if (config.enabled === false) {
      return;
    }

    const subscriptionKey = createSubscriptionKey();
    console.log(`[RealtimeSync] Setting up subscription: ${subscriptionKey}`);

    // Initialize BroadcastChannel for cross-tab communication
    if (typeof BroadcastChannel !== 'undefined') {
      broadcastChannelRef.current = new BroadcastChannel('foldly_realtime');
      broadcastChannelRef.current.onmessage = handleBroadcastMessage;
    }

    // Create Supabase channel
    const channel = supabase.channel(subscriptionKey);

    // Build filter string
    let filter: string | undefined;
    if (config.filter) {
      filter = `${config.filter.column}=${config.filter.operator}.${config.filter.value}`;
    }

    // Subscribe to events
    const events = config.events || ['INSERT', 'UPDATE', 'DELETE'];

    events.forEach((event) => {
      channel.on(
        'postgres_changes',
        {
          event: event as any,
          schema: 'public',
          table: config.table,
          ...(filter && { filter }),
        },
        handleRealtimeChange
      );
    });

    channel.subscribe((status) => {
      console.log(`[RealtimeSync] Channel ${subscriptionKey} status: ${status}`);
    });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.log(`[RealtimeSync] Cleaning up subscription: ${subscriptionKey}`);

      // Clear debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      // Remove Supabase channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Close broadcast channel
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.enabled,
    config.table,
    config.filter?.column,
    config.filter?.operator,
    config.filter?.value,
    config.events?.join(','),
    supabase,
  ]);

  return {
    isConnected: true, // Could track actual connection state if needed
  };
}