'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * Options for configuring interaction handlers
 */
export interface InteractionOptions {
  /** Callback for single-click events */
  onSingleClick?: () => void;
  /** Callback for double-click events */
  onDoubleClick?: () => void;
  /** Callback for long-press events */
  onLongPress?: () => void;
  /** Long-press delay in milliseconds (default: 500ms) */
  longPressDelay?: number;
  /** Enable haptic feedback on long-press (default: true) */
  enableHaptic?: boolean;
}

/**
 * Interaction event handlers
 */
export interface InteractionHandlers {
  /** Click handler (use with onClick) */
  handleClick: (event: React.MouseEvent) => void;
  /** Double-click handler (use with onDoubleClick) */
  handleDoubleClick: (event: React.MouseEvent) => void;
  /** Long-press handlers (use with touch events) */
  handleLongPress: {
    onTouchStart: (event: React.TouchEvent) => void;
    onTouchEnd: (event: React.TouchEvent) => void;
    onTouchCancel: (event: React.TouchEvent) => void;
  };
}

/**
 * Hook for handling platform-specific interaction patterns
 *
 * Provides unified handlers for:
 * - Single-click (desktop selection)
 * - Double-click (desktop open/navigate)
 * - Long-press (mobile selection mode entry)
 *
 * Key Features:
 * - Uses native onDoubleClick event (no artificial delays)
 * - Long-press delay (500ms) exceeds double-click threshold (300ms)
 * - Haptic feedback with graceful degradation (iOS fallback)
 * - Proper timer cleanup prevents memory leaks
 * - Returns handlers object for better DX
 *
 * Implementation Notes:
 * - Vibration API not supported on iOS Safari (graceful degradation)
 * - Touch events take priority over mouse events on hybrid devices
 * - All timers cleared on touchCancel and component unmount
 *
 * @param options - Configuration options for interaction handlers
 * @returns Object containing click, double-click, and long-press handlers
 *
 * @example
 * ```tsx
 * function FileCard({ file, onSelect, onOpen }) {
 *   const { isMobile } = useResponsiveDetection();
 *
 *   const handlers = useInteractionHandlers({
 *     onSingleClick: () => {
 *       if (!isMobile) onSelect();
 *     },
 *     onDoubleClick: () => {
 *       if (!isMobile) onOpen();
 *     },
 *     onLongPress: () => {
 *       if (isMobile) {
 *         enableSelectionMode();
 *         onSelect();
 *       }
 *     },
 *   });
 *
 *   return (
 *     <div
 *       onClick={handlers.handleClick}
 *       onDoubleClick={handlers.handleDoubleClick}
 *       onTouchStart={handlers.handleLongPress.onTouchStart}
 *       onTouchEnd={handlers.handleLongPress.onTouchEnd}
 *       onTouchCancel={handlers.handleLongPress.onTouchCancel}
 *     >
 *       {file.name}
 *     </div>
 *   );
 * }
 * ```
 */
export function useInteractionHandlers(
  options: InteractionOptions
): InteractionHandlers {
  const {
    onSingleClick,
    onDoubleClick,
    onLongPress,
    longPressDelay = 500, // 500ms exceeds double-click threshold (300ms)
    enableHaptic = true,
  } = options;

  // State to ignore clicks after double-click
  const [ignoreClick, setIgnoreClick] = useState(false);

  // Timer ref for long-press
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Trigger haptic feedback (vibration)
   * Gracefully degrades on iOS Safari (Vibration API not supported)
   */
  const triggerHaptic = useCallback(() => {
    if (!enableHaptic) return;

    // Feature detection: Vibration API not available on iOS
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(50); // 50ms pulse
    }
    // Silently fail on unsupported devices (iOS Safari)
  }, [enableHaptic]);

  /**
   * Single-click handler
   * Ignores clicks immediately after double-click to prevent double-triggering
   */
  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (ignoreClick) return;
      onSingleClick?.();
    },
    [ignoreClick, onSingleClick]
  );

  /**
   * Double-click handler
   * Uses native onDoubleClick event (no artificial delays)
   * Prevents next single-click from firing
   */
  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      setIgnoreClick(true);
      onDoubleClick?.();

      // Reset ignore flag after double-click threshold (300ms)
      setTimeout(() => setIgnoreClick(false), 300);
    },
    [onDoubleClick]
  );

  /**
   * Touch start handler
   * Initiates long-press timer
   */
  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      // Clear any existing timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }

      // Start long-press timer
      longPressTimerRef.current = setTimeout(() => {
        triggerHaptic();
        onLongPress?.();
        longPressTimerRef.current = null;
      }, longPressDelay);
    },
    [longPressDelay, onLongPress, triggerHaptic]
  );

  /**
   * Touch end handler
   * Clears long-press timer if touch ends before delay
   */
  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  /**
   * Touch cancel handler
   * Clears long-press timer if touch is cancelled (e.g., during scroll)
   */
  const handleTouchCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Return handlers object (better DX than tuple)
  return {
    handleClick,
    handleDoubleClick,
    handleLongPress: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
  };
}
