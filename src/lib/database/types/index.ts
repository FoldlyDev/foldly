// =============================================================================
// TYPES INDEX - Single Source of Truth for Database Types
// =============================================================================
// 🎯 2025 Best Practice: Modular Type Organization
// Each entity gets its own file for better maintainability and team collaboration

// Start with base types that have no dependencies
export * from './enums';

// Common patterns (depends on enums)
export * from './common';

// API types (depends on other types)
export * from './api';

// Database entities (depend on common and enums)
export * from './users';
export * from './workspaces';
export * from './links';
export * from './folders';
export * from './batches';
export * from './files';
