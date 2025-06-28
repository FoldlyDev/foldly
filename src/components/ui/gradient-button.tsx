import { forwardRef } from 'react';
import { cn } from '@/lib/utils/utils';

interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      children,
      className,
      type = 'button',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      // Base styling
      'relative inline-flex items-center justify-center',
      'font-medium text-sm leading-none',
      'border-0 outline-none',
      'rounded-xl',
      'transition-all duration-300 ease-out',
      'transform hover:scale-[1.02] active:scale-[0.98]',
      'focus-visible:ring-4 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
      // Soft shadow for depth
      'shadow-lg hover:shadow-xl',
      // Gradient overlay for subtle shimmer effect
      'before:absolute before:inset-0 before:rounded-xl',
      'before:bg-gradient-to-r before:from-white/10 before:via-transparent before:to-white/10',
      'before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300',
    ];

    const sizeClasses = {
      sm: 'px-4 py-2 text-sm min-h-[2.25rem]',
      md: 'px-6 py-3 text-base min-h-[2.75rem]',
      lg: 'px-8 py-4 text-lg min-h-[3.25rem]',
    };

    const variantClasses = {
      primary: [
        // Primary gradient (light blue) - inspired by collect card
        'bg-gradient-to-br from-[var(--primary)] via-[var(--primary-light)] to-[var(--primary)]',
        'text-[var(--quaternary)]', // Dark text on light background
        'hover:from-[var(--primary-dark)] hover:via-[var(--primary)] hover:to-[var(--primary-dark)]',
        'focus-visible:ring-[var(--primary)]/50',
        'shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/30',
      ],
      secondary: [
        // Secondary gradient (medium blue) - inspired by organize card
        'bg-gradient-to-br from-[var(--secondary)] via-[var(--secondary-light)] to-[var(--secondary)]',
        'text-[var(--quaternary)]', // Dark text on light background
        'hover:from-[var(--secondary-dark)] hover:via-[var(--secondary)] hover:to-[var(--secondary-dark)]',
        'focus-visible:ring-[var(--secondary)]/50',
        'shadow-[var(--secondary)]/20 hover:shadow-[var(--secondary)]/30',
      ],
      tertiary: [
        // Tertiary gradient (dark blue) - inspired by automate card
        'bg-gradient-to-br from-[var(--tertiary)] via-[var(--tertiary-light)] to-[var(--tertiary)]',
        'text-[var(--primary-subtle)]', // Light text on dark background
        'hover:from-[var(--tertiary-dark)] hover:via-[var(--tertiary)] hover:to-[var(--tertiary-dark)]',
        'focus-visible:ring-[var(--tertiary)]/50',
        'shadow-[var(--tertiary)]/20 hover:shadow-[var(--tertiary)]/30',
      ],
    };

    const buttonClasses = cn(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      className
    );

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses}
        disabled={disabled}
        {...props}
      >
        <span className='relative z-10 flex items-center justify-center gap-2'>
          {children}
        </span>
      </button>
    );
  }
);

GradientButton.displayName = 'GradientButton';

export { GradientButton, type GradientButtonProps };
