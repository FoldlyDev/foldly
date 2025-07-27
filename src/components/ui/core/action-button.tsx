'use client';

import * as React from 'react';
import { motion, type HTMLMotionProps, type Transition } from 'framer-motion';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/utils';

const actionButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--primary)] text-[var(--quaternary)] shadow-sm hover:bg-[var(--primary-dark)]',
        destructive: 'bg-red-500 text-white shadow-sm hover:bg-red-600',
        outline:
          'border border-[var(--neutral-200)] bg-white shadow-sm hover:bg-[var(--neutral-50)] text-[var(--neutral-600)]',
        secondary:
          'bg-[var(--secondary)] text-[var(--quaternary)] shadow-sm hover:bg-[var(--secondary-dark)]',
        ghost: 'hover:bg-[var(--neutral-100)] text-[var(--neutral-600)]',
        link: 'text-[var(--primary)] underline-offset-4 hover:underline',
        success:
          'bg-[var(--success-green)] text-white shadow-sm hover:bg-green-600',
        warning:
          'bg-[var(--warning-amber)] text-white shadow-sm hover:bg-amber-600',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-6',
        icon: 'h-9 w-9',
      },
      motionType: {
        scale: '',
        lift: '',
        subtle: '',
        none: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      motionType: 'scale',
    },
  }
);

interface ActionButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>,
    VariantProps<typeof actionButtonVariants> {
  asChild?: boolean;
  children: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
}

const motionConfigs = {
  scale: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 30,
    } as Transition,
  },
  lift: {
    whileHover: { y: -2, scale: 1.01 },
    whileTap: { y: 0, scale: 1 },
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25,
    } as Transition,
  },
  subtle: {
    whileHover: { scale: 1.01 },
    whileTap: { scale: 0.99 },
    transition: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 35,
    } as Transition,
  },
  none: {},
};

export function ActionButton({
  className,
  variant,
  size,
  motionType = 'scale',
  asChild = false,
  children,
  loading = false,
  loadingText = 'Loading...',
  disabled,
  ...props
}: ActionButtonProps) {
  const motionConfig = motionConfigs[motionType || 'scale'];

  const buttonContent = loading ? (
    <>
      <div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin' />
      {loadingText}
    </>
  ) : (
    children
  );

  if (asChild) {
    return (
      <Slot
        className={cn(actionButtonVariants({ variant, size }), className)}
        {...(props as any)}
      >
        {buttonContent}
      </Slot>
    );
  }

  return (
    <motion.button
      className={cn(actionButtonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...motionConfig}
      {...props}
    >
      {buttonContent}
    </motion.button>
  );
}

export { actionButtonVariants };
export type { ActionButtonProps };
