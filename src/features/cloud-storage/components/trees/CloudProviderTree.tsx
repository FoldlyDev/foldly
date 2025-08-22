'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FileIcon, Loader2, FolderOpen } from 'lucide-react';
import { CloudTreeNode, CloudProvider } from '@/lib/services/cloud-storage';
import { useCloudFolder } from '@/lib/services/cloud-storage';
import { useCloudViewStore } from '../../stores/cloud-view-store';
import { cn } from '@/lib/utils';

interface CloudProviderTreeProps {
  provider: CloudProvider['id'];
}

export function CloudProviderTree({ provider }: CloudProviderTreeProps) {
  const { tree, isLoading, error, loadFolder } = useCloudFolder(provider);
  const { selectedFiles, toggleFileSelection } = useCloudViewStore();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const handleNodeClick = (node: CloudTreeNode, event: React.MouseEvent) => {
    event.stopPropagation();

    if (node.type === 'folder') {
      const isExpanded = expandedNodes.has(node.id);
      
      if (isExpanded) {
        setExpandedNodes(prev => {
          const next = new Set(prev);
          next.delete(node.id);
          return next;
        });
      } else {
        setExpandedNodes(prev => new Set(prev).add(node.id));
        
        // Load children if not already loaded
        if (!node.children || node.children.length === 0) {
          loadFolder({ folderId: node.id });
        }
      }
    } else {
      // Toggle file selection
      toggleFileSelection(provider, node.id);
    }
  };

  const handleDrop = (event: React.DragEvent, targetNode?: CloudTreeNode) => {
    event.preventDefault();
    event.stopPropagation();

    // Handle external drops (from other trees or local files)
    const files = event.dataTransfer.files;
    const draggedData = event.dataTransfer.getData('application/json');

    if (files.length > 0) {
      // Handle local file drops
      console.log('Dropped local files:', files);
      // Implement upload logic here
    } else if (draggedData) {
      // Handle drops from other cloud providers
      const data = JSON.parse(draggedData);
      console.log('Dropped cloud files:', data);
      // Implement cloud-to-cloud transfer logic here
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const renderNode = (node: CloudTreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedFiles[provider]?.includes(node.id);
    const isFolder = node.type === 'folder';

    // Determine the folder icon color based on provider
    const folderIconClass = provider === 'google-drive' 
      ? 'text-blue-600' 
      : 'text-blue-500';

    return (
      <div key={node.id}>
        <div
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent transition-colors',
            isSelected && 'bg-accent',
            isFolder && 'font-medium'
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={(e) => handleNodeClick(node, e)}
          onDrop={(e) => handleDrop(e, node)}
          onDragOver={handleDragOver}
        >
          {isFolder && (
            <span className="w-4 h-4 flex items-center justify-center">
              {node.isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </span>
          )}
          {!isFolder && <span className="w-4" />}
          
          {isFolder ? (
            isExpanded ? (
              <FolderOpen className={cn("w-4 h-4", folderIconClass)} />
            ) : (
              <Folder className={cn("w-4 h-4", folderIconClass)} />
            )
          ) : (
            <FileIcon className="w-4 h-4 text-gray-600" />
          )}
          
          <span className="truncate flex-1">{node.name}</span>
        </div>

        {isFolder && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        Error loading {provider === 'google-drive' ? 'Google Drive' : 'OneDrive'}: {error.message}
      </div>
    );
  }

  return (
    <div 
      className="h-full overflow-auto p-2"
      onDrop={(e) => handleDrop(e)}
      onDragOver={handleDragOver}
    >
      {tree.length === 0 ? (
        <div className="text-sm text-muted-foreground p-4 text-center">
          No files found
        </div>
      ) : (
        tree.map(node => renderNode(node))
      )}
    </div>
  );
}