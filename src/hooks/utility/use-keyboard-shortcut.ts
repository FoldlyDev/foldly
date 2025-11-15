import { useEffect } from 'react';

/**
 * Options for keyboard shortcut behavior
 */
export interface KeyboardShortcutOptions {
  /**
   * Whether the shortcut is enabled
   * @default true
   */
  enabled?: boolean;

  /**
   * Whether to prevent default browser behavior
   * @default true
   */
  preventDefault?: boolean;

  /**
   * Whether to stop event propagation
   * @default false
   */
  stopPropagation?: boolean;

  /**
   * Element to attach listener to
   * @default document
   */
  target?: HTMLElement | Document | Window;
}

/**
 * Keyboard modifiers
 */
export type KeyboardModifier = 'ctrl' | 'shift' | 'alt' | 'meta' | 'mod';

/**
 * Hook that listens for keyboard shortcuts and triggers a callback
 *
 * Supports:
 * - Single keys: 'k', 'Enter', 'Escape'
 * - Modifier combinations: 'ctrl+k', 'meta+shift+p'
 * - Cross-platform: 'meta' (CMD on Mac, Windows key on PC)
 *
 * @param keys - The key combination (e.g., 'ctrl+k', 'meta+k', '/')
 * @param callback - Function to call when shortcut is pressed
 * @param options - Optional configuration
 *
 * @example
 * ```tsx
 * // CMD+K on Mac, CTRL+K on Windows/Linux
 * useKeyboardShortcut('mod+k', () => openSearchModal());
 *
 * // Single key
 * useKeyboardShortcut('/', () => focusSearch());
 *
 * // Multiple modifiers
 * useKeyboardShortcut('ctrl+shift+p', () => openCommandPalette());
 *
 * // Conditional enable
 * useKeyboardShortcut('Escape', closeModal, { enabled: isModalOpen });
 * ```
 */
export function useKeyboardShortcut(
  keys: string,
  callback: (event: KeyboardEvent) => void,
  options: KeyboardShortcutOptions = {}
): void {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
    target = typeof document !== 'undefined' ? document : null,
  } = options;

  useEffect(() => {
    if (!enabled || !target) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Parse the key combination
      const parts = keys.toLowerCase().split('+');
      const modifiers: KeyboardModifier[] = [];
      let key = '';

      parts.forEach((part) => {
        if (['ctrl', 'shift', 'alt', 'meta', 'mod'].includes(part)) {
          modifiers.push(part as KeyboardModifier);
        } else {
          key = part;
        }
      });

      // Check if all required modifiers are pressed
      const hasCtrl = modifiers.includes('ctrl') || modifiers.includes('mod');
      const hasMeta = modifiers.includes('meta') || modifiers.includes('mod');
      const hasShift = modifiers.includes('shift');
      const hasAlt = modifiers.includes('alt');

      // 'mod' is platform-specific: CMD on Mac, CTRL on Windows/Linux
      const modKeyPressed = (hasCtrl || hasMeta) &&
        (event.metaKey || event.ctrlKey);

      const ctrlMatches = !hasCtrl || event.ctrlKey;
      const metaMatches = !hasMeta || event.metaKey;
      const shiftMatches = !hasShift || event.shiftKey;
      const altMatches = !hasAlt || event.altKey;

      // Special handling for 'mod' key (cross-platform)
      const modMatches = modifiers.includes('mod') ? modKeyPressed : true;

      // Check if the pressed key matches
      const keyMatches = event.key.toLowerCase() === key.toLowerCase();

      // Verify all conditions
      if (
        keyMatches &&
        (modifiers.includes('mod') ? modMatches : (ctrlMatches && metaMatches)) &&
        shiftMatches &&
        altMatches
      ) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }

        callback(event);
      }
    };

    target.addEventListener('keydown', handleKeyDown as EventListener);

    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [keys, callback, enabled, preventDefault, stopPropagation, target]);
}
