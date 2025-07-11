// =============================================================================
// LINKS FEATURE - CLIENT-SAFE SERVICE LAYER EXPORTS
// =============================================================================

// 🚫 DATABASE SERVICE NOT EXPORTED - Import directly in server components/actions
// Server-only: './db-service' - Use direct import in server components

// 🚫 API SERVICE - Not implemented yet
// TODO: './api' - External API integrations (when implemented)

// 🚫 SERVER ACTIONS NOT EXPORTED - Import directly in server components
// Server-only: './actions' - Use direct import in server components (when implemented)

// 🛠️ Utilities - Helper Functions (Client-Safe)
export * from './utils';

// 📊 Constants - Configuration & Enums (Client-Safe)
export * from './constants';

// 📝 Note: For server-only modules, import directly:
// import { LinksDbService } from '@/features/links/lib/db-service';
// import { createLink, updateLink } from '@/features/links/lib/actions';
