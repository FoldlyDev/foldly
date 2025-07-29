// =============================================================================
// DATABASE MIGRATION UTILITIES - Helper functions for database migrations
// =============================================================================
// 🎯 Utilities for managing database schema changes and migrations

import { db, postgresClient } from '../connection';
import { sql } from 'drizzle-orm';

/**
 * Check if a table exists in the database
 */
export const tableExists = async (tableName: string): Promise<boolean> => {
  try {
    const result = await postgresClient`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      )
    `;
    return result[0]?.exists || false;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
};

/**
 * Check if a column exists in a table
 */
export const columnExists = async (
  tableName: string,
  columnName: string
): Promise<boolean> => {
  try {
    const result = await postgresClient`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
        AND column_name = ${columnName}
      )
    `;
    return result[0]?.exists || false;
  } catch (error) {
    console.error(
      `Error checking if column ${columnName} exists in ${tableName}:`,
      error
    );
    return false;
  }
};

/**
 * Check if an index exists
 */
export const indexExists = async (indexName: string): Promise<boolean> => {
  try {
    const result = await postgresClient`
      SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname = ${indexName}
      )
    `;
    return result[0]?.exists || false;
  } catch (error) {
    console.error(`Error checking if index ${indexName} exists:`, error);
    return false;
  }
};

/**
 * Execute raw SQL with error handling
 */
export const executeRawSQL = async (query: string): Promise<void> => {
  try {
    await db.execute(sql.raw(query));
    console.log('SQL executed successfully');
  } catch (error) {
    console.error('Error executing SQL:', error);
    throw error;
  }
};

/**
 * Get current database schema version
 */
export const getCurrentSchemaVersion = async (): Promise<string | null> => {
  try {
    // Check if migrations table exists first
    const migrationsTableExists = await tableExists('__drizzle_migrations');

    if (!migrationsTableExists) {
      return null;
    }

    const result = await postgresClient`
      SELECT hash FROM __drizzle_migrations 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    return result[0]?.hash || null;
  } catch (error) {
    console.error('Error getting schema version:', error);
    return null;
  }
};

/**
 * Backup table data before migration
 */
export const backupTableData = async (tableName: string): Promise<void> => {
  const backupTableName = `${tableName}_backup_${Date.now()}`;

  try {
    await postgresClient`
      CREATE TABLE ${postgresClient(backupTableName)} AS 
      SELECT * FROM ${postgresClient(tableName)}
    `;
    console.log(`Backup created: ${backupTableName}`);
  } catch (error) {
    console.error(`Error creating backup for ${tableName}:`, error);
    throw error;
  }
};

/**
 * Drop backup table
 */
export const dropBackupTable = async (
  backupTableName: string
): Promise<void> => {
  try {
    await postgresClient`DROP TABLE IF EXISTS ${postgresClient(backupTableName)}`;
    console.log(`Backup table dropped: ${backupTableName}`);
  } catch (error) {
    console.error(`Error dropping backup table ${backupTableName}:`, error);
    throw error;
  }
};

/**
 * Get table row count
 */
export const getTableRowCount = async (tableName: string): Promise<number> => {
  try {
    const result = await postgresClient`
      SELECT COUNT(*) as count FROM ${postgresClient(tableName)}
    `;
    return parseInt(result[0]?.count || '0');
  } catch (error) {
    console.error(`Error getting row count for ${tableName}:`, error);
    return 0;
  }
};

/**
 * Migration safety checker
 */
export const runMigrationSafetyChecks = async (): Promise<{
  safe: boolean;
  warnings: string[];
  errors: string[];
}> => {
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // Check database connection
    const isConnected = await postgresClient`SELECT 1`;
    if (!isConnected) {
      errors.push('Cannot connect to database');
    }

    // Check for active connections (warning if too many)
    const activeConnections = await postgresClient`
      SELECT count(*) as count FROM pg_stat_activity 
      WHERE state = 'active' AND pid != pg_backend_pid()
    `;

    const connectionCount = parseInt(activeConnections[0]?.count || '0');
    if (connectionCount > 50) {
      warnings.push(`High number of active connections: ${connectionCount}`);
    }

    // Check disk space (if accessible)
    // This would require additional system queries depending on your setup

    return {
      safe: errors.length === 0,
      warnings,
      errors,
    };
  } catch (error) {
    errors.push(`Safety check failed: ${error}`);
    return { safe: false, warnings, errors };
  }
};
