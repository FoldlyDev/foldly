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
        'animate-pulse rounded-md bg-muted/60 dark:bg-white/5 transition-opacity duration-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
