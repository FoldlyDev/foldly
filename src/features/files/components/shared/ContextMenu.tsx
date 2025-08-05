'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Copy,
  Eye,
  CheckSquare,
  Square,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
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
  isExpanded?: boolean;
  isSelected?: boolean;
  nodeId: string;
  onOpenChange?: (open: boolean, nodeId: string) => void;
}

export function ContextMenu({
  children,
  onAction,
  hasSelection = false,
  targetType = 'file',
  isExpanded = false,
  isSelected = false,
  nodeId,
  onOpenChange,
}: ContextMenuProps) {
  const longPressTimerRef = useRef<NodeJS.Timeout>();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  
  // Build menu items based on context
  const menuItems = React.useMemo(() => {
    const items: Array<{
      action: ContextMenuAction;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      shortcut?: string;
      divider?: boolean;
    }> = [];

    if (targetType === 'file') {
      // File context menu
      items.push({
        action: 'copyToWorkspace',
        label: 'Copy to Workspace',
        icon: Copy,
        shortcut: 'Ctrl+C',
      });
      items.push({
        action: 'viewDetails',
        label: 'View Details',
        icon: Eye,
        divider: true,
      });
      if (!isSelected) {
        items.push({
          action: 'select',
          label: 'Select',
          icon: CheckSquare,
        });
      }
    } else {
      // Folder context menu
      if (isExpanded) {
        items.push({
          action: 'collapse',
          label: 'Collapse',
          icon: Folder,
        });
      } else {
        items.push({
          action: 'expand',
          label: 'Expand',
          icon: FolderOpen,
        });
      }
      items.push({
        action: 'copyToWorkspace',
        label: 'Copy to Workspace',
        icon: Copy,
        shortcut: 'Ctrl+C',
        divider: true,
      });
      if (!isSelected) {
        items.push({
          action: 'select',
          label: 'Select',
          icon: CheckSquare,
          divider: true,
        });
      }
    }

    // Add select/deselect all at the bottom for both
    if (hasSelection) {
      items.push({
        action: 'deselectAll',
        label: 'Deselect All',
        icon: Square,
        divider: true,
      });
    } else {
      items.push({
        action: 'selectAll',
        label: 'Select All',
        icon: CheckSquare,
        shortcut: 'Ctrl+A',
        divider: true,
      });
    }

    return items;
  }, [targetType, isExpanded, isSelected, hasSelection]);

  // Handle long press for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    
    longPressTimerRef.current = setTimeout(() => {
      e.preventDefault();
      setShowMenu(true);
    }, 500); // 500ms for long press
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !longPressTimerRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // Cancel long press if user moves finger too much
    if (deltaX > 10 || deltaY > 10) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }
    touchStartRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setShowMenu(open);
    if (open && onOpenChange) {
      onOpenChange(open, nodeId);
    }
  }, [nodeId, onOpenChange]);

  return (
    <ContextMenuRoot open={showMenu} onOpenChange={handleOpenChange}>
      <ContextMenuTrigger asChild>
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {menuItems.map((item, index) => {
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