import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../drizzle/schema';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import 'dotenv/config';

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL is not set');
}

const client = postgres(process.env.POSTGRES_URL);

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
