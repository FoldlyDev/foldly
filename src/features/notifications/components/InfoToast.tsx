/**
 * InfoToast Component
 * Simple informative toast for success, error, warning, and info messages
 */

'use client';

import { XIcon, CheckCircle, AlertCircle, InfoIcon, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/utils';

export type InfoToastVariant = 'success' | 'error' | 'warning' | 'info';

interface InfoToastProps {
  toastId: string | number;
  title: string;
  description?: string;
  variant?: InfoToastVariant;
  duration?: number;
}

const variantConfig = {
  success: {
    icon: CheckCircle,
    className: 'text-green-500',
    borderClass: 'border-green-500/20',
  },
  error: {
    icon: AlertCircle,
    className: 'text-destructive',
    borderClass: 'border-destructive/20',
  },
  warning: {
    icon: AlertTriangle,
    className: 'text-yellow-500',
    borderClass: 'border-yellow-500/20',
  },
  info: {
    icon: InfoIcon,
    className: 'text-blue-500',
    borderClass: 'border-blue-500/20',
  },
};

export function InfoToast({
  toastId,
  title,
  description,
  variant = 'info',
}: InfoToastProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className={cn(
      "bg-background text-foreground w-full rounded-lg border px-4 py-3 shadow-lg sm:w-[var(--width)] animate-in slide-in-from-bottom-2",
      config.borderClass
    )}>
      <div className="flex gap-3">
        <div className="flex grow gap-3">
          <Icon
            className={cn("mt-0.5 shrink-0", config.className)}
            size={18}
            aria-hidden="true"
          />
          
          <div className="flex grow flex-col gap-1">
            <p className="text-sm font-medium">{title}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        
        <button
          className="group -my-1.5 -me-2 size-8 shrink-0 p-0 rounded-md hover:bg-accent transition-colors"
          onClick={() => toast.dismiss(toastId)}
          aria-label="Dismiss notification"
        >
          <XIcon
            size={16}
            className="opacity-60 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}

/**
 * Helper function to show info toast
 */
export function showInfoToast(
  title: string,
  description?: string,
  variant: InfoToastVariant = 'info',
  duration = 4000
) {
  return toast.custom(
    (t) => (
      <InfoToast
        toastId={t}
        title={title}
        {...(description && { description })}
        variant={variant}
      />
    ),
    {
      duration,
      position: 'bottom-right',
    }
  );
}