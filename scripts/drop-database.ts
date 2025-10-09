/**
 * Drop Database Script
 *
 * WARNING: This script will DROP ALL TABLES in your database.
 * Use with caution, especially in production environments.
 *
 * Usage: npm run db:drop
 */

// Load environment variables first
import { loadEnvConfig } from '@next/env';
import postgres from 'postgres';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function dropDatabase() {
  console.log('🚨 WARNING: About to drop all database tables...');
  console.log('This action is irreversible!\n');

  // Get connection string from environment
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL or POSTGRES_URL environment variable is required');
    console.error('Make sure you have a .env.local file with your database connection string');
    process.exit(1);
  }

  // Create postgres client
  const client = postgres(connectionString);

  try {
    console.log('Dropping tables in order (respecting foreign keys)...\n');

    // Drop tables in reverse order to respect foreign key constraints
    const tables = [
      'permissions',
      'files',
      'folders',
      'links',
      'workspaces',
      'users',
      '__drizzle_migrations__'
    ];

    for (const table of tables) {
      try {
        await client.unsafe(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`⚠️  Table ${table} might not exist or error:`, error);
      }
    }

    console.log('\n✅ All tables dropped successfully!');
    console.log('\nNext steps:');
    console.log('1. Delete migration files: rm -rf drizzle/0000_*.sql drizzle/meta');
    console.log('2. Generate new migrations: npm run generate');
    console.log('3. Push to database: npm run push');

  } catch (error) {
    console.error('❌ Error dropping tables:', error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

// Run the script
dropDatabase();
