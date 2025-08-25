/**
 * InteractiveToast Component
 * Toast notification with action buttons and interactivity
 */

'use client';

import { XIcon, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/utils';

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: LucideIcon;
}

interface InteractiveToastProps {
  toastId: string | number;
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  actions?: ToastAction[];
  onDismiss?: () => void;
}

export function InteractiveToast({
  toastId,
  title,
  description,
  icon: Icon,
  iconColor = 'text-blue-500',
  actions = [],
  onDismiss,
}: InteractiveToastProps) {
  const handleDismiss = () => {
    onDismiss?.();
    toast.dismiss(toastId);
  };

  const getActionStyles = (variant: ToastAction['variant'] = 'primary') => {
    switch (variant) {
      case 'primary':
        return 'text-primary hover:underline';
      case 'secondary':
        return 'text-muted-foreground hover:text-foreground hover:underline';
      case 'danger':
        return 'text-destructive hover:text-destructive/80 hover:underline';
      default:
        return 'text-primary hover:underline';
    }
  };

  return (
    <div className="bg-background text-foreground w-full rounded-lg border border-border px-4 py-3 shadow-lg sm:w-[var(--width)] animate-in slide-in-from-bottom-2">
      <div className="flex gap-3">
        <div className="flex grow gap-3">
          {Icon && (
            <Icon
              className={cn("mt-0.5 shrink-0", iconColor)}
              size={18}
              aria-hidden="true"
            />
          )}
          
          <div className="flex grow flex-col gap-1">
            <p className="text-sm font-medium">{title}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            
            {actions.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                {actions.map((action, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {index > 0 && (
                      <span className="text-xs text-muted-foreground">·</span>
                    )}
                    <button
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium",
                        getActionStyles(action.variant)
                      )}
                      onClick={() => {
                        action.onClick();
                        if (action.variant !== 'secondary') {
                          handleDismiss();
                        }
                      }}
                    >
                      {action.label}
                      {action.icon && <action.icon className="size-3" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <button
          className="group -my-1.5 -me-2 size-8 shrink-0 p-0 rounded-md hover:bg-accent transition-colors"
          onClick={handleDismiss}
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
 * Helper function to show interactive toast
 */
export function showInteractiveToast({
  title,
  description,
  icon,
  iconColor,
  actions,
  duration = Infinity,
  onDismiss,
}: Omit<InteractiveToastProps, 'toastId'> & { duration?: number }) {
  return toast.custom(
    (t) => (
      <InteractiveToast
        toastId={t}
        title={title}
        {...(description && { description })}
        {...(icon && { icon })}
        {...(iconColor && { iconColor })}
        {...(actions && { actions })}
        {...(onDismiss && { onDismiss })}
      />
    ),
    {
      duration,
      position: 'bottom-right',
    }
  );
}