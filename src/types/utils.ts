// TypeScript Utility Types - Advanced TypeScript patterns
// Utility types, discriminated unions, and type guards
// Following 2025 TypeScript best practices with strict type safety

import type { HexColor, EmailAddress } from './ids';

// =============================================================================
// TYPESCRIPT UTILITY TYPES (2025 PATTERNS)
// =============================================================================

export type NonEmptyArray<T> = [T, ...T[]];
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Discriminated unions for better type safety
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Utility type for exact object matching
export type Exact<T, U> = T extends U ? (U extends T ? T : never) : never;

// Validation error type for form and input validation
export type ValidationError = {
  field?: string;
  message: string;
  code?: string;
};

// =============================================================================
// TYPE GUARDS FOR BASIC TYPES
// =============================================================================

export const isValidEmailAddress = (email: unknown): email is EmailAddress => {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidHexColor = (color: unknown): color is HexColor => {
  return typeof color === 'string' && /^#[0-9A-F]{6}$/i.test(color);
};
