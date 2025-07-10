import { defineConfig } from 'drizzle-kit';
import { loadEnvConfig } from '@next/env';

// Load environment variables from .env files
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

export default defineConfig({
  schema: './drizzle/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL || process.env.DATABASE_URL!,
  },

  // Environment-specific settings
  verbose: isProduction,
  strict: isProduction,

  migrations: {
    prefix: isProduction ? 'timestamp' : 'index',
    table: '__drizzle_migrations__',
    schema: 'public',
  },

  // Development conveniences
  ...(isDevelopment && {
    breakpoints: true,
    bundle: false,
  }),

  // Production optimizations
  ...(isProduction && {
    breakpoints: false,
    bundle: true,
  }),
});
