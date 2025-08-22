// =============================================================================
// LEGACY DATABASE CONNECTION - DEPRECATED
// =============================================================================
// 🚨 This file is deprecated. Use src/lib/database/connection.ts instead
// This file is kept temporarily for backward compatibility during migration

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../database/schemas';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import 'dotenv/config';

// Support both DATABASE_URL and POSTGRES_URL for backward compatibility
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL or POSTGRES_URL environment variable is required'
  );
}

const client = postgres(connectionString);

export const db = drizzle(client, { schema });

const migrateClient = async () => {
  try {
    console.log('Migrating client...');
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

migrateClient();
