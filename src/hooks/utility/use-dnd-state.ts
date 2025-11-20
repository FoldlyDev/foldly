import { create } from 'zustand';

/**
 * Drag data payload with multi-select information
 */
export interface DragData {
  /** Name of the primary dragged item (file or folder) */
  name?: string;
  /** File data (if dragging a file) */
  file?: { name: string; [key: string]: unknown };
  /** Folder data (if dragging a folder) */
  folder?: { name: string; [key: string]: unknown };
  /** Total number of items being dragged (1 for single, >1 for multi-select) */
  dragCount?: number;
  /** Number of files in multi-select drag */
  fileCount?: number;
  /** Number of folders in multi-select drag */
  folderCount?: number;
}

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
 * // On drag start (single item)
 * setActive(file.id, 'file', { file: { name: 'document.pdf' } });
 *
 * // On drag start (multi-select)
 * setActive(file.id, 'file', {
 *   file: { name: 'document.pdf' },
 *   dragCount: 5,
 *   fileCount: 3,
 *   folderCount: 2,
 * });
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

  /** Data payload attached to the dragged item (with multi-select info) */
  activeData: DragData | null;

  /** Current drag transform (shared across all selected items for multi-select) */
  dragTransform: { x: number; y: number } | null;

  /** Set the active drag item */
  setActive: (id: string, type: 'file' | 'folder', data?: DragData) => void;

  /** Update the drag transform during drag move */
  setDragTransform: (transform: { x: number; y: number } | null) => void;

  /** Clear the active drag state */
  clearActive: () => void;

  /** Check if currently dragging */
  isDragging: boolean;
}

export const useDndState = create<DndState>((set, get) => ({
  activeId: null,
  activeType: null,
  activeData: null,
  dragTransform: null,

  setActive: (id, type, data) =>
    set({
      activeId: id,
      activeType: type,
      activeData: data ?? null,
      dragTransform: null, // Reset transform on new drag
    }),

  setDragTransform: (transform) =>
    set({
      dragTransform: transform,
    }),

  clearActive: () =>
    set({
      activeId: null,
      activeType: null,
      activeData: null,
      dragTransform: null,
    }),

  get isDragging() {
    return get().activeId !== null;
  },
}));
