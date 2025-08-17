'use client';

import { cn } from '@/lib/utils/utils';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export function Skeleton({
  className,
  children,
  ...props
}: SkeletonProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[var(--light-bg)]/20 dark:bg-[var(--light-bg)]/10 transition-opacity duration-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
