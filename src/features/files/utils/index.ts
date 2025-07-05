// Files Feature Utils Barrel Export
// Export all utility functions and mock data for file management
// Following 2025 TypeScript best practices with comprehensive exports

// =============================================================================
// MOCK DATA EXPORTS
// =============================================================================

export * from './mock-data';

// =============================================================================
// FILE OPERATIONS EXPORTS
// =============================================================================

export * from './file-operations';

// =============================================================================
// FILE TREE EXPORTS
// =============================================================================

export * from './file-tree';

// =============================================================================
// CONVENIENCE RE-EXPORTS
// =============================================================================

// Mock data convenience exports
export {
  MOCK_FILES,
  MOCK_FOLDERS,
  MOCK_WORKSPACE,
  initializeMockData,
  getFilesByFolderId,
  getFilesByWorkspaceId,
  getRootFolders,
  getSubfoldersByParentId,
  getFolderById,
  getFileById,
  getRecentFiles,
  getSharedFiles,
  getPublicFiles,
  getWorkspaceStats,
  searchFiles as searchMockFiles,
  searchFolders as searchMockFolders,
  getFilesByType,
  getFilesBySize,
  getFilesByDateRange,
} from './mock-data';

// File operations convenience exports
export {
  getFileNameWithoutExtension,
  getFileExtension,
  validateAndSanitizeFileName,
  generateUniqueName,
  determineFileType,
  getFileIconWithFallback,
  getFolderIconWithColor,
  formatFileSize,
  formatFileSizeDetailed,
  formatDate,
  formatDateRelative,
  formatDateHuman,
  normalizePath,
  joinPaths,
  getParentPath,
  getPathDepth,
  generateBreadcrumbs,
  searchFiles,
  searchFolders,
  sortFiles,
  sortFolders,
  filterFiles,
  filterFolders,
  generateThumbnailUrl,
  supportsThumbnails,
  getPlaceholderThumbnail,
  getAnimationDuration,
  getAnimationEasing,
  createAnimationStyle,
  debounce,
  throttle,
  formatBytesWithProgress,
  areFilesEqual,
  generateFileStats,
} from './file-operations';

// File tree convenience exports
export {
  createFileTree,
  createEnhancedTree,
  expandNode,
  collapseNode,
  toggleNode,
  expandAllNodes,
  collapseAllNodes,
  selectNode,
  deselectAllNodes,
  selectMultipleNodes,
  traverseDepthFirst,
  traverseBreadthFirst,
  findNodes,
  findNode,
  findNodeById,
  findNodesByType,
  findParentNode,
  getNodePath,
  filterTree,
  sortTree,
  defaultSort,
  sortByName,
  sortByDateCreated,
  sortBySize,
  calculateTreeStats,
  getVisibleNodes,
  getSelectedNodes,
  getExpandedNodes,
  getLeafNodes,
  getFolderNodes,
  getFileNodes,
  validateTree,
  canMoveNode,
  getTreeDepth,
  flattenTree,
  buildTreeFromFlat,
} from './file-tree';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  TreeNodeEnhanced,
  TreeTraversalCallback,
  TreeFilterFunction,
  TreeSortFunction,
} from './file-tree';
