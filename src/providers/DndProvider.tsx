'use client';

import {
  DndContext,
  DragOverlay,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useDndState } from '@/hooks/utility/use-dnd-state';
import { DragOverlayContent } from '@/components/dnd/DragOverlayContent';

/**
 * Global Drag-and-Drop Provider
 *
 * Wraps the application with @dnd-kit context for drag-and-drop functionality.
 * Provides:
 * - Global DnD context for all draggable/droppable components
 * - Pointer sensor for mouse/touch interactions
 * - Keyboard sensor for accessibility
 * - Drag overlay for visual feedback during drag (supports multi-select)
 * - Custom collision detection for pixel-perfect drop targeting
 *
 * Multi-select support:
 * - Reads from global useDndState to display multi-select counts
 * - Shows "3 files, 2 folders" for mixed selections
 * - Shows single item name for single drag
 *
 * @example
 * ```tsx
 * <DndProvider>
 *   <App />
 * </DndProvider>
 * ```
 */
export function DndProvider({ children }: { children: React.ReactNode }) {
  // Global DnD state (tracks multi-select drag data)
  const { activeId, activeType, activeData } = useDndState();

  // Configure sensors for drag interactions
  const sensors = useSensors(
    // Pointer sensor for mouse and touch events
    useSensor(PointerSensor, {
      // Require 5px movement before activating drag (prevents conflicts with click)
      activationConstraint: {
        distance: 5,
      },
    }),
    // Keyboard sensor for accessibility
    useSensor(KeyboardSensor)
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
    >
      {children}
      <DragOverlay>
        {activeId && activeType && (
          <DragOverlayContent
            type={activeType}
            name={(activeData?.file as { filename?: string })?.filename || (activeData?.folder as { name?: string })?.name || 'Item'}
            totalCount={activeData?.dragCount || 1}
            fileCount={activeData?.fileCount || 0}
            folderCount={activeData?.folderCount || 0}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
