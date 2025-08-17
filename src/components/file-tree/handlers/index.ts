export { createRenameHandler } from './rename';
export { createTreeDropHandler } from './drop';
export { 
  createForeignDropHandlers,
  createFileItemFromDrop,
  getFilesFromDataTransfer,
  type ForeignDropConfig
} from './foreign-drop';

// Re-export types for convenience
export type {
  RenameHandler,
  DropHandler,
  ItemsUpdater,
  TreeHandlerConfig,
  TreeHandlers,
} from '../types/handler-types';