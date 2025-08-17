'use client';

import React, { useState } from 'react';
import {
  checkboxesFeature,
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  renamingFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from '@headless-tree/core';
import { AssistiveTreeDescription, useTree } from '@headless-tree/react';
import { FolderIcon, FolderOpenIcon } from 'lucide-react';

import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { Input } from '@/components/ui/shadcn/input';
import { getFileIcon } from '../sub-components/file';
import { DragPreview, useDragPreview } from '../sub-components/DragPreview';
import {
  Tree,
  TreeDragLine,
  TreeItem,
  TreeItemLabel,
} from './tree-orchestrator';
import {
  type TreeItem as TreeItemType,
  isFolder,
  isFile,
  getItemChildren,
} from '../types/tree-types';
import { createRenameHandler, createTreeDropHandler } from '../handlers';
import '../styles/drag-preview.css';

// =============================================================================
// SAMPLE DATA - Mixed files and folders
// =============================================================================

const initialItems: Record<string, TreeItemType> = {
  // Root folder
  company: {
    id: 'company',
    name: 'Company',
    type: 'folder',
    path: '/',
    depth: 0,
    children: ['engineering', 'marketing', 'operations', 'readme-root'],
  },

  // Root file
  'readme-root': {
    id: 'readme-root',
    name: 'README.md',
    type: 'file',
    parentId: 'company',
    mimeType: 'text/markdown',
    fileSize: 4096,
    extension: 'md',
  },

  // Engineering branch
  engineering: {
    id: 'engineering',
    name: 'Engineering',
    type: 'folder',
    parentId: 'company',
    path: '/engineering',
    depth: 1,
    children: ['frontend', 'backend', 'platform-team'],
  },

  frontend: {
    id: 'frontend',
    name: 'Frontend',
    type: 'folder',
    parentId: 'engineering',
    path: '/engineering/frontend',
    depth: 2,
    children: ['design-system', 'web-platform', 'package-json'],
  },

  'package-json': {
    id: 'package-json',
    name: 'package.json',
    type: 'file',
    parentId: 'frontend',
    mimeType: 'application/json',
    fileSize: 2048,
    extension: 'json',
  },

  'design-system': {
    id: 'design-system',
    name: 'Design System',
    type: 'folder',
    parentId: 'frontend',
    path: '/engineering/frontend/design-system',
    depth: 3,
    children: ['components', 'tokens', 'guidelines', 'index-ts'],
  },

  'index-ts': {
    id: 'index-ts',
    name: 'index.ts',
    type: 'file',
    parentId: 'design-system',
    mimeType: 'text/typescript',
    fileSize: 1024,
    extension: 'ts',
  },

  components: {
    id: 'components',
    name: 'Components',
    type: 'folder',
    parentId: 'design-system',
    path: '/engineering/frontend/design-system/components',
    depth: 4,
    children: ['button-tsx', 'card-tsx'],
  },

  'button-tsx': {
    id: 'button-tsx',
    name: 'Button.tsx',
    type: 'file',
    parentId: 'components',
    mimeType: 'text/typescript',
    fileSize: 3072,
    extension: 'tsx',
  },

  'card-tsx': {
    id: 'card-tsx',
    name: 'Card.tsx',
    type: 'file',
    parentId: 'components',
    mimeType: 'text/typescript',
    fileSize: 2560,
    extension: 'tsx',
  },

  tokens: {
    id: 'tokens',
    name: 'Tokens',
    type: 'folder',
    parentId: 'design-system',
    path: '/engineering/frontend/design-system/tokens',
    depth: 4,
  },

  guidelines: {
    id: 'guidelines',
    name: 'Guidelines',
    type: 'folder',
    parentId: 'design-system',
    path: '/engineering/frontend/design-system/guidelines',
    depth: 4,
  },

  'web-platform': {
    id: 'web-platform',
    name: 'Web Platform',
    type: 'folder',
    parentId: 'frontend',
    path: '/engineering/frontend/web-platform',
    depth: 3,
  },

  backend: {
    id: 'backend',
    name: 'Backend',
    type: 'folder',
    parentId: 'engineering',
    path: '/engineering/backend',
    depth: 2,
    children: ['apis', 'infrastructure', 'server-js'],
  },

  'server-js': {
    id: 'server-js',
    name: 'server.js',
    type: 'file',
    parentId: 'backend',
    mimeType: 'text/javascript',
    fileSize: 5120,
    extension: 'js',
  },

  apis: {
    id: 'apis',
    name: 'APIs',
    type: 'folder',
    parentId: 'backend',
    path: '/engineering/backend/apis',
    depth: 3,
  },

  infrastructure: {
    id: 'infrastructure',
    name: 'Infrastructure',
    type: 'folder',
    parentId: 'backend',
    path: '/engineering/backend/infrastructure',
    depth: 3,
  },

  'platform-team': {
    id: 'platform-team',
    name: 'Platform Team',
    type: 'folder',
    parentId: 'engineering',
    path: '/engineering/platform-team',
    depth: 2,
  },

  // Marketing branch
  marketing: {
    id: 'marketing',
    name: 'Marketing',
    type: 'folder',
    parentId: 'company',
    path: '/marketing',
    depth: 1,
    children: ['content', 'seo'],
  },

  content: {
    id: 'content',
    name: 'Content',
    type: 'folder',
    parentId: 'marketing',
    path: '/marketing/content',
    depth: 2,
    children: ['blog-post-md'],
  },

  'blog-post-md': {
    id: 'blog-post-md',
    name: 'blog-post.md',
    type: 'file',
    parentId: 'content',
    mimeType: 'text/markdown',
    fileSize: 8192,
    extension: 'md',
  },

  seo: {
    id: 'seo',
    name: 'SEO',
    type: 'folder',
    parentId: 'marketing',
    path: '/marketing/seo',
    depth: 2,
  },

  // Operations branch
  operations: {
    id: 'operations',
    name: 'Operations',
    type: 'folder',
    parentId: 'company',
    path: '/operations',
    depth: 1,
    children: ['hr', 'finance'],
  },

  hr: {
    id: 'hr',
    name: 'HR',
    type: 'folder',
    parentId: 'operations',
    path: '/operations/hr',
    depth: 2,
    children: ['policies-pdf'],
  },

  'policies-pdf': {
    id: 'policies-pdf',
    name: 'policies.pdf',
    type: 'file',
    parentId: 'hr',
    mimeType: 'application/pdf',
    fileSize: 102400,
    extension: 'pdf',
  },

  finance: {
    id: 'finance',
    name: 'Finance',
    type: 'folder',
    parentId: 'operations',
    path: '/operations/finance',
    depth: 2,
    children: ['budget-xlsx'],
  },

  'budget-xlsx': {
    id: 'budget-xlsx',
    name: 'budget.xlsx',
    type: 'file',
    parentId: 'finance',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSize: 45056,
    extension: 'xlsx',
  },
};

// =============================================================================
// FILE TREE COMPONENT
// =============================================================================

const indent = 20;

export default function FileTree() {
  const [items, setItems] = useState(initialItems);

  // Create handlers with the current state
  const renameHandler = createRenameHandler(setItems);
  const dropHandler = createTreeDropHandler(setItems);

  // Get drag preview configuration
  const dragPreviewConfig = useDragPreview();

  const tree = useTree<TreeItemType>({
    initialState: {
      expandedItems: ['engineering', 'frontend', 'design-system', 'components'],
      checkedItems: ['components', 'tokens'],
    },
    indent,
    rootItemId: 'company',
    getItemName: item => item.getItemData().name,
    // isItemFolder: item => isFolder(item.getItemData()),
    // Fix for checkbox selection: only treat items with children as folders
    isItemFolder: item => {
      const itemData = item.getItemData();
      return isFolder(itemData) && (itemData.children?.length ?? 0) > 0;
    },
    canReorder: true,
    dataLoader: {
      getItem: itemId =>
        items[itemId] || {
          id: itemId,
          name: 'Unknown',
          type: 'folder' as const,
          path: '/',
          depth: 0,
          children: [],
        },
      getChildren: itemId => {
        const item = items[itemId];
        return item ? getItemChildren(item) : [];
      },
    },
    onRename: renameHandler,
    onDrop: dropHandler,
    setDragImage: dragPreviewConfig.setDragImage,
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      checkboxesFeature,
      hotkeysCoreFeature,
      renamingFeature,
      dragAndDropFeature,
      keyboardDragAndDropFeature,
    ],
  });

  return (
    <div className='flex h-full flex-col gap-2 *:first:grow'>
      <Tree indent={indent} tree={tree}>
        <AssistiveTreeDescription tree={tree} />
        {tree.getItems().map(item => {
          const itemData = item.getItemData();

          return (
            <div
              key={item.getId()}
              className='flex items-center gap-1.5 not-last:pb-0.5'
            >
              <Checkbox
                checked={
                  {
                    checked: true,
                    unchecked: false,
                    indeterminate: 'indeterminate' as const,
                  }[item.getCheckedState()]
                }
                onCheckedChange={(checked: boolean | 'indeterminate') => {
                  const checkboxProps = item.getCheckboxProps();
                  checkboxProps.onChange?.({ target: { checked } });
                }}
              />
              <TreeItem item={item} className='flex-1 not-last:pb-0'>
                <TreeItemLabel>
                  <span className='flex items-center gap-2'>
                    {(() => {
                      if (isFolder(itemData)) {
                        return item.isExpanded() ? (
                          <FolderOpenIcon className='size-4 text-muted-foreground' />
                        ) : (
                          <FolderIcon className='size-4 text-muted-foreground' />
                        );
                      } else if (isFile(itemData)) {
                        const FileIconComponent = getFileIcon(
                          itemData.mimeType,
                          itemData.extension
                        );
                        return (
                          <FileIconComponent className='size-4 text-muted-foreground' />
                        );
                      }
                      return null;
                    })()}
                    {item.isRenaming() ? (
                      <Input
                        {...item.getRenameInputProps()}
                        autoFocus
                        className='h-6 px-1'
                      />
                    ) : (
                      <span className='truncate'>{item.getItemName()}</span>
                    )}
                  </span>
                </TreeItemLabel>
              </TreeItem>
            </div>
          );
        })}
        <TreeDragLine />
        <DragPreview tree={tree} />
      </Tree>

      <p
        aria-live='polite'
        role='region'
        className='text-muted-foreground mt-2 text-xs'
      >
        File & Folder tree with checkboxes, icons, rename (F2), multi-select &
        drag-drop ∙{' '}
        <a
          href='https://headless-tree.lukasbach.com'
          className='hover:text-foreground underline'
          target='_blank'
          rel='noopener noreferrer'
        >
          API
        </a>
      </p>
    </div>
  );
}
