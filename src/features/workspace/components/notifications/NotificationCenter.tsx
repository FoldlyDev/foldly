/**
 * Notification Center - Shows list of notifications with manage capabilities
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  FileUp, 
  FolderUp, 
  Trash2, 
  CheckCircle,
  Circle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/core/shadcn';
import { ScrollArea } from '@/components/ui/core/shadcn/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationStore } from '@/features/notifications/store/notification-store';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface NotificationItemProps {
  notification: {
    id: string;
    linkId: string;
    linkTitle: string;
    title: string;
    description: string | null;
    metadata?: {
      fileCount?: number;
      folderCount?: number;
      uploaderName?: string;
    };
    isRead: boolean;
    createdAt: Date;
  };
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: NotificationItemProps) {
  const router = useRouter();
  const { metadata } = notification;
  const hasFiles = metadata?.fileCount && metadata.fileCount > 0;
  
  // Format description if it shows "0 files and 1 folders"
  const formatDescription = (desc: string | null) => {
    if (!desc) return null;
    
    // Fix "0 files and X folders" to just "X folders"
    if (desc.includes('0 files and')) {
      return desc.replace('0 files and ', '');
    }
    // Fix "X files and 0 folders" to just "X files"
    if (desc.includes('and 0 folders')) {
      return desc.replace(' and 0 folders', '');
    }
    
    return desc;
  };
  
  const handleViewUploads = () => {
    // Navigate to files page with the specific link highlighted
    router.push(`/dashboard/files?linkId=${notification.linkId}&highlight=true`);
    // Mark as read when viewing
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "relative p-4 border-b border-border/50 hover:bg-accent/50 transition-colors group cursor-pointer",
        !notification.isRead && "bg-primary/5"
      )}
      onClick={handleViewUploads}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {hasFiles ? (
            <FileUp className="w-4 h-4 text-primary dark:text-primary" />
          ) : (
            <FolderUp className="w-4 h-4 text-secondary dark:text-secondary" />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={cn(
                "text-sm",
                !notification.isRead && "font-semibold"
              )}>
                {notification.title}
              </p>
              {formatDescription(notification.description) && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDescription(notification.description)}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
              </div>
              
              {/* View uploads link */}
              <button
                className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary dark:text-primary hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewUploads();
                }}
              >
                View uploads
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.isRead && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                  title="Mark as read"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                title="Delete notification"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Unread indicator */}
        {!notification.isRead && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary dark:bg-primary rounded-r" />
        )}
      </div>
    </motion.div>
  );
}

export function NotificationCenter({ 
  isOpen, 
  onClose, 
  className 
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { deleteNotification, markAsRead: markAsReadInStore, refreshUnreadCounts } = useNotificationStore();
  
  // Fetch notifications when opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);
  
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/list');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        
        // Mark all unread notifications as read
        const unreadNotifications = data.notifications?.filter((n: any) => !n.isRead) || [];
        if (unreadNotifications.length > 0) {
          // Mark all as read in the UI immediately
          setNotifications(prev => 
            prev.map(n => ({ ...n, isRead: true }))
          );
          
          // Send request to mark all as read
          await fetch('/api/notifications/mark-all-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          
          // Refresh unread counts to update badges
          await refreshUnreadCounts();
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        // Update the global store
        markAsReadInStore(notificationId);
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };
  
  const handleDelete = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        // Update the global store to update the bell icon count
        deleteNotification(notificationId);
        // Refresh counts from server to ensure accuracy
        await refreshUnreadCounts();
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        );
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Notification Panel */}
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.3 }}
            className={cn(
              "fixed right-4 top-20 w-96 max-w-[calc(100vw-2rem)] bg-background rounded-lg border shadow-xl z-50",
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 dark:bg-primary/10 text-primary dark:text-primary rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all as read
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Notifications List */}
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Bell className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}