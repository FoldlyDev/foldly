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
    // Use non-pooling URL for Drizzle Kit operations to avoid pooler SSL issues
    url:
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL!,
    // Dynamic SSL configuration based on environment
    ssl: isProduction
      ? 'require' // ✅ Secure SSL validation for production
      : { rejectUnauthorized: false }, // ✅ Allow self-signed certs for development
  },

  // Environment-specific settings
  verbose: isDevelopment, // Enable verbose logging in development for debugging
  strict: isProduction,

  migrations: {
    prefix: isProduction ? 'timestamp' : 'index',
    table: '__drizzle_migrations__',
    schema: 'public',
  },

  // Development conveniences with better connection handling
  ...(isDevelopment && {
    breakpoints: true,
    bundle: false,
  }),

  // Production optimizations
  ...(isProduction && {
    breakpoints: false,
    bundle: true,
  }),

  // Add introspection options for better schema pulling performance
  introspect: {
    casing: 'preserve',
  },

  // Add schema filter to improve performance (optional)
  schemaFilter: ['public'],
});
