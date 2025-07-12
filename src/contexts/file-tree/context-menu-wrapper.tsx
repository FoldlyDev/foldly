// =============================================================================
// CONTEXT MENU WRAPPER - Universal context menu wrapper for tree nodes
// =============================================================================
// 🎯 Provides context-aware menu options based on node type and context

import React, { memo, useCallback } from 'react';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from '@/components/ui/shadcn/context-menu';
import { useTreeStore } from '@/lib/hooks/file-tree/use-tree-state';
import { WorkspaceContextMenu } from './workspace-context';
import { FilesContextMenu } from './files-context';
import { UploadContextMenu } from './upload-context';
import type { TreeNode, ContextType } from '@/types/file-tree';

// =============================================================================
// CONTEXT MENU WRAPPER PROPS
// =============================================================================

interface ContextMenuWrapperProps {
  contextType: ContextType;
  node: TreeNode;
  children: React.ReactNode;
  disabled?: boolean;
}

// =============================================================================
// CONTEXT MENU WRAPPER COMPONENT
// =============================================================================

const ContextMenuWrapperComponent: React.FC<ContextMenuWrapperProps> = ({
  contextType,
  node,
  children,
  disabled = false,
}) => {
  const { hideContextMenu } = useTreeStore();

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        hideContextMenu();
      }
    },
    [hideContextMenu]
  );

  // =============================================================================
  // RENDER CONTEXT MENU
  // =============================================================================

  const renderContextMenu = useCallback(() => {
    switch (contextType) {
      case 'workspace':
        return <WorkspaceContextMenu node={node} />;
      case 'files':
        return <FilesContextMenu node={node} />;
      case 'upload':
        return <UploadContextMenu node={node} />;
      default:
        return null;
    }
  }, [contextType, node]);

  // =============================================================================
  // RENDER COMPONENT
  // =============================================================================

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <ContextMenu onOpenChange={handleOpenChange}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className='w-48'>
        {renderContextMenu()}
      </ContextMenuContent>
    </ContextMenu>
  );
};

// =============================================================================
// CONTEXT MENU WRAPPER VARIANTS
// =============================================================================

/**
 * Workspace Context Menu Wrapper
 */
export const WorkspaceContextMenuWrapper: React.FC<
  Omit<ContextMenuWrapperProps, 'contextType'>
> = props => <ContextMenuWrapperComponent {...props} contextType='workspace' />;

/**
 * Files Context Menu Wrapper
 */
export const FilesContextMenuWrapper: React.FC<
  Omit<ContextMenuWrapperProps, 'contextType'>
> = props => <ContextMenuWrapperComponent {...props} contextType='files' />;

/**
 * Upload Context Menu Wrapper
 */
export const UploadContextMenuWrapper: React.FC<
  Omit<ContextMenuWrapperProps, 'contextType'>
> = props => <ContextMenuWrapperComponent {...props} contextType='upload' />;

// =============================================================================
// COMPONENT EXPORTS
// =============================================================================

export const ContextMenuWrapper = memo(ContextMenuWrapperComponent);
export { ContextMenuWrapperComponent };

// Default export for convenience
export default ContextMenuWrapper;
