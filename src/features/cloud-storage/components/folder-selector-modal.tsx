'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/shadcn/dialog';
import { Button } from '@/components/ui/shadcn/button';
import { ScrollArea } from '@/components/ui/shadcn/scroll-area';
import { FolderIcon, FolderOpenIcon, ChevronRight } from 'lucide-react';
import type { CloudFile, CloudProvider, CloudProviderApi } from '@/lib/services/cloud-storage/providers/types';
import { cn } from '@/lib/utils/utils';

interface FolderSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folderId: string | null) => void;
  provider: CloudProvider['id']; // Required for future use
  title?: string;
  files?: CloudFile[]; // Optional: pass if already loaded
  api?: CloudProviderApi | null; // Optional: pass if already connected
  itemsBeingCopied?: { name: string; type: 'file' | 'folder' }[]; // Items being copied
}

export function FolderSelectorModal({
  isOpen,
  onClose,
  onSelect,
  provider, // Required for future use
  title = 'Select Destination Folder',
  files = [],
  api = null,
  itemsBeingCopied = []
}: FolderSelectorModalProps) {
  // Simple: use what's passed, default to empty if not
  const isConnected = !!api;
  const isLoadingFiles = false;

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderContents, setFolderContents] = useState<Map<string, CloudFile[]>>(new Map());
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());

  // Get only folders from the files (not just root folders)
  const allFolders = files.filter(f => f.isFolder);

  // Build a map of all file IDs for parent checking (same as GoogleDriveTree)
  const fileMap = new Set(files.map(f => f.id));

  // Get root folders using the SAME logic as GoogleDriveTree
  const rootFolders = allFolders.filter(f => {
    const parentId = (f as any).parentId || (f.parents && f.parents[0]);
    // If no parent OR parent not in our file list, it's a root item
    return !parentId || !fileMap.has(parentId);
  });

  // If no files are passed, show a message
  const hasFiles = files.length > 0;
  const hasFolders = allFolders.length > 0;


  // Toggle folder expansion
  const toggleFolderExpansion = async (folderId: string) => {
    const newExpanded = new Set(expandedFolders);

    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);

      // Load folder contents if needed and API is available
      if (api && !folderContents.has(folderId)) {
        setLoadingFolders(prev => new Set(prev).add(folderId));
        const result = await api.getFiles(folderId);
        if (result.success) {
          const subFolders = result.data.filter(f => f.isFolder);
          setFolderContents(prev => new Map(prev).set(folderId, subFolders));
        }
        setLoadingFolders(prev => {
          const next = new Set(prev);
          next.delete(folderId);
          return next;
        });
      }
    }

    setExpandedFolders(newExpanded);
  };

  // Select a folder
  const selectFolder = (folderId: string | null) => {
    setSelectedFolderId(folderId);
  };

  // Build hierarchical structure for rendering
  const buildFolderTree = (folders: CloudFile[], level = 0): React.ReactElement[] => {
    return folders.map(folder => {
      // Check if folder has children - could be in main files list OR in folderContents
      const childrenInMainList = allFolders.filter(f => {
        const parentId = (f as any).parentId || (f.parents && f.parents[0]);
        return parentId === folder.id;
      });

      const hasChildren = childrenInMainList.length > 0 ||
                         (folderContents.has(folder.id) && folderContents.get(folder.id)!.length > 0);

      const isExpanded = expandedFolders.has(folder.id);
      const isSelected = selectedFolderId === folder.id;
      const isLoading = loadingFolders.has(folder.id);

      return (
        <div key={folder.id}>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors cursor-pointer group",
              isSelected && "bg-blue-50 dark:bg-blue-900/20",
              !isSelected && "hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            style={{ paddingLeft: `${level * 20 + 8}px` }}
          >
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolderExpansion(folder.id);
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <ChevronRight className={cn(
                  "h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform",
                  isExpanded && "rotate-90"
                )} />
              </button>
            )}
            {!hasChildren && <div className="w-6" />}

            <div
              className="flex items-center gap-2 flex-1"
              onClick={() => selectFolder(folder.id)}
            >
              <FolderIcon className={cn(
                "h-4 w-4",
                isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
              )} />
              <span className={cn(
                "text-sm",
                isSelected && "font-medium text-blue-900 dark:text-blue-100"
              )}>{folder.name}</span>
            </div>
          </div>

          {/* Render children if expanded */}
          {isExpanded && hasChildren && (
            <div>
              {isLoading ? (
                <div className="pl-8 py-2">
                  <div className="animate-pulse text-xs text-gray-500">Loading...</div>
                </div>
              ) : (
                // Use children from folderContents if loaded, otherwise use children from main list
                buildFolderTree(
                  folderContents.has(folder.id)
                    ? folderContents.get(folder.id)!
                    : childrenInMainList,
                  level + 1
                )
              )}
            </div>
          )}
        </div>
      );
    });
  };

  const handleConfirm = () => {
    onSelect(selectedFolderId);
    onClose();
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFolderId(null);
      setExpandedFolders(new Set());
      setFolderContents(new Map());
      setLoadingFolders(new Set());
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Items being copied info */}
          {itemsBeingCopied.length > 0 && (
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Copying:</p>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {itemsBeingCopied.length === 1 && itemsBeingCopied[0] ? (
                  <span>{itemsBeingCopied[0].name}</span>
                ) : (
                  <span>{itemsBeingCopied.length} items</span>
                )}
              </div>
              {itemsBeingCopied.length > 1 && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {itemsBeingCopied.filter(i => i.type === 'folder').length} folder(s),
                  {' '}{itemsBeingCopied.filter(i => i.type === 'file').length} file(s)
                </p>
              )}
            </div>
          )}

          {/* Selected destination */}
          {!isLoadingFiles && (
            <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <FolderOpenIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Destination: {selectedFolderId
                    ? allFolders.find(f => f.id === selectedFolderId)?.name || 'Unknown'
                    : 'Root'}
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Items will be copied to this folder
              </p>
            </div>
          )}

          {/* Folder list */}
          {!isLoadingFiles && (
            <ScrollArea className="h-[250px] border rounded-lg p-2">
              {rootFolders.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpenIcon className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {!hasFiles
                      ? 'Loading folders...'
                      : !hasFolders
                      ? 'No folders in your drive'
                      : 'No folders found'}
                  </p>
                  {hasFolders && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Found {allFolders.length} folder(s), {rootFolders.length} at root
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {buildFolderTree(rootFolders)}
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isConnected}>
            Select Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}