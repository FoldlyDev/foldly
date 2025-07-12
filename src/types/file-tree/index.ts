// =============================================================================
// FILE TREE TYPES INDEX - Single entry point for all file tree types
// =============================================================================

// Core tree types
export * from './tree-types';

// Context-specific types
export * from './context-types';

// Re-export commonly used types from supabase
export type {
  DatabaseId,
  File,
  Folder,
  Link,
  UploadFile,
  // Add other commonly used types as needed
} from '@/lib/supabase/types';
