/**
 * StackedNotifications Component
 * Manages and displays multiple stacked notifications
 */

'use client';

import { useState, useEffect } from 'react';
import { XIcon, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/utils';
import type { InfoToastVariant } from './InfoToast';

export interface StackedNotification {
  id: string;
  title: string;
  description?: string;
  variant: InfoToastVariant;
  timestamp: Date;
  read?: boolean;
}

interface StackedNotificationsProps {
  toastId: string | number;
  notifications: StackedNotification[];
  maxVisible?: number;
  onDismiss?: (id: string) => void;
  onDismissAll?: () => void;
  onMarkAsRead?: (id: string) => void;
}

export function StackedNotifications({
  toastId,
  notifications,
  maxVisible = 3,
  onDismiss,
  onDismissAll,
  onMarkAsRead,
}: StackedNotificationsProps) {
  const [expanded, setExpanded] = useState(false);
  const [localNotifications, setLocalNotifications] = useState(notifications);

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const visibleNotifications = expanded 
    ? localNotifications 
    : localNotifications.slice(0, maxVisible);

  const hiddenCount = localNotifications.length - maxVisible;
  const hasMore = hiddenCount > 0 && !expanded;

  const handleDismiss = (id: string) => {
    setLocalNotifications(prev => prev.filter(n => n.id !== id));
    onDismiss?.(id);
    
    // Dismiss the entire toast if no notifications left
    if (localNotifications.length === 1) {
      toast.dismiss(toastId);
    }
  };

  const handleDismissAll = () => {
    setLocalNotifications([]);
    onDismissAll?.();
    toast.dismiss(toastId);
  };

  const getVariantStyles = (variant: InfoToastVariant) => {
    switch (variant) {
      case 'success':
        return 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20';
      case 'error':
        return 'border-l-destructive bg-destructive/5';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20';
      default:
        return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (localNotifications.length === 0) {
    return null;
  }

  return (
    <div className="bg-background text-foreground w-full rounded-lg border border-border shadow-lg sm:w-[var(--width)] animate-in slide-in-from-bottom-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {localNotifications.length} Notification{localNotifications.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {localNotifications.length > 1 && (
            <button
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={handleDismissAll}
            >
              Clear all
            </button>
          )}
          
          <button
            className="group size-7 p-0 rounded-md hover:bg-accent transition-colors flex items-center justify-center"
            onClick={() => toast.dismiss(toastId)}
            aria-label="Close notifications"
          >
            <XIcon
              size={16}
              className="opacity-60 transition-opacity group-hover:opacity-100"
            />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[320px] overflow-y-auto">
        {visibleNotifications.map((notification, index) => (
          <div
            key={notification.id}
            className={cn(
              "relative px-4 py-3 border-l-4 transition-colors hover:bg-muted/30",
              getVariantStyles(notification.variant),
              index > 0 && "border-t border-border",
              !notification.read && "font-medium"
            )}
            onClick={() => onMarkAsRead?.(notification.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm">{notification.title}</p>
                {notification.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTime(notification.timestamp)}
                </p>
              </div>
              
              <button
                className="group size-6 p-0 rounded-md hover:bg-accent transition-colors flex items-center justify-center shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss(notification.id);
                }}
                aria-label="Dismiss notification"
              >
                <XIcon
                  size={14}
                  className="opacity-60 transition-opacity group-hover:opacity-100"
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Expand/Collapse Footer */}
      {hasMore && (
        <button
          className="w-full px-4 py-2 border-t border-border bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="size-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="size-3" />
              Show {hiddenCount} more
            </>
          )}
        </button>
      )}
    </div>
  );
}

/**
 * Helper function to show stacked notifications
 */
export function showStackedNotifications(
  notifications: StackedNotification[],
  options?: {
    maxVisible?: number;
    onDismiss?: (id: string) => void;
    onDismissAll?: () => void;
    onMarkAsRead?: (id: string) => void;
  }
) {
  return toast.custom(
    (t) => (
      <StackedNotifications
        toastId={t}
        notifications={notifications}
        {...options}
      />
    ),
    {
      duration: Infinity,
      position: 'bottom-right',
    }
  );
}