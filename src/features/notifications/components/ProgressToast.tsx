/**
 * ProgressToast Component
 * Simple toast notification with progress bar
 */

'use client';

import { XIcon, FileUp, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Progress, ProgressTrack } from '@/components/ui/animate-ui/components/progress';
import { cn } from '@/lib/utils/utils';

interface ProgressToastProps {
  toastId?: string | number;
  title: string;
  description?: string | undefined;
  progress: number;
  status?: 'uploading' | 'processing' | 'success' | 'error';
  icon?: LucideIcon;
  iconColor?: string;
  showPercentage?: boolean;
  onCancel?: (() => void) | undefined;
}

export function ProgressToast({
  toastId,
  title,
  description,
  progress,
  status = 'uploading',
  icon: Icon = FileUp,
  iconColor = 'text-blue-500',
  showPercentage = true,
  onCancel,
}: ProgressToastProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-destructive';
      default:
        return iconColor;
    }
  };

  const normalizedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="bg-background text-foreground w-full rounded-lg border border-border px-4 py-3 shadow-lg sm:w-[var(--width)] animate-in slide-in-from-bottom-2">
      <div className="flex gap-3">
        <div className="flex grow gap-3">
          <Icon
            className={cn("mt-0.5 shrink-0", getStatusColor())}
            size={18}
            aria-hidden="true"
          />
          
          <div className="flex grow flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{title}</p>
              {showPercentage && (
                <span className="text-xs text-muted-foreground">
                  {Math.round(normalizedProgress)}%
                </span>
              )}
            </div>
            
            {/* Animated Progress bar */}
            <Progress value={normalizedProgress} className="w-full">
              <ProgressTrack 
                className="h-2 bg-secondary"
                transition={{ type: 'spring', stiffness: 100, damping: 30 }}
              />
            </Progress>
            
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
                {showPercentage && ` • ${Math.round(normalizedProgress)}% complete`}
              </p>
            )}
            
            {/* Cancel button for active operations */}
            {status === 'uploading' && onCancel && (
              <div className="mt-1">
                <button
                  className="text-xs font-medium text-destructive hover:text-destructive/80 hover:underline"
                  onClick={() => {
                    onCancel();
                    if (toastId) toast.dismiss(toastId);
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
        
        {toastId && (
          <button
            className="group -my-1.5 -me-2 size-8 shrink-0 p-0 rounded-md hover:bg-accent transition-colors"
            onClick={() => {
              // For custom toasts, we need to dismiss using the exact toast ID string
              if (typeof toastId === 'string' && toastId.startsWith('progress-')) {
                toast.dismiss(toastId);
              } else {
                toast.dismiss(toastId);
              }
            }}
            aria-label="Dismiss notification"
          >
            <XIcon
              size={16}
              className="opacity-60 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Show or update a progress toast
 * Simply call this with the same ID to update the progress
 */
export function showProgressToast(
  id: string,
  title: string,
  description: string | undefined,
  progress: number,
  status: 'uploading' | 'processing' | 'success' | 'error' = 'uploading',
  onCancel?: () => void
) {
  const toastId = `progress-${id}`;
  
  // If status is success or error, dismiss the toast
  if (status === 'success' || status === 'error') {
    // Use the same ID that was used to create the toast
    toast.dismiss(toastId);
    return toastId;
  }
  
  // Create or update the custom toast
  toast.custom(
    () => (
      <ProgressToast
        toastId={toastId}  // Pass the string ID, not the toast object
        title={title}
        description={description}
        progress={progress}
        status={status}
        onCancel={onCancel}
      />
    ),
    {
      id: toastId,
      duration: Infinity, // Always use Infinity for progress toasts
      position: 'bottom-right',
    }
  );
  
  return toastId;
}