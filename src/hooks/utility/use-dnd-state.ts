import { create } from 'zustand';

/**
 * Global Drag-and-Drop State
 *
 * Zustand store for managing drag-and-drop state across the application.
 * Tracks the currently active drag operation.
 *
 * @example
 * ```tsx
 * const { activeId, activeType, setActive, clearActive } = useDndState();
 *
 * // On drag start
 * setActive(file.id, 'file', { file });
 *
 * // On drag end/cancel
 * clearActive();
 * ```
 */

export interface DndState {
  /** ID of the currently dragged item (null if not dragging) */
  activeId: string | null;

  /** Type of the dragged item ('file' | 'folder' | null) */
  activeType: 'file' | 'folder' | null;

  /** Optional data payload attached to the dragged item */
  activeData: Record<string, unknown> | null;

  /** Set the active drag item */
  setActive: (
    id: string,
    type: 'file' | 'folder',
    data?: Record<string, unknown>
  ) => void;

  /** Clear the active drag state */
  clearActive: () => void;

  /** Check if currently dragging */
  isDragging: boolean;
}

export const useDndState = create<DndState>((set, get) => ({
  activeId: null,
  activeType: null,
  activeData: null,

  setActive: (id, type, data) =>
    set({
      activeId: id,
      activeType: type,
      activeData: data ?? null,
    }),

  clearActive: () =>
    set({
      activeId: null,
      activeType: null,
      activeData: null,
    }),

  get isDragging() {
    return get().activeId !== null;
  },
}));
