'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  FolderOpen,
  CheckSquare,
  Square,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import type { ContextMenuAction } from '@/features/files/types';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onAction: (action: ContextMenuAction) => void;
  onClose: () => void;
  hasSelection?: boolean;
  targetType?: 'file' | 'folder';
}

const menuItems: Array<{
  action: ContextMenuAction;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  divider?: boolean;
}> = [
  {
    action: 'copyToWorkspace',
    label: 'Copy to Workspace',
    icon: Copy,
    shortcut: 'Ctrl+C',
  },
  {
    action: 'selectAll',
    label: 'Select All',
    icon: CheckSquare,
    shortcut: 'Ctrl+A',
    divider: true,
  },
  {
    action: 'deselectAll',
    label: 'Deselect All',
    icon: Square,
  },
  {
    action: 'expandAll',
    label: 'Expand All',
    icon: Maximize2,
    divider: true,
  },
  {
    action: 'collapseAll',
    label: 'Collapse All',
    icon: Minimize2,
  },
];

export function ContextMenu({
  isOpen,
  position,
  onAction,
  onClose,
  hasSelection = false,
  targetType,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Adjust position to ensure menu stays within viewport
  const adjustedPosition = { ...position };
  if (menuRef.current) {
    const rect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (rect.right > viewportWidth) {
      adjustedPosition.x = viewportWidth - rect.width - 10;
    }
    if (rect.bottom > viewportHeight) {
      adjustedPosition.y = viewportHeight - rect.height - 10;
    }
  }

  // Filter menu items based on context
  const filteredItems = menuItems.filter((item) => {
    if (item.action === 'copyToWorkspace' && !hasSelection) {
      return false;
    }
    if (item.action === 'deselectAll' && !hasSelection) {
      return false;
    }
    if ((item.action === 'expandAll' || item.action === 'collapseAll') && targetType === 'file') {
      return false;
    }
    return true;
  });

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        className="fixed z-50 w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        style={{
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
        }}
        role="menu"
        aria-label="Context menu"
      >
        {filteredItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <React.Fragment key={item.action}>
              {item.divider && index > 0 && (
                <div className="my-1 h-px bg-border" />
              )}
              <button
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                onClick={() => {
                  onAction(item.action);
                  onClose();
                }}
                role="menuitem"
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.shortcut && (
                  <span className="text-xs text-muted-foreground">
                    {item.shortcut}
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}