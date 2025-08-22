// =============================================================================
// DATABASE INDEX - Main export interface for database layer
// =============================================================================
// 🎯 Centralized exports for database connection, schemas, and utilities

// Database connection and client
export {
  db,
  postgresClient,
  checkDatabaseConnection,
  closeDatabaseConnection,
} from './connection';

// Database schemas
export * from './schemas';

// Database types
export * from './types';

// Migration utilities
export * from './migrations';
