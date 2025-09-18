'use client';

import { useEffect } from 'react';
import { useCloudStorage } from '@/features/cloud-storage/hooks/use-cloud-storage';
import { CloudStorageConnector } from '@/features/cloud-storage/components/cloud-storage-connector';
import { FolderOpen, RefreshCw, PanelRightClose } from 'lucide-react';
import { GrOnedrive } from 'react-icons/gr';
import { Button } from '@/components/ui/shadcn/button';
import { TertiaryCTAButton } from '@/components/core/tertiary-cta-button';
import { ContentLoader } from '@/components/feedback';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import {
  Files,
  FolderItem,
  FolderTrigger,
  FolderPanel,
  FileItem,
  SubFiles,
} from '@/features/cloud-storage/components/cloud-files';
import { Download } from 'lucide-react';

interface OneDriveSectionProps {
  onCollapse?: () => void;
}

interface CloudFile {
  id: string;
  name: string;
  size?: number;
  isFolder: boolean;
  mimeType?: string;
  parents?: string[] | undefined;
  parentId?: string;
}

// Build tree structure from flat array and render with animate UI components
function OneDriveTree({ files, onDownload, onFolderExpand }: {
  files: CloudFile[],
  onDownload: (id: string) => void,
  onFolderExpand?: (folderId: string) => void
}) {
  // Build nested structure from flat array
  const buildTree = (files: CloudFile[]) => {
    const fileMap = new Map<string, CloudFile & { children?: CloudFile[] }>();
    const roots: (CloudFile & { children?: CloudFile[] })[] = [];

    // First pass: create all nodes
    files.forEach(file => {
      fileMap.set(file.id, { ...file, children: [] });
    });

    // Second pass: build tree
    files.forEach(file => {
      const node = fileMap.get(file.id)!;
      if (file.parentId && fileMap.has(file.parentId)) {
        const parent = fileMap.get(file.parentId)!;
        parent.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  // Recursively render tree using animate UI components
  const renderTree = (items: (CloudFile & { children?: CloudFile[] })[]) => {
    return items.map(item => {
      if (item.isFolder) {
        if (!item.children || item.children.length === 0) {
          // Empty folder
          return (
            <FolderItem key={item.id} value={item.id}>
              <FolderTrigger>{item.name}</FolderTrigger>
            </FolderItem>
          );
        }
        // Folder with children
        return (
          <FolderItem key={item.id} value={item.id}>
            <FolderTrigger onClick={() => onFolderExpand?.(item.id)}>{item.name}</FolderTrigger>
            <FolderPanel>
              <SubFiles>
                {renderTree(item.children)}
              </SubFiles>
            </FolderPanel>
          </FolderItem>
        );
      }
      // File
      return (
        <FileItem key={item.id}>
          <div className="flex items-center justify-between w-full">
            <span>{item.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(item.id);
              }}
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        </FileItem>
      );
    });
  };

  const treeData = buildTree(files);

  return (
    <Files className="w-full border-0 p-0">
      {renderTree(treeData)}
    </Files>
  );
}

export function OneDriveSection({ onCollapse }: OneDriveSectionProps = {}) {
  // OneDrive integration coming soon - commented out for now
  // const storage = useCloudStorage({ provider: 'onedrive', autoConnect: true });

  // Fetch files when provider is connected
  // useEffect(() => {
  //   if (storage.isConnected && !storage.isLoadingFiles && storage.files.length === 0) {
  //     storage.listFiles();
  //   }
  // }, [storage.isConnected, storage.isLoadingFiles, storage.files.length]);

  // Coming Soon implementation
  return (
    <div className="h-full foldly-glass-light dark:foldly-glass rounded-xl transition-all">
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GrOnedrive className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">OneDrive</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full font-medium">
              Coming Soon
            </span>
            {onCollapse && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onCollapse}
                title="Collapse panel"
                className="hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <PanelRightClose className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center p-6 min-h-[350px]">
        <div className="relative">
          <GrOnedrive className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4 animate-pulse" />
          <div className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-lg">
            SOON
          </div>
        </div>
        <div className="text-center space-y-2 mb-4">
          <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            OneDrive Integration
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
            We're working hard to bring seamless OneDrive integration to your workspace.
            Get ready for powerful cloud storage features!
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-2xl">🚀</span>
          <span className="text-2xl">☁️</span>
          <span className="text-2xl">✨</span>
        </div>
      </div>
    </div>
  );

  // Original implementation - commented out
  // if (!storage.isConnected) {
  //   return (
  //     <div className="h-full foldly-glass-light dark:foldly-glass rounded-xl transition-all">
  //       ...
  //     </div>
  //   );
  // }

  // return (
  //   <div className="h-full foldly-glass-light dark:foldly-glass rounded-xl transition-all flex flex-col">
  //     ...
  //   </div>
  // );
}