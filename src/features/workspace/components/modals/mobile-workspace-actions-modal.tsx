'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/core/shadcn/dialog';
import { Button } from '@/components/ui/core/shadcn/button';
import {
  Edit2,
  FolderPlus,
  Trash2,
  Move,
  Copy,
  Download,
  Info,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type WorkspaceAction = 
  | 'rename'
  | 'move'
  | 'copy'
  | 'delete'
  | 'download'
  | 'info'
  | 'createFolder';

export interface WorkspaceItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
}

interface MobileWorkspaceActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: WorkspaceItem[];
  onAction: (action: WorkspaceAction) => void;
}

export function MobileWorkspaceActionsModal({
  isOpen,
  onClose,
  selectedItems,
  onAction,
}: MobileWorkspaceActionsModalProps) {
  // Determine what actions are available based on selection
  const isSingleItem = selectedItems.length === 1;
  const hasFiles = selectedItems.some(item => item.type === 'file');
  const hasFolders = selectedItems.some(item => item.type === 'folder');
  const isOnlyFolders = hasFolders && !hasFiles;

  const handleAction = (action: WorkspaceAction) => {
    onAction(action);
    onClose();
  };

  const actions = [
    {
      id: 'rename',
      label: 'Rename',
      icon: Edit2,
      onClick: () => handleAction('rename'),
      visible: isSingleItem,
      className: '',
    },
    {
      id: 'move',
      label: 'Move',
      icon: Move,
      onClick: () => handleAction('move'),
      visible: true,
      className: '',
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: Copy,
      onClick: () => handleAction('copy'),
      visible: true,
      className: '',
    },
    {
      id: 'download',
      label: 'Download',
      icon: Download,
      onClick: () => handleAction('download'),
      visible: hasFiles,
      className: '',
    },
    {
      id: 'createFolder',
      label: 'Create Folder Inside',
      icon: FolderPlus,
      onClick: () => handleAction('createFolder'),
      visible: isSingleItem && isOnlyFolders,
      className: '',
    },
    {
      id: 'info',
      label: 'Details',
      icon: Info,
      onClick: () => handleAction('info'),
      visible: isSingleItem,
      className: '',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      onClick: () => handleAction('delete'),
      visible: true,
      className: 'text-destructive hover:text-destructive/90 hover:bg-destructive/10',
    },
  ];

  const visibleActions = actions.filter(action => action.visible);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg font-semibold">
            {selectedItems.length === 1 && selectedItems[0]
              ? selectedItems[0].name
              : `${selectedItems.length} items selected`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {visibleActions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant="ghost"
                    className={`w-full justify-start h-12 px-4 ${action.className}`}
                    onClick={action.onClick}
                  >
                    <action.icon className="h-4 w-4 mr-3" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
          
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-center h-10"
              onClick={onClose}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}