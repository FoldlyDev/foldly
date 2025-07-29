// =============================================================================
// DATABASE CONNECTION - Centralized Database Connection Configuration
// =============================================================================
// 🎯 Single source of truth for database connection setup

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Import all schemas for relation setup
import * as schema from './schemas';

// Create connection string from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL environment variable is required for database connection'
  );
}

// Create postgres client with connection pooling
const client = postgres(connectionString, {
  max: 10, // Maximum number of connections in pool
  idle_timeout: 20, // Seconds before closing idle connections
  connect_timeout: 10, // Seconds to wait for connection
});

// Create drizzle instance with all schemas
export const db = drizzle(client, { schema });

// Export postgres client for direct queries if needed
export { client as postgresClient };

// Export connection status checker
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown helper
export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    await client.end();
    console.log('Database connection closed successfully');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};
