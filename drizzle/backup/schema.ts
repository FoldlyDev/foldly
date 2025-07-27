// =============================================================================
// DRIZZLE SCHEMA - Main Schema Export for Database Migrations
// =============================================================================
// 🎯 Direct imports for Drizzle Kit compatibility (avoids path resolution issues)

// Import all schemas and relations directly with explicit imports
// ENUMS
export {
  linkTypeEnum,
  fileProcessingStatusEnum,
  batchStatusEnum,
  subscriptionTierEnum,
} from '../src/lib/database/schemas/enums';

// TABLES
export { users } from '../src/lib/database/schemas/users';
export { workspaces } from '../src/lib/database/schemas/workspaces';
export { links } from '../src/lib/database/schemas/links';
export { folders } from '../src/lib/database/schemas/folders';
export { batches } from '../src/lib/database/schemas/batches';
export { files } from '../src/lib/database/schemas/files';
export { subscriptionTiers, defaultSubscriptionTiers } from '../src/lib/database/schemas/subscription-tiers';
export { userSubscriptions, subscriptionEvents } from '../src/lib/database/schemas/user-subscriptions';

// RELATIONS
export {
  usersRelations,
  workspacesRelations,
  linksRelations,
  foldersRelations,
  batchesRelations,
  filesRelations,
} from '../src/lib/database/schemas/relations';
