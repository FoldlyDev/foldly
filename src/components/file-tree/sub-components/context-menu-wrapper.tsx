'use client';

import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuLabel,
} from '@/components/ui/shadcn/context-menu';
import type { TreeItem as TreeItemType } from '../types/tree-types';
import type { ContextMenuItem as MenuItemConfig } from '../core/tree';
import { FileIcon, FolderIcon } from 'lucide-react';

interface ContextMenuWrapperProps {
  children: React.ReactNode;
  item: TreeItemType;
  itemInstance: any;
  menuItems: MenuItemConfig[] | null;
}

export function ContextMenuWrapper({
  children,
  item,
  itemInstance,
  menuItems,
}: ContextMenuWrapperProps) {
  // If no menu items, just render children without context menu
  if (!menuItems || menuItems.length === 0) {
    return <>{children}</>;
  }

  const handleContextMenu = () => {
    // If the item is not already selected, select only this item
    // This provides intuitive behavior - right-clicking an unselected item selects it
    // But if it's already part of a multi-selection, keep the multi-selection
    if (itemInstance && !itemInstance.isSelected()) {
      // Get the tree instance to handle selection properly
      const tree = itemInstance.getTree?.();
      if (tree) {
        // Clear other selections and select only this item
        tree.setSelectedItems([item.id]);
      } else {
        // Fallback to simple select if tree instance not available
        itemInstance.select();
      }
    }
  };

  return (
    <ContextMenu onOpenChange={(open) => {
      if (open) {
        handleContextMenu();
      }
    }}>
      <ContextMenuTrigger asChild onContextMenu={handleContextMenu}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* Selection indicator */}
        {(() => {
          const tree = itemInstance?.getTree?.();
          const selectedItems = tree?.getSelectedItems?.() || [];
          const selectedCount = selectedItems.length;
          
          if (selectedCount === 0) return null;
          
          // Get the name to display
          let selectionText = '';
          if (selectedCount === 1) {
            // Single item - show its name with icon
            const icon = item.type === 'folder' ? 
              <FolderIcon className="h-3 w-3" /> : 
              <FileIcon className="h-3 w-3" />;
            selectionText = item.name;
            
            return (
              <>
                <ContextMenuLabel className="flex items-center gap-1.5 text-xs font-medium">
                  <span className="flex items-center gap-1">
                    {icon}
                    <span className="truncate max-w-[180px]">{selectionText}</span>
                  </span>
                </ContextMenuLabel>
                <ContextMenuSeparator />
              </>
            );
          } else if (selectedCount <= 3) {
            // 2-3 items - show count with description
            selectionText = `${selectedCount} items selected`;
          } else {
            // Many items - just show count
            selectionText = `${selectedCount} items selected`;
          }
          
          return (
            <>
              <ContextMenuLabel className="text-xs font-medium text-muted-foreground">
                {selectionText}
              </ContextMenuLabel>
              <ContextMenuSeparator />
            </>
          );
        })()}
        
        {/* Menu items */}
        {menuItems.map((menuItem, index) => {
          if (menuItem.separator) {
            return <ContextMenuSeparator key={`separator-${index}`} />;
          }

          return (
            <ContextMenuItem
              key={`item-${index}`}
              onClick={menuItem.onClick || (() => {})}
              disabled={menuItem.disabled || false}
              className={menuItem.destructive ? 'text-destructive' : ''}
            >
              <span className="flex items-center gap-2">
                {menuItem.icon}
                {menuItem.label || ''}
              </span>
            </ContextMenuItem>
          );
        })}
      </ContextMenuContent>
    </ContextMenu>
  );
}