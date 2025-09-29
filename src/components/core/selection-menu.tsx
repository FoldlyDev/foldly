'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/shadcn/button';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface MenuAction {
  key: string;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'ghost' | 'outline' | 'secondary';
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectionMenuProps {
  isVisible: boolean;
  selectedCount: number;
  actions: MenuAction[];
  message?: string;
  className?: string;
  position?: 'bottom-center' | 'bottom-left' | 'bottom-right';
}

// ============================================================================
// Selection Bar Content Component
// ============================================================================

interface SelectionBarContentProps {
  selectedCount: number;
  actions: MenuAction[];
  message?: string | undefined;
  className?: string | undefined;
  toastId: string | number;
}

function SelectionBarContent({
  selectedCount,
  actions,
  message,
  className,
  toastId,
}: SelectionBarContentProps) {
  // Default message if none provided
  const displayMessage = message || `${selectedCount} selected`;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 bg-background rounded-lg border px-4 py-3 shadow-lg min-w-[320px] md:min-w-[400px]',
        className
      )}
    >
      {/* Left Section: Message/Count */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">
          {displayMessage}
        </span>
      </div>

      {/* Center/Right Section: Actions */}
      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action.key}
            variant={action.variant || 'ghost'}
            size="sm"
            onClick={() => {
              action.onClick();
              // Don't auto-dismiss - let parent control visibility
            }}
            disabled={action.disabled}
            className="h-8"
          >
            {action.icon && (
              <span className="mr-1.5">{action.icon}</span>
            )}
            {action.label}
          </Button>
        ))}
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toast.dismiss(toastId)}
          className="h-8 w-8 p-0"
          aria-label="Close selection menu"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Selection Menu Component
// ============================================================================

export function SelectionMenu({
  isVisible,
  selectedCount,
  actions,
  message,
  className,
  position = 'bottom-center',
}: SelectionMenuProps) {
  const toastIdRef = useRef<string | number | null>(null);
  const previousVisibleRef = useRef(isVisible);

  useEffect(() => {
    // Only show toast when transitioning from hidden to visible
    if (isVisible && !previousVisibleRef.current) {
      // Dismiss any existing toast first
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }

      // Show new toast
      toastIdRef.current = toast.custom(
        (t) => (
          <SelectionBarContent
            selectedCount={selectedCount}
            actions={actions}
            message={message}
            className={className}
            toastId={t}
          />
        ),
        {
          duration: Infinity, // Persistent until manually dismissed
          position: position,
          dismissible: false, // Prevent dismissal by clicking outside
          className: 'selection-menu-toast',
          id: 'selection-menu', // Use consistent ID to prevent duplicates
        }
      );
    }
    
    // Dismiss toast when transitioning from visible to hidden
    if (!isVisible && previousVisibleRef.current && toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }

    previousVisibleRef.current = isVisible;
  }, [isVisible]);

  // Update toast content when props change while visible
  useEffect(() => {
    if (isVisible && toastIdRef.current) {
      // Dismiss and recreate to update content
      toast.dismiss(toastIdRef.current);
      
      toastIdRef.current = toast.custom(
        (t) => (
          <SelectionBarContent
            selectedCount={selectedCount}
            actions={actions}
            message={message}
            className={className}
            toastId={t}
          />
        ),
        {
          duration: Infinity,
          position: position,
          dismissible: false,
          className: 'selection-menu-toast',
          id: 'selection-menu',
        }
      );
    }
  }, [selectedCount, actions, message, className, position]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, []);

  return null; // This component doesn't render anything directly
}

// ============================================================================
// Exports
// ============================================================================

export default SelectionMenu;