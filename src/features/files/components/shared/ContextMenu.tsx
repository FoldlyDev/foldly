'use client';

import React from 'react';
import {
  Copy,
  CheckSquare,
  Square,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  ContextMenu as ContextMenuRoot,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/core/shadcn/context-menu';
import type { ContextMenuAction } from '@/features/files/types';

interface ContextMenuProps {
  children: React.ReactNode;
  onAction: (action: ContextMenuAction) => void;
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
  children,
  onAction,
  hasSelection = false,
  targetType,
}: ContextMenuProps) {
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

  return (
    <ContextMenuRoot>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {filteredItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <React.Fragment key={item.action}>
              {item.divider && index > 0 && (
                <ContextMenuSeparator />
              )}
              <ContextMenuItem
                onClick={() => onAction(item.action)}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.shortcut && (
                  <ContextMenuShortcut>
                    {item.shortcut}
                  </ContextMenuShortcut>
                )}
              </ContextMenuItem>
            </React.Fragment>
          );
        })}
      </ContextMenuContent>
    </ContextMenuRoot>
  );
}

// Legacy context menu component for compatibility with existing code
interface LegacyContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onAction: (action: ContextMenuAction) => void;
  onClose: () => void;
  hasSelection?: boolean;
  targetType?: 'file' | 'folder';
}

export function LegacyContextMenu({
  isOpen,
  position,
  onAction,
  onClose,
  hasSelection = false,
  targetType,
}: LegacyContextMenuProps) {
  // This component is deprecated and will be removed once all usages are migrated
  // For now, it just renders nothing as the new ContextMenu handles everything
  return null;
}