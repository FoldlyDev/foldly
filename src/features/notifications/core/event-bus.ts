/**
 * Event Bus Implementation
 * Central event system for all notifications in the application
 */

import { EventEmitter } from 'events';
import type {
  NotificationEvent,
  NotificationEventType,
  EventPayloadMap,
  EventMetadata,
  NotificationConfig,
} from './event-types';

// =============================================================================
// EVENT BUS TYPES
// =============================================================================

/**
 * Event listener callback type
 */
export type EventListener<T extends NotificationEventType> = (
  event: NotificationEvent<T>
) => void | Promise<void>;

/**
 * Event bus options
 */
export interface EventBusOptions {
  maxListeners?: number;
  enableLogging?: boolean;
  enableAnalytics?: boolean;
  enableDebugMode?: boolean;
}

/**
 * Event analytics data
 */
export interface EventAnalytics {
  eventCount: Map<NotificationEventType, number>;
  lastEmitted: Map<NotificationEventType, number>;
  errorCount: Map<NotificationEventType, number>;
}

// =============================================================================
// EVENT BUS IMPLEMENTATION
// =============================================================================

class NotificationEventBus extends EventEmitter {
  private static instance: NotificationEventBus | null = null;
  private options: EventBusOptions;
  private analytics: EventAnalytics;
  private eventQueue: NotificationEvent[] = [];
  private isProcessing = false;

  private constructor(options: EventBusOptions = {}) {
    super();
    
    this.options = {
      maxListeners: 100,
      enableLogging: process.env.NODE_ENV === 'development',
      enableAnalytics: true,
      enableDebugMode: process.env.NODE_ENV === 'development',
      ...options,
    };

    this.analytics = {
      eventCount: new Map(),
      lastEmitted: new Map(),
      errorCount: new Map(),
    };

    // Set max listeners
    this.setMaxListeners(this.options.maxListeners!);

    // Set up error handling
    this.on('error', this.handleError.bind(this));
  }

  /**
   * Get singleton instance of event bus
   */
  public static getInstance(options?: EventBusOptions): NotificationEventBus {
    if (!NotificationEventBus.instance) {
      NotificationEventBus.instance = new NotificationEventBus(options);
    }
    return NotificationEventBus.instance;
  }

  /**
   * Emit a notification event with type safety
   */
  public emitNotification<T extends NotificationEventType>(
    type: T,
    payload: EventPayloadMap[T],
    config?: Partial<NotificationConfig>
  ): void {
    const metadata: EventMetadata = {
      timestamp: Date.now(),
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      source: this.getCallerSource(),
      correlationId: this.generateCorrelationId(),
      version: '1.0.0',
    };

    const event: NotificationEvent<T> = {
      type,
      payload,
      metadata,
      config,
    };

    // Log event if enabled
    if (this.options.enableLogging) {
      console.log('[NotificationEventBus] Emitting event:', {
        type,
        payload,
        config,
        metadata,
      });
    }

    // Track analytics
    if (this.options.enableAnalytics) {
      this.trackEvent(type);
    }

    // Add to queue for processing
    this.eventQueue.push(event as NotificationEvent);
    this.processQueue();
  }

  /**
   * Subscribe to notification events with type safety
   */
  public subscribe<T extends NotificationEventType>(
    eventType: T,
    listener: EventListener<T>
  ): () => void {
    // Type-safe listener wrapper
    const wrappedListener = (event: NotificationEvent) => {
      if (event.type === eventType) {
        listener(event as NotificationEvent<T>);
      }
    };

    this.on(eventType, wrappedListener);

    // Return unsubscribe function
    return () => {
      this.off(eventType, wrappedListener);
    };
  }

  /**
   * Subscribe to multiple event types
   */
  public subscribeMultiple<T extends NotificationEventType>(
    eventTypes: T[],
    listener: EventListener<T>
  ): () => void {
    const unsubscribers = eventTypes.map(eventType => 
      this.subscribe(eventType, listener)
    );

    // Return combined unsubscribe function
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }

  /**
   * Subscribe to all events (useful for logging/monitoring)
   */
  public subscribeAll(listener: (event: NotificationEvent) => void): () => void {
    const wrappedListener = (_eventType: string, event: NotificationEvent) => {
      listener(event);
    };

    this.on('*', wrappedListener);

    return () => {
      this.off('*', wrappedListener);
    };
  }

