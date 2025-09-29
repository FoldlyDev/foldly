'use client';

import { useEffect } from 'react';
import { useCloudStorage } from '@/features/cloud-storage/hooks/use-cloud-storage';
import { CloudStorageConnector } from '@/features/cloud-storage/components/cloud-storage-connector';
import { FolderOpen, RefreshCw, PanelRightClose } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
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

interface GoogleDriveSectionProps {
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
function GoogleDriveTree({ files, onDownload, onFolderExpand }: {
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
      // Check if file has parents array (Google Drive) or parentId
      const parentId = file.parentId || (file.parents && file.parents[0]);

      if (parentId && fileMap.has(parentId)) {
        const parent = fileMap.get(parentId)!;
        parent.children!.push(node);
      } else {
        // If no parent or parent not found, it's a root item
        roots.push(node);
      }
    });

    // Sort children for each folder
    const sortChildren = (items: (CloudFile & { children?: CloudFile[] })[]) => {
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          item.children.sort((a, b) => {
            // Folders first, then files
            if (a.isFolder !== b.isFolder) {
              return a.isFolder ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          });
          sortChildren(item.children);
        }
      });
    };

    sortChildren(roots);

    // Sort root items
    roots.sort((a, b) => {
      if (a.isFolder !== b.isFolder) {
        return a.isFolder ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
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

export function GoogleDriveSection({ onCollapse }: GoogleDriveSectionProps = {}) {
  const storage = useCloudStorage({ provider: 'google-drive', autoConnect: true });

  // Fetch files when provider is connected
  useEffect(() => {
    if (storage.isConnected && !storage.isLoadingFiles && storage.files.length === 0) {
      storage.listFiles();
    }
  }, [storage.isConnected, storage.isLoadingFiles, storage.files.length]);

  if (!storage.isConnected) {
    return (
      <div className="h-full foldly-glass-light dark:foldly-glass rounded-xl transition-all">
        <div className="p-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaGoogle className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Google Drive</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50 px-2 py-1 rounded-full">
                Not connected
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
        <div className="flex flex-col items-center justify-center p-8 min-h-[350px]">
          <FaGoogle className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
          <div className="text-center space-y-3 mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Connect to Google Drive</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
              Access and manage your Google Drive files directly from your workspace
            </p>
          </div>
          <TertiaryCTAButton
            onClick={() => {
              const connector = document.querySelector('[data-provider="google-drive"]') as HTMLElement;
              connector?.click();
            }}
            className="!py-2 !px-6 !text-sm"
          >
            <FaGoogle className="w-4 h-4 mr-2" />
            Connect
          </TertiaryCTAButton>
          <div className="hidden">
            <CloudStorageConnector provider="google-drive" variant="default" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full foldly-glass-light dark:foldly-glass rounded-xl transition-all flex flex-col">
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaGoogle className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Google Drive</h3>
          </div>
          <div className="flex items-center gap-2">
            {storage.isConnected && (
              <span className="text-xs text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                Connected
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => storage.listFiles()}
              disabled={storage.isLoadingFiles}
              title="Refresh files"
            >
              <RefreshCw className={`h-4 w-4 text-gray-600 dark:text-gray-400 ${storage.isLoadingFiles ? 'animate-spin' : ''}`} />
            </Button>
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

      <div className="p-4 flex-1 overflow-hidden flex flex-col">
        {storage.filesError && (
          <Alert variant="destructive" className="mb-4 flex-shrink-0">
            <AlertDescription>
              {storage.filesError || 'Failed to load files. Please try reconnecting.'}
            </AlertDescription>
          </Alert>
        )}

        {storage.isLoadingFiles && <ContentLoader className="h-48" />}

        {!storage.isLoadingFiles && !storage.filesError && (
          <>
            {(!storage.files || storage.files.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 mb-3 text-gray-400 dark:text-gray-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">No files found in your Google Drive</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => storage.listFiles()}
                >
                  Refresh
                </Button>
              </div>
            ) : (
              <div className="h-full overflow-y-auto">
                <GoogleDriveTree
                  files={storage.files}
                  onDownload={(fileId) => storage.downloadFile(fileId)}
                  onFolderExpand={(folderId) => storage.listFiles(folderId)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}