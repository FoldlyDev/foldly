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
import { useState } from 'react';

/**
 * Global Drag-and-Drop Provider
 *
 * Wraps the application with @dnd-kit context for drag-and-drop functionality.
 * Provides:
 * - Global DnD context for all draggable/droppable components
 * - Pointer sensor for mouse/touch interactions
 * - Keyboard sensor for accessibility
 * - Drag overlay for visual feedback during drag
 * - Custom collision detection for pixel-perfect drop targeting
 *
 * @example
 * ```tsx
 * <DndProvider>
 *   <App />
 * </DndProvider>
 * ```
 */
export function DndProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay>
        {activeId && (
          <div className="rounded-lg border border-border bg-card p-4 shadow-lg">
            <p className="text-sm text-muted-foreground">Moving...</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
