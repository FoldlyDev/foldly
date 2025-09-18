import * as React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { cn } from '@/lib/utils/utils';
import {
  Files,
  FolderItem,
  FolderTrigger,
  FolderPanel,
  FileItem,
  SubFiles,
} from '@/components/animate-ui/components/base/files';

export interface CloudFile {
  id: string;
  name: string;
  size?: number;
  isFolder: boolean;
  mimeType?: string;
  createdTime?: string;
  modifiedTime?: string;
  parentId?: string;
  children?: CloudFile[];
}

interface CloudTreeProps {
  files: CloudFile[];
  onDownload?: (fileId: string) => void;
  onFolderClick?: (folderId: string) => void;
  className?: string;
  isLoading?: boolean;
  defaultOpen?: string[];
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Build nested tree structure from flat array
function buildTreeStructure(files: CloudFile[]): CloudFile[] {
  const fileMap = new Map<string, CloudFile>();
  const rootFiles: CloudFile[] = [];

  // Create a map of all files with empty children arrays
  files.forEach(file => {
    fileMap.set(file.id, { ...file, children: [] });
  });

  // Build the tree structure
  files.forEach(file => {
    const currentFile = fileMap.get(file.id);
    if (!currentFile) return;

    if (file.parentId && fileMap.has(file.parentId)) {
      const parent = fileMap.get(file.parentId);
      if (parent && parent.children) {
        parent.children.push(currentFile);
      }
    } else {
      rootFiles.push(currentFile);
    }
  });

  // Sort folders first, then files
  const sortItems = (items: CloudFile[]) => {
    items.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });
    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        sortItems(item.children);
      }
    });
  };

  sortItems(rootFiles);
  return rootFiles;
}

function CloudTreeItems({
  files,
  onDownload,
  onFolderClick,
}: {
  files: CloudFile[];
  onDownload?: (fileId: string) => void;
  onFolderClick?: (folderId: string) => void;
}) {
  return (
    <>
      {files.map(file => {
        if (file.isFolder) {
          // Folder with or without children
          return (
            <FolderItem key={file.id} value={file.id}>
              <FolderTrigger>
                <div className="flex items-center justify-between w-full">
                  <span className="truncate flex-1">{file.name}</span>
                  {file.children && file.children.length > 0 && (
                    <span className="text-xs text-muted-foreground mr-2">
                      {file.children.length} items
                    </span>
                  )}
                </div>
              </FolderTrigger>
              {file.children && file.children.length > 0 && (
                <FolderPanel>
                  <SubFiles>
                    <CloudTreeItems
                      files={file.children}
                      onDownload={onDownload}
                      onFolderClick={onFolderClick}
                    />
                  </SubFiles>
                </FolderPanel>
              )}
            </FolderItem>
          );
        }

        // File item
        return (
          <div key={file.id} className="relative group">
            <FileItem>
              <div className="flex items-center justify-between w-full">
                <span className="truncate flex-1">{file.name}</span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {file.size && (
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                  )}
                  {onDownload && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload(file.id);
                      }}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </FileItem>
          </div>
        );
      })}
    </>
  );
}

export function CloudTree({
  files,
  onDownload,
  onFolderClick,
  className,
  isLoading,
  defaultOpen = [],
}: CloudTreeProps) {
  const treeData = React.useMemo(() => buildTreeStructure(files), [files]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (treeData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <FolderIcon className="h-12 w-12 mb-2 opacity-50" />
        <p className="text-sm">No files found</p>
      </div>
    );
  }

  return (
    <Files
      className={cn('border-0 p-0', className)}
      defaultOpen={defaultOpen}
    >
      <CloudTreeItems
        files={treeData}
        onDownload={onDownload}
        onFolderClick={onFolderClick}
      />
    </Files>
  );
}