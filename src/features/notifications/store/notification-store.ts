/**
 * Notification Store - Manages notification state across the application
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Notification {
  id: string;
  linkId: string;
  linkTitle: string;
  title: string;
  description?: string;
  metadata?: any;
  isRead: boolean;
  createdAt: Date;
}

interface NotificationState {
  // Unread counts per link
  unreadCounts: Map<string, number>;
  
  // Recent notifications
  recentNotifications: Notification[];
  
  // Total unread count
  totalUnread: number;
  
  // Loading state
  isLoading: boolean;
}

interface NotificationActions {
  // Set unread counts from server
  setUnreadCounts: (counts: Record<string, number>) => void;
  
  // Increment unread count for a link
  incrementUnreadCount: (linkId: string, count?: number) => void;
  
  // Clear notifications for a link
  clearLinkNotifications: (linkId: string) => void;
  
  // Add a new notification
  addRecentNotification: (notification: Notification) => void;
  
  // Mark notification as read
  markAsRead: (notificationId: string) => void;
  
  // Set recent notifications
  setRecentNotifications: (notifications: Notification[]) => void;
  
  // Clear all notifications
  clearAll: () => void;
  
  // Set loading state
  setLoading: (loading: boolean) => void;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      unreadCounts: new Map(),
      recentNotifications: [],
      totalUnread: 0,
      isLoading: false,

      // Actions
      setUnreadCounts: (counts) => {
        const countsMap = new Map(Object.entries(counts));
        const total = Array.from(countsMap.values()).reduce((sum, count) => sum + count, 0);
        
        set({
          unreadCounts: countsMap,
          totalUnread: total,
        });
      },

      incrementUnreadCount: (linkId, count = 1) => {
        set((state) => {
          const newCounts = new Map(state.unreadCounts);
          const currentCount = newCounts.get(linkId) || 0;
          newCounts.set(linkId, currentCount + count);
          
          return {
            unreadCounts: newCounts,
            totalUnread: state.totalUnread + count,
          };
        });
      },

      clearLinkNotifications: (linkId) => {
        set((state) => {
          const newCounts = new Map(state.unreadCounts);
          const linkCount = newCounts.get(linkId) || 0;
          newCounts.delete(linkId);
          
          return {
            unreadCounts: newCounts,
            totalUnread: Math.max(0, state.totalUnread - linkCount),
            recentNotifications: state.recentNotifications.filter(n => n.linkId !== linkId),
          };
        });
      },

      addRecentNotification: (notification) => {
        set((state) => {
          // Add to recent notifications (keep last 10)
          const newRecent = [notification, ...state.recentNotifications].slice(0, 10);
          
          // Increment unread count for the link
          const newCounts = new Map(state.unreadCounts);
          const currentCount = newCounts.get(notification.linkId) || 0;
          newCounts.set(notification.linkId, currentCount + 1);
          
          return {
            recentNotifications: newRecent,
            unreadCounts: newCounts,
            totalUnread: state.totalUnread + 1,
          };
        });
      },

      markAsRead: (notificationId) => {
        set((state) => {
          const notification = state.recentNotifications.find(n => n.id === notificationId);
          if (!notification || notification.isRead) return state;
          
          // Update the notification
          const newRecent = state.recentNotifications.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          );
          
          // Decrement unread count for the link
          const newCounts = new Map(state.unreadCounts);
          const currentCount = newCounts.get(notification.linkId) || 0;
          if (currentCount > 0) {
            newCounts.set(notification.linkId, currentCount - 1);
          }
          
          return {
            recentNotifications: newRecent,
            unreadCounts: newCounts,
            totalUnread: Math.max(0, state.totalUnread - 1),
          };
        });
      },

      setRecentNotifications: (notifications) => {
        set({ recentNotifications: notifications });
      },

      clearAll: () => {
        set({
          unreadCounts: new Map(),
          recentNotifications: [],
          totalUnread: 0,
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'notification-store',
    }
  )
);