  /**
   * Process queued events
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      
      try {
        // Emit to specific event listeners
        this.emit(event.type, event);
        
        // Emit to wildcard listeners
        this.emit('*', event.type, event);
        
        // Small delay to prevent blocking
        if (this.eventQueue.length > 10) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      } catch (error) {
        this.handleError(error, event);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Handle errors during event processing
   */
  private handleError(error: any, event?: NotificationEvent): void {
    console.error('[NotificationEventBus] Error processing event:', {
      error,
      event,
    });

    if (event && this.options.enableAnalytics) {
      const errorCount = this.analytics.errorCount.get(event.type) || 0;
      this.analytics.errorCount.set(event.type, errorCount + 1);
    }
  }

  /**
   * Track event for analytics
   */
  private trackEvent(type: NotificationEventType): void {
    const count = this.analytics.eventCount.get(type) || 0;
    this.analytics.eventCount.set(type, count + 1);
    this.analytics.lastEmitted.set(type, Date.now());

    // Send to external analytics if configured
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track(`notification.${type}`, {
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Get current user ID (implement based on your auth system)
   */
  private getCurrentUserId(): string | undefined {
    // This should be implemented to get the actual user ID
    // For now, returning undefined
    return undefined;
  }

  /**
   * Get session ID
   */
  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('notificationSessionId');
      if (!sessionId) {
        sessionId = this.generateCorrelationId();
        sessionStorage.setItem('notificationSessionId', sessionId);
      }
      return sessionId;
    }
    return 'server-session';
  }

  /**
   * Get caller source (component/service that triggered the event)
   */
  private getCallerSource(): string | undefined {
    if (this.options.enableDebugMode) {
      // Try to extract caller from stack trace
      const stack = new Error().stack;
      if (stack) {
        const lines = stack.split('\n');
        // Skip first 3 lines (Error, this function, and emit function)
        const callerLine = lines[3];
        if (callerLine) {
          const match = callerLine.match(/at\s+(\S+)/);
          return match ? match[1] : undefined;
        }
      }
    }
    return undefined;
  }

  /**
   * Generate correlation ID for related events
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get analytics data
   */
  public getAnalytics(): EventAnalytics {
    return { ...this.analytics };
  }

  /**
   * Clear analytics data
   */
  public clearAnalytics(): void {
    this.analytics.eventCount.clear();
    this.analytics.lastEmitted.clear();
    this.analytics.errorCount.clear();
  }

  /**
   * Clear all event listeners
   */
  public clearAllListeners(): void {
    this.removeAllListeners();
  }

  /**
   * Destroy the event bus instance (for testing)
   */
  public static destroy(): void {
    if (NotificationEventBus.instance) {
      NotificationEventBus.instance.clearAllListeners();
      NotificationEventBus.instance = null;
    }
  }
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

/**
 * Get the singleton event bus instance
 */
export const eventBus = NotificationEventBus.getInstance();

/**
 * Convenience function to emit events
 */
export function emitNotification<T extends NotificationEventType>(
  type: T,
  payload: EventPayloadMap[T],
  config?: Partial<NotificationConfig>
): void {
  eventBus.emitNotification(type, payload, config);
}

/**
 * Convenience function to subscribe to events
 */
export function subscribeToNotification<T extends NotificationEventType>(
  eventType: T,
  listener: EventListener<T>
): () => void {
  return eventBus.subscribe(eventType, listener);
}

/**
 * Convenience function to subscribe to multiple events
 */
export function subscribeToMultiple<T extends NotificationEventType>(
  eventTypes: T[],
  listener: EventListener<T>
): () => void {
  return eventBus.subscribeMultiple(eventTypes, listener);
}

/**
 * Export the class for testing and advanced usage
 */
export { NotificationEventBus };

// =============================================================================
// DEVELOPMENT HELPERS
// =============================================================================

/**
 * Development helper to log all events
 */
if (process.env.NODE_ENV === 'development') {
  eventBus.subscribeAll((event) => {
    console.log('[NotificationEvent]', event.type, event);
  });
}

/**
 * Export analytics getter for monitoring
 */
export function getEventAnalytics(): EventAnalytics {
  return eventBus.getAnalytics();
}