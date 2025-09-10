/**
 * Display types for file and folder components
 * These types extend database types with visual states needed for UI rendering
 */

// We'll import from the actual database schemas when available
// For now, defining the expected structure based on your database schema

/**
 * File display type - combines database fields with visual states
 * Matches the files table structure with added UI states
 */
export interface TreeFileItem {
  // Core database fields
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  extension?: string | null;
  storagePath?: string;
  thumbnailPath?: string | null;
  
  // Processing and status
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  virusScanStatus?: 'pending' | 'scanning' | 'clean' | 'infected' | 'error';
  
  // Metadata
  downloadCount?: number;
  lastAccessedAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  uploadedAt?: Date | string;
  
  // Visual states (managed by tree)
  isSelected?: boolean;
  isRenaming?: boolean;
  isFocused?: boolean;
}

/**
 * Folder display type - combines database fields with visual states
 * Matches the folders table structure with added UI states
 */
export interface TreeFolderItem {
  // Core database fields
  id: string;
  name: string;
  path: string;
  parentFolderId?: string | null;
  depth: number;
  
  // Organization
  isArchived?: boolean;
  sortOrder?: number;
  
  // Statistics
  fileCount?: number;
  totalSize?: number;
  
  // Timestamps
  createdAt?: Date | string;
  updatedAt?: Date | string;
  
  // Visual states (managed by tree)
  isExpanded?: boolean;
  isSelected?: boolean;
  isRenaming?: boolean;
  isFocused?: boolean;
  hasChildren?: boolean;
  
  // Link indicator
  hasGeneratedLink?: boolean;
}

/**
 * Helper type to convert database records to display items
 * This will be used when integrating with actual database queries
 */
export type ToTreeFileItem<T> = Omit<T, keyof TreeFileItem> & TreeFileItem;
export type ToTreeFolderItem<T> = Omit<T, keyof TreeFolderItem> & TreeFolderItem;