'use client';

import * as React from 'react';
import { motion, type Variants, type Transition } from 'motion/react';
import type { LucideIcon } from 'lucide-react';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type ActionVariant = 'neutral' | 'danger' | 'success' | 'warning' | 'info';

export interface ManagementBarAction {
  id: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: ActionVariant;
  disabled?: boolean;
  'aria-label'?: string;
}

export interface ManagementBarPrimaryAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  sublabel?: string;
  shortcut?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export interface ManagementBarProps {
  // Actions (expandable buttons)
  actions?: ManagementBarAction[];

  // Primary action (right side button)
  primaryAction?: ManagementBarPrimaryAction;

  // Pagination (optional)
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };

  // Layout
  className?: string;
}

// =============================================================================
// ANIMATION CONFIGS
// =============================================================================

const BUTTON_MOTION_CONFIG = {
  initial: 'rest',
  whileHover: 'hover',
  whileTap: 'tap',
  variants: {
    rest: { maxWidth: '40px' },
    hover: {
      maxWidth: '140px',
      transition: { type: 'spring', stiffness: 200, damping: 35, delay: 0.15 },
    },
    tap: { scale: 0.95 },
  },
  transition: { type: 'spring', stiffness: 250, damping: 25 },
} as const;

const LABEL_VARIANTS: Variants = {
  rest: { opacity: 0, x: 4 },
  hover: { opacity: 1, x: 0, visibility: 'visible' },
  tap: { opacity: 1, x: 0, visibility: 'visible' },
};

const LABEL_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
};

// =============================================================================
// VARIANT STYLES
// =============================================================================

const ACTION_VARIANT_STYLES: Record<ActionVariant, string> = {
  neutral: 'bg-neutral-200/60 dark:bg-neutral-600/80 text-neutral-600 dark:text-neutral-200',
  danger: 'bg-red-200/60 dark:bg-red-800/80 text-red-600 dark:text-red-300',
  success: 'bg-green-200/60 dark:bg-green-800/80 text-green-600 dark:text-green-300',
  warning: 'bg-amber-200/60 dark:bg-amber-800/80 text-amber-600 dark:text-amber-300',
  info: 'bg-blue-200/60 dark:bg-blue-800/80 text-blue-600 dark:text-blue-300',
};

const PRIMARY_ACTION_VARIANT_STYLES = {
  primary: 'bg-teal-500 dark:bg-teal-600/80 hover:bg-teal-600 dark:hover:bg-teal-800 text-white',
  secondary: 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200',
} as const;

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface ActionButtonProps {
  action: ManagementBarAction;
}

function ActionButton({ action }: ActionButtonProps) {
  const Icon = action.icon;
  const variant = action.variant || 'neutral';
  const variantStyles = ACTION_VARIANT_STYLES[variant];

  return (
    <motion.button
      {...BUTTON_MOTION_CONFIG}
      onClick={action.onClick}
      disabled={action.disabled}
      className={`flex h-10 items-center space-x-2 overflow-hidden whitespace-nowrap rounded-lg px-2.5 py-2 ${variantStyles} disabled:opacity-50 disabled:cursor-not-allowed`}
      aria-label={action['aria-label'] || action.label}
    >
      <Icon size={20} className="shrink-0" />
      <motion.span
        variants={LABEL_VARIANTS}
        transition={LABEL_TRANSITION}
        className="invisible text-sm"
      >
        {action.label}
      </motion.span>
    </motion.button>
  );
}

interface PrimaryActionButtonProps {
  action: ManagementBarPrimaryAction;
}

function PrimaryActionButton({ action }: PrimaryActionButtonProps) {
  const variant = action.variant || 'primary';
  const variantStyles = PRIMARY_ACTION_VARIANT_STYLES[variant];
  const Icon = action.icon;

  return (
    <motion.button
      whileTap={{ scale: 0.975 }}
      onClick={action.onClick}
      disabled={action.disabled}
      className={`flex h-10 text-sm cursor-pointer items-center justify-center rounded-lg px-3 py-2 transition-colors duration-300 w-full @xl/wrapper:w-auto disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles}`}
    >
      {Icon && <Icon size={18} className="mr-2" />}
      {action.sublabel && (
        <span className="mr-1 text-current opacity-80">{action.sublabel}</span>
      )}
      <span>{action.label}</span>

      {action.shortcut && (
        <>
          <div className="mx-3 h-5 w-px bg-current opacity-40 rounded-full" />
          <div className="flex items-center gap-1 rounded-md bg-white/20 px-1.5 py-0.5 -mr-1 text-xs">
            {action.shortcut}
          </div>
        </>
      )}
    </motion.button>
  );
}

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationControlsProps) {
  // We'll use SlidingNumber when we implement it
  const handlePrevPage = React.useCallback(() => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  }, [currentPage, onPageChange]);

  const handleNextPage = React.useCallback(() => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  }, [currentPage, totalPages, onPageChange]);

  return (
    <div className="flex h-10">
      <button
        disabled={currentPage === 1}
        className="p-1 text-muted-foreground transition-colors hover:text-foreground disabled:text-muted-foreground/30 disabled:hover:text-muted-foreground/30"
        onClick={handlePrevPage}
        aria-label="Previous page"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <div className="mx-2 flex items-center space-x-1 text-sm tabular-nums">
        <span className="text-foreground">{currentPage}</span>
        <span className="text-muted-foreground">/ {totalPages}</span>
      </div>
      <button
        disabled={currentPage === totalPages}
        className="p-1 text-muted-foreground transition-colors hover:text-foreground disabled:text-muted-foreground/30 disabled:hover:text-muted-foreground/30"
        onClick={handleNextPage}
        aria-label="Next page"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ManagementBar({
  actions = [],
  primaryAction,
  pagination,
  className = '',
}: ManagementBarProps) {
  const hasActions = actions.length > 0;
  const hasPagination = !!pagination;
  const hasPrimaryAction = !!primaryAction;

  // Don't render if no content
  if (!hasActions && !hasPagination && !hasPrimaryAction) {
    return null;
  }

  return (
    <div className={`@container/wrapper w-full flex justify-center ${className}`}>
      <div className="flex w-fit flex-col @xl/wrapper:flex-row items-center gap-y-2 rounded-2xl border border-border bg-background p-2 shadow-lg">
        {/* Left Section: Pagination + Actions */}
        {(hasPagination || hasActions) && (
          <div className="mx-auto flex flex-col @lg/wrapper:flex-row shrink-0 items-center">
            {/* Pagination */}
            {hasPagination && (
              <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.onPageChange}
              />
            )}

            {/* Separator */}
            {hasPagination && hasActions && (
              <div className="mx-3 h-6 w-px bg-border rounded-full hidden @lg/wrapper:block" />
            )}

            {/* Actions */}
            {hasActions && (
              <motion.div
                layout
                layoutRoot
                className="mx-auto flex flex-wrap gap-2 sm:flex-nowrap"
              >
                {actions.map((action) => (
                  <ActionButton key={action.id} action={action} />
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* Separator before primary action */}
        {(hasPagination || hasActions) && hasPrimaryAction && (
          <div className="mx-3 hidden h-6 w-px bg-border @xl/wrapper:block rounded-full" />
        )}

        {/* Right Section: Primary Action */}
        {hasPrimaryAction && <PrimaryActionButton action={primaryAction} />}
      </div>
    </div>
  );
}
