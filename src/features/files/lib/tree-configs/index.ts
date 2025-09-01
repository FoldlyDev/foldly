// =============================================================================
// TREE CONFIGURATIONS EXPORT - Central export for all tree configurations
// =============================================================================

// Base configuration types and helpers
export * from './base-config';

// Interactive tree configurations (base and topic links)
export {
  interactiveLinkTreeConfig,
  baseLinkTreeConfig,
  topicLinkTreeConfig,
} from './interactive-tree';

// Read-only tree configurations (generated links and workspace)
export {
  generatedLinkTreeConfig,
  workspaceReadOnlyTreeConfig,
} from './readonly-tree';

// Import for registry
import { 
  baseLinkTreeConfig,
  topicLinkTreeConfig,
  interactiveLinkTreeConfig
} from './interactive-tree';
import {
  generatedLinkTreeConfig,
  workspaceReadOnlyTreeConfig
} from './readonly-tree';

// Configuration registry for easy lookup
export const treeConfigs = {
  // Interactive trees
  'base-link': baseLinkTreeConfig,
  'topic-link': topicLinkTreeConfig,
  'interactive-link': interactiveLinkTreeConfig,
  
  // Read-only trees
  'generated-link': generatedLinkTreeConfig,
  'workspace-readonly': workspaceReadOnlyTreeConfig,
} as const;

export type TreeConfigType = keyof typeof treeConfigs;