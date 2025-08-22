// UI Component Types
// Shared types for UI components across the application
// Following 2025 TypeScript best practices with strict type safety

import type { LucideIcon } from 'lucide-react';

// =============================================================================
// ACTION ITEM TYPES
// =============================================================================

/**
 * Action item interface for menus, dropdowns, and action lists
 * Used across various UI components like CardActionsMenu, dropdown menus, etc.
 */
export interface ActionItem {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly variant?: 'default' | 'destructive' | 'ghost';
  readonly shortcut?: string;
  readonly description?: string;
}

// =============================================================================
// MENU TYPES
// =============================================================================

/**
 * Menu item group for organizing actions
 */
export interface MenuGroup {
  readonly id: string;
  readonly label?: string;
  readonly items: ActionItem[];
  readonly separator?: boolean;
}

/**
 * Menu configuration for complex menus
 */
export interface MenuConfig {
  readonly groups: MenuGroup[];
  readonly size?: 'sm' | 'md' | 'lg';
  readonly align?: 'start' | 'center' | 'end';
  readonly side?: 'top' | 'right' | 'bottom' | 'left';
}

// =============================================================================
// BUTTON TYPES
// =============================================================================

/**
 * Button size variants
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button variant types
 */
export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

// =============================================================================
// FORM TYPES
// =============================================================================

/**
 * Form field state for UI components
 */
export interface FormFieldState {
  readonly value: string;
  readonly error?: string;
  readonly isValid: boolean;
  readonly isLoading?: boolean;
}

/**
 * Select option type
 */
export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
  readonly disabled?: boolean;
}

// =============================================================================
// LAYOUT TYPES
// =============================================================================

/**
 * View modes for content display
 */
export type ViewMode = 'grid' | 'list';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Pagination info
 */
export interface PaginationInfo {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly pageSize: number;
  readonly totalItems: number;
}

// =============================================================================
// ANIMATION TYPES
// =============================================================================

/**
 * Animation variants for motion components
 */
export type AnimationVariant = 'fade' | 'slide' | 'scale' | 'bounce';

/**
 * Animation direction
 */
export type AnimationDirection = 'up' | 'down' | 'left' | 'right';

// =============================================================================
// THEME TYPES
// =============================================================================

/**
 * Theme color variants
 */
export type ThemeColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'success'
  | 'warning'
  | 'error';

/**
 * Size variants
 */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
