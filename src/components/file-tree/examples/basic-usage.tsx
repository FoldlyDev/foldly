// =============================================================================
// BASIC FILE TREE USAGE EXAMPLES
// =============================================================================
// 🎯 Examples showing how to use the file tree system in different contexts

import React, { useState, useMemo } from 'react';
import { TreeContainer, TreeProvider } from '@/components/file-tree';
import {
  buildWorkspaceTree,
  buildLinksTree,
  buildUploadTree,
} from '@/lib/hooks/file-tree/use-tree-utils';
import type {
  TreeNode,
  File,
  Folder,
  Link,
  UploadFile,
} from '@/types/file-tree';

// =============================================================================
// MOCK DATA
// =============================================================================

const mockFolders: Folder[] = [
  {
    id: 'folder-1',
    userId: 'user-1',
    workspaceId: 'workspace-1',
    parentFolderId: null,
    linkId: null,
    name: 'Documents',
    path: '/Documents',
    depth: 0,
    isArchived: false,
    isPublic: false,
    sortOrder: 0,
    fileCount: 3,
    totalSize: 1024000,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'folder-2',
    userId: 'user-1',
    workspaceId: 'workspace-1',
    parentFolderId: 'folder-1',
    linkId: null,
    name: 'Projects',
    path: '/Documents/Projects',
    depth: 1,
    isArchived: false,
    isPublic: false,
    sortOrder: 0,
    fileCount: 2,
    totalSize: 512000,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

const mockFiles: File[] = [
  {
    id: 'file-1',
    batchId: 'batch-1',
    linkId: 'link-1',
    userId: 'user-1',
    folderId: 'folder-1',
    fileName: 'document.pdf',
    originalName: 'document.pdf',
    fileSize: 256000,
    mimeType: 'application/pdf',
    fileHash: 'hash-1',
    storagePath: '/storage/document.pdf',
    storageProvider: 'local',
    storageMetadata: null,
    status: 'completed',
    processingStartedAt: null,
    processingCompletedAt: new Date('2024-01-01'),
    errorMessage: null,
    width: null,
    height: null,
    duration: null,
    thumbnailPath: null,
    isPublic: false,
    downloadCount: 0,
    lastDownloadAt: null,
    expiresAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'file-2',
    batchId: 'batch-1',
    linkId: 'link-1',
    userId: 'user-1',
    folderId: 'folder-2',
    fileName: 'project.jpg',
    originalName: 'project.jpg',
    fileSize: 128000,
    mimeType: 'image/jpeg',
    fileHash: 'hash-2',
    storagePath: '/storage/project.jpg',
    storageProvider: 'local',
    storageMetadata: null,
    status: 'completed',
    processingStartedAt: null,
    processingCompletedAt: new Date('2024-01-02'),
    errorMessage: null,
    width: 1920,
    height: 1080,
    duration: null,
    thumbnailPath: '/storage/project_thumb.jpg',
    isPublic: false,
    downloadCount: 0,
    lastDownloadAt: null,
    expiresAt: null,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

const mockLinks: Link[] = [
  {
    id: 'link-1',
    userId: 'user-1',
    workspaceId: 'workspace-1',
    slug: 'my-files',
    topic: 'files',
    linkType: 'base',
    title: 'My Files',
    description: 'A collection of my files',
    requireEmail: false,
    requirePassword: false,
    passwordHash: null,
    isPublic: true,
    isActive: true,
    maxFiles: 100,
    maxFileSize: 10485760,
    allowedFileTypes: null,
    expiresAt: null,
    brandEnabled: false,
    brandColor: null,
    totalUploads: 2,
    totalFiles: 2,
    totalSize: 384000,
    lastUploadAt: new Date('2024-01-02'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  },
];

const mockUploadFiles: UploadFile[] = [
  {
    id: 'upload-1',
    name: 'new-document.pdf',
    size: 512000,
    type: 'application/pdf',
    lastModified: Date.now(),
    // Add other required UploadFile properties
  } as UploadFile,
  {
    id: 'upload-2',
    name: 'image.png',
    size: 256000,
    type: 'image/png',
    lastModified: Date.now(),
    // Add other required UploadFile properties
  } as UploadFile,
];

// =============================================================================
// WORKSPACE TREE EXAMPLE
// =============================================================================

export const WorkspaceTreeExample: React.FC = () => {
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());

  const workspaceTree = useMemo(() => {
    return buildWorkspaceTree(mockFolders, mockFiles, {
      sortFunction: (a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      },
    });
  }, []);

  const handleNodeSelect = (nodeId: string) => {
    console.log('Selected node:', nodeId);
    setSelectedNodes(new Set([nodeId]));
  };

  const handleNodeExpand = (nodeId: string) => {
    console.log('Expanded node:', nodeId);
  };

  const handleNodeAction = (action: string, nodeId: string) => {
    console.log('Node action:', action, 'on node:', nodeId);
  };

  return (
    <div className='p-4 border rounded-lg'>
      <h3 className='text-lg font-semibold mb-4'>Workspace Tree Example</h3>
      <div className='h-64 border rounded'>
        <TreeProvider
          contextType='workspace'
          contextId='workspace-1'
          nodes={workspaceTree}
        >
          <TreeContainer
            contextType='workspace'
            data={workspaceTree}
            onNodeSelect={handleNodeSelect}
            onNodeExpand={handleNodeExpand}
            onNodeAction={handleNodeAction}
            multiSelect={true}
            dragEnabled={true}
            contextMenuEnabled={true}
            className='p-2'
          />
        </TreeProvider>
      </div>
    </div>
  );
};

// =============================================================================
// COMBINED EXAMPLE
// =============================================================================

export const CombinedTreeExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'workspace'>('workspace');

  return (
    <div className='p-6 space-y-6'>
      <div className='flex space-x-4 border-b'>
        <button
          onClick={() => setActiveTab('workspace')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'workspace'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Workspace
        </button>
      </div>

      <WorkspaceTreeExample />
    </div>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

export default CombinedTreeExample;
