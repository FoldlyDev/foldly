/**
 * React Hook for Event Bus Integration
 * Provides easy access to the notification event system in React components
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
  eventBus,
  emitNotification as emitCore,
  type NotificationEventType,
  type EventPayloadMap,
  type NotificationConfig,
  type EventListener,
  type NotificationEvent,
} from '../core';

/**
 * Hook return type
 */
interface UseEventBusReturn {
  emit: <T extends NotificationEventType>(
    type: T,
    payload: EventPayloadMap[T],
    config?: Partial<NotificationConfig>
  ) => void;
  emitWithAuth: <T extends NotificationEventType>(
    type: T,
    payload: EventPayloadMap[T],
    config?: Partial<NotificationConfig>
  ) => void;
  subscribe: <T extends NotificationEventType>(
    eventType: T,
    listener: EventListener<T>
  ) => void;
  subscribeMultiple: <T extends NotificationEventType>(
    eventTypes: T[],
    listener: EventListener<T>
  ) => void;
  isConnected: boolean;
}

/**
 * Main hook for using the event bus in React components
 */
export function useEventBus(): UseEventBusReturn {
  const { userId } = useAuth();
  const isConnected = useRef(true);
  const subscriptions = useRef<Array<() => void>>([]);

  /**
   * Emit an event
   */
  const emit = useCallback(<T extends NotificationEventType>(
    type: T,
    payload: EventPayloadMap[T],
    config?: Partial<NotificationConfig>
  ) => {
    emitCore(type, payload, config);
  }, []);

  /**
   * Emit an event with user context automatically attached
   */
  const emitWithAuth = useCallback(<T extends NotificationEventType>(
    type: T,
    payload: EventPayloadMap[T],
    config?: Partial<NotificationConfig>
  ) => {
    // Enhance payload with user context if available
    const enhancedPayload = {
      ...payload,
      _userId: userId,
    } as EventPayloadMap[T];

    emitCore(type, enhancedPayload, config);
  }, [userId]);

  /**
   * Subscribe to an event type
   */
  const subscribe = useCallback(<T extends NotificationEventType>(
    eventType: T,
    listener: EventListener<T>
  ) => {
    const unsubscribe = eventBus.subscribe(eventType, listener);
    subscriptions.current.push(unsubscribe);
  }, []);

  /**
   * Subscribe to multiple event types
   */
  const subscribeMultiple = useCallback(<T extends NotificationEventType>(
    eventTypes: T[],
    listener: EventListener<T>
  ) => {
    const unsubscribe = eventBus.subscribeMultiple(eventTypes, listener);
    subscriptions.current.push(unsubscribe);
  }, []);

  /**
   * Clean up subscriptions on unmount
   */
  useEffect(() => {
    return () => {
      subscriptions.current.forEach(unsubscribe => unsubscribe());
      subscriptions.current = [];
      isConnected.current = false;
    };
  }, []);

  return {
    emit,
    emitWithAuth,
    subscribe,
    subscribeMultiple,
    isConnected: isConnected.current,
  };
}

/**
 * Hook for subscribing to specific notification events
 * Automatically handles subscription lifecycle
 */
export function useNotificationSubscription<T extends NotificationEventType>(
  eventType: T | T[],
  handler: (event: NotificationEvent<T>) => void,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    const eventTypes = Array.isArray(eventType) ? eventType : [eventType];
    
    const unsubscribe = eventBus.subscribeMultiple(
      eventTypes,
      handler as EventListener<T>
    );

    return unsubscribe;
  }, [eventType, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Hook for emitting notification events with loading state
 */
export function useNotificationEmitter() {
  const { emit, emitWithAuth } = useEventBus();
  const loadingEvents = useRef<Set<string>>(new Set());

  const emitWithLoading = useCallback(async <T extends NotificationEventType>(
    type: T,
    payload: EventPayloadMap[T],
    config?: Partial<NotificationConfig>,
    onComplete?: () => void | Promise<void>
  ) => {
    const eventId = `${type}-${Date.now()}`;
    loadingEvents.current.add(eventId);

    try {
      emit(type, payload, config);
      
      if (onComplete) {
        await onComplete();
      }
    } finally {
      loadingEvents.current.delete(eventId);
    }
  }, [emit]);

  const isLoading = useCallback((eventType?: NotificationEventType) => {
    if (!eventType) {
      return loadingEvents.current.size > 0;
    }
    
    return Array.from(loadingEvents.current).some(id => 
      id.startsWith(eventType)
    );
  }, []);

  return {
    emit,
    emitWithAuth,
    emitWithLoading,
    isLoading,
  };
}

/**
 * Hook for listening to all events (useful for debugging or logging)
 */
export function useNotificationDebugger(
  enabled: boolean = process.env.NODE_ENV === 'development'
): NotificationEvent[] {
  const [events, setEvents] = React.useState<NotificationEvent[]>([]);
  const maxEvents = 50; // Keep last 50 events

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = eventBus.subscribeAll((event) => {
      setEvents(prev => {
        const newEvents = [event, ...prev].slice(0, maxEvents);
        
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.log('[NotificationDebugger]', event.type, event);
        }
        
        return newEvents;
      });
    });

    return unsubscribe;
  }, [enabled]);

  return events;
}

// Re-export for convenience
import React from 'react';
export { NotificationEventType } from '../core';