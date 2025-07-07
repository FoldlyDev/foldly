// UI Components Barrel Export - Components Only
// Following 2025 feature-based architecture principles and Backstage ADR004

// =============================================================================
// CORE UI COMPONENTS (Explicit exports following ADR004)
// =============================================================================

export { ActionButton } from './action-button';
export { AnimatedCopyButton } from './animated-copy-button';
export { StatusBadge } from './status-badge';
export { CopyButton } from './copy-button';
export { CardActionsMenu, defaultActions } from './card-actions-menu';
export { BulkActionsBar } from './bulk-actions-bar';
export { ConfigurableModal } from './configurable-modal';
export { ContentLoader } from './content-loader';
export { FilterSystem } from './filter-system';
export { FlipCard } from './flip-card';
export { GradientButton } from './gradient-button';
export {
  MotionDiv,
  MotionP,
  AnimatePresenceWrapper,
  AnimatedContainer,
  StaggerItem,
} from './motion-wrappers';
export { SearchInput } from './search-input';
export { TemplatesModal } from './templates-modal';
export { ViewToggle } from './view-toggle';
export { FileUpload } from './file-upload';
export { SearchHighlight } from './search-highlight';

// =============================================================================
// SHADCN UI COMPONENTS (Barrel re-export following ADR004)
// =============================================================================

// Re-export from shadcn index (follows ADR004 pattern)
export * from './shadcn';

// New components
export { HelpPopover } from './help-popover';
export { AnimatedSelect } from './animated-select';
