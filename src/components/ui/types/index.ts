// UI Component Types - Types Only (Following 2025 separation of concerns)
// Following TypeScript best practices with strict type safety

import type { ReactNode } from 'react';
import type { HexColor } from '../../../types/ids';

// =============================================================================
// UI COMPONENT TYPE EXPORTS (Explicit, following ADR004)
// =============================================================================

// Core component prop types
export type { ActionItem, CardActionsMenuProps } from '../card-actions-menu';
export type { ActionButtonProps } from '../action-button';
export type { StatusBadgeProps } from '../status-badge';
export type { CopyButtonProps } from '../copy-button';
export type { BulkActionsBarProps } from '../bulk-actions-bar';
export type { ConfigurableModalProps } from '../configurable-modal';
export type { ContentLoaderProps } from '../content-loader';
export type { FilterSystemProps } from '../filter-system';
export type { FlipCardProps } from '../flip-card';
export type { GradientButtonProps } from '../gradient-button';
export type { SearchInputProps } from '../search-input';
export type { TemplatesModalProps } from '../templates-modal';
export type { ViewToggleProps } from '../view-toggle';
export type { FileUploadProps } from '../file-upload';

// =============================================================================
// UI INFRASTRUCTURE TYPES
// =============================================================================

export type ComponentId = string & { readonly __brand: 'ComponentId' };
export type ModalId = string & { readonly __brand: 'ModalId' };
export type NotificationId = string & { readonly __brand: 'NotificationId' };
export type FormFieldName = string & { readonly __brand: 'FormFieldName' };
export type ValidationError = string & { readonly __brand: 'ValidationError' };

// =============================================================================
// COMPONENT CONFIGURATION CONSTANTS
// =============================================================================

export const COMPONENT_SIZE = {
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
} as const satisfies Record<string, string>;

export type ComponentSize =
  (typeof COMPONENT_SIZE)[keyof typeof COMPONENT_SIZE];

export const COMPONENT_VARIANT = {
  DEFAULT: 'default',
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  DESTRUCTIVE: 'destructive',
  OUTLINE: 'outline',
  GHOST: 'ghost',
} as const satisfies Record<string, string>;

export type ComponentVariant =
  (typeof COMPONENT_VARIANT)[keyof typeof COMPONENT_VARIANT];

// =============================================================================
// UI UTILITY TYPES
// =============================================================================

export interface BaseUIProps {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly 'data-testid'?: string;
}

export interface InteractiveUIProps extends BaseUIProps {
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly onClick?: () => void;
}
