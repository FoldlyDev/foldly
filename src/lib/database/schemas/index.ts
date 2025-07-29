// =============================================================================
// SCHEMAS INDEX - Clean Export Interface for All Schema Components
// =============================================================================
// 🎯 2025 Best Practice: Modular Schema Organization for Better Maintainability

// =============================================================================
// ENUMS - PostgreSQL Enums
// =============================================================================
export {
  linkTypeEnum,
  fileProcessingStatusEnum,
  batchStatusEnum,
} from './enums';

// =============================================================================
// TABLES - Database Table Schemas
// =============================================================================
export { users } from './users';
export { workspaces } from './workspaces';
export { links } from './links';
export { folders } from './folders';
export { batches } from './batches';
export { files } from './files';
export { subscriptionAnalytics } from './subscription-analytics';
export {
  subscriptionPlans,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type PlanUIMetadata,
} from './subscription-plans';

// =============================================================================
// RELATIONS - Table Relationship Definitions
// =============================================================================
export {
  usersRelations,
  workspacesRelations,
  linksRelations,
  foldersRelations,
  batchesRelations,
  filesRelations,
  subscriptionAnalyticsRelations,
} from './relations';
