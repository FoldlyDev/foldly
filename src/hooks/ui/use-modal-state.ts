'use client';

import { useState, useCallback } from 'react';

/**
 * Generic modal state management hook
 *
 * Manages the open/closed state and data for a modal component.
 * Designed to work with controlled Dialog components from AnimateUI.
 *
 * @template TData - The type of data passed to the modal
 *
 * @example
 * ```typescript
 * // In a component
 * const linkDetailsModal = useModalState<Link>();
 *
 * // Open modal with data
 * linkDetailsModal.open(linkData);
 *
 * // In JSX
 * <LinkDetailsModal
 *   link={linkDetailsModal.data}
 *   isOpen={linkDetailsModal.isOpen}
 *   onOpenChange={(open) => !open && linkDetailsModal.close()}
 * />
 * ```
 */
export function useModalState<TData = unknown>() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<TData | null>(null);

  const open = useCallback((modalData: TData) => {
    setData(modalData);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Delay clearing data until animation completes (200ms matches dialog exit animation)
    setTimeout(() => setData(null), 200);
  }, []);

  return {
    /** Whether the modal is currently open */
    isOpen,
    /** The data passed to the modal, or null if closed */
    data,
    /** Open the modal with the provided data */
    open,
    /** Close the modal and clear data after animation */
    close,
  } as const;
}
