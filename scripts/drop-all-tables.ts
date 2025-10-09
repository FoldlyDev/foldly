/**
 * Drop ALL Tables Script
 *
 * WARNING: This script will DROP ALL TABLES in the public schema.
 * Use with caution!
 *
 * Usage: npm run db:drop-all
 */

// Load environment variables first
import { loadEnvConfig } from '@next/env';
import postgres from 'postgres';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function dropAllTables() {
  console.log('🚨 WARNING: About to drop ALL tables in public schema...');
  console.log('This action is irreversible!\n');

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL or POSTGRES_URL environment variable is required');
    process.exit(1);
  }

  const client = postgres(connectionString);

  try {
    console.log('Fetching all tables from public schema...\n');

    // Get all tables in the public schema
    const tables = await client<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
    `;

    if (tables.length === 0) {
      console.log('✅ No tables found in public schema');
      return;
    }

    console.log(`Found ${tables.length} tables:\n`);
    tables.forEach(t => console.log(`  - ${t.tablename}`));
    console.log('\nDropping all tables...\n');

    // Drop all tables with CASCADE
    for (const { tablename } of tables) {
      try {
        await client.unsafe(`DROP TABLE IF EXISTS "${tablename}" CASCADE`);
        console.log(`✅ Dropped table: ${tablename}`);
      } catch (error: any) {
        console.log(`⚠️  Error dropping ${tablename}:`, error.message);
      }
    }

    console.log('\n✅ All tables dropped successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

dropAllTables();
