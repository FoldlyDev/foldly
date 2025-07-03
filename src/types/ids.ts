// Infrastructure ID Types - Branded types for type safety
// Core entity identifiers used across all features
// Following 2025 TypeScript best practices with strict type safety

// =============================================================================
// BRANDED ENTITY IDENTIFIERS
// =============================================================================

// Core entity identifiers - used across all features
export type UserId = string & { readonly __brand: 'UserId' };
export type LinkId = string & { readonly __brand: 'LinkId' };
export type FileId = string & { readonly __brand: 'FileId' };
export type FolderId = string & { readonly __brand: 'FolderId' };
export type BatchId = string & { readonly __brand: 'BatchId' };
export type SessionId = string & { readonly __brand: 'SessionId' };

// =============================================================================
// BRANDED DATA TYPES
// =============================================================================

// Basic data types with validation
export type HexColor = `#${string}` & { readonly __brand: 'HexColor' };
export type EmailAddress = `${string}@${string}.${string}` & {
  readonly __brand: 'EmailAddress';
};

// Generic URL types (not business-specific)
export type AbsoluteUrl = (`https://${string}` | `http://${string}`) & {
  readonly __brand: 'AbsoluteUrl';
};
export type RelativeUrl = `/${string}` & { readonly __brand: 'RelativeUrl' };

// Template literal types for generic routes
export type ApiRoute = `/api/${string}`;
export type UserRoute = `/user/${string}`;
export type AdminRoute = `/admin/${string}`;
