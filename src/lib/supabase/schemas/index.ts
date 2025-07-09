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
  subscriptionTierEnum,
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
} from './relations';
