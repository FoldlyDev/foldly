/**
 * Notification Service - Manages upload notifications for link owners
 */

import { db } from '@/lib/database/connection';
import { notifications, links, users } from '@/lib/database/schemas';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/database/types/common';
import { createClient } from '@supabase/supabase-js';

interface CreateNotificationParams {
  userId: string;
  linkId: string;
  batchId?: string;
  title: string;
  description?: string;
  metadata?: {
    fileCount: number;
    folderCount: number;
    uploaderName: string;
    uploaderEmail?: string;
  };
}

interface NotificationWithLink {
  id: string;
  linkId: string;
  linkTitle: string;
  title: string;
  description: string | null;
  metadata: any;
  isRead: boolean;
  createdAt: Date;
}

export class NotificationService {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Create a new upload notification
   */
  async createUploadNotification(
    params: CreateNotificationParams
  ): Promise<DatabaseResult<{ notificationId: string }>> {
    try {
      // Create the notification record
      const [notification] = await db
        .insert(notifications)
        .values({
          userId: params.userId,
          linkId: params.linkId,
          batchId: params.batchId,
          type: 'upload',
          title: params.title,
          description: params.description,
          metadata: params.metadata,
        })
        .returning({ id: notifications.id });

      if (!notification) {
        return {
          success: false,
          error: 'Failed to create notification',
        };
      }

      // Update the link's unread counter
      await db
        .update(links)
        .set({
          unreadUploads: sql`${links.unreadUploads} + 1`,
          lastNotificationAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(links.id, params.linkId));

      // Broadcast real-time event to the link owner for notifications
      await this.broadcastNotification(params.userId, {
        type: 'new_upload',
        linkId: params.linkId,
        linkTitle: params.title.replace('New upload to ', ''), // Extract link title from notification title
        notificationId: notification.id,
        fileCount: params.metadata?.fileCount || 0,
        folderCount: params.metadata?.folderCount || 0,
        uploaderName: params.metadata?.uploaderName || 'Anonymous',
      });

      // Also broadcast file update event for real-time file list updates
      await this.broadcastFileUpdate(params.userId, params.linkId, {
        type: 'batch_completed',
        linkId: params.linkId,
        batchId: params.batchId,
        userId: params.userId,
      });

      return {
        success: true,
        data: { notificationId: notification.id },
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      return {
        success: false,
        error: 'Failed to create notification',
      };
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<DatabaseResult<void>> {
    try {
      const [notification] = await db
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId)
          )
        )
        .returning({ linkId: notifications.linkId });

      if (notification) {
        // Decrement the link's unread counter
        await db
          .update(links)
          .set({
            unreadUploads: sql`GREATEST(${links.unreadUploads} - 1, 0)`,
            updatedAt: new Date(),
          })
          .where(eq(links.id, notification.linkId));
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: 'Failed to mark notification as read',
      };
    }
  }

  /**
   * Mark all notifications for a link as read
   */
  async markLinkNotificationsAsRead(
    linkId: string,
    userId: string
  ): Promise<DatabaseResult<{ count: number }>> {
    try {
      // Update all unread notifications for this link
      const updatedNotifications = await db
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(
          and(
            eq(notifications.linkId, linkId),
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        )
        .returning({ id: notifications.id });

      const count = updatedNotifications.length;

      if (count > 0) {
        // Reset the link's unread counter
        await db
          .update(links)
          .set({
            unreadUploads: 0,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(links.id, linkId),
              eq(links.userId, userId)
            )
          );
      }

      return {
        success: true,
        data: { count },
      };
    } catch (error) {
      console.error('Error marking link notifications as read:', error);
      return {
        success: false,
        error: 'Failed to mark notifications as read',
      };
    }
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(
    userId: string,
    limit: number = 10
  ): Promise<DatabaseResult<NotificationWithLink[]>> {
    try {
      const results = await db
        .select({
          id: notifications.id,
          linkId: notifications.linkId,
          linkTitle: links.title,
          title: notifications.title,
          description: notifications.description,
          metadata: notifications.metadata,
          isRead: notifications.isRead,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .innerJoin(links, eq(notifications.linkId, links.id))
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        )
        .orderBy(desc(notifications.createdAt))
        .limit(limit);

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      return {
        success: false,
        error: 'Failed to fetch notifications',
      };
    }
  }

  /**
   * Get unread counts for user's links
   */
  async getUnreadCounts(
    userId: string
  ): Promise<DatabaseResult<Record<string, number>>> {
    try {
      const results = await db
        .select({
          linkId: links.id,
          unreadCount: links.unreadUploads,
        })
        .from(links)
        .where(
          and(
            eq(links.userId, userId),
            sql`${links.unreadUploads} > 0`
          )
        );

      const counts: Record<string, number> = {};
      results.forEach(row => {
        counts[row.linkId] = row.unreadCount;
      });

      return {
        success: true,
        data: counts,
      };
    } catch (error) {
      console.error('Error fetching unread counts:', error);
      return {
        success: false,
        error: 'Failed to fetch unread counts',
      };
    }
  }

  /**
   * Broadcast notification via Supabase Realtime
   */
  private async broadcastNotification(userId: string, payload: any) {
    try {
      const channel = this.supabase.channel(`notifications:${userId}`);
      await channel.send({
        type: 'broadcast',
        event: 'notification',
        payload,
      });
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      // Non-critical error, don't fail the operation
    }
  }

  /**
   * Broadcast file update event for real-time file list updates
   */
  private async broadcastFileUpdate(userId: string, linkId: string, payload: any) {
    try {
      // Broadcast to link-specific channel
      const linkChannel = this.supabase.channel(`files:link:${linkId}`);
      await linkChannel.send({
        type: 'broadcast',
        event: 'file_update',
        payload,
      });

      // Also broadcast to user's workspace channel
      const userChannel = this.supabase.channel(`files:user:${userId}`);
      await userChannel.send({
        type: 'broadcast',
        event: 'file_update',
        payload,
      });
    } catch (error) {
      console.error('Error broadcasting file update:', error);
      // Non-critical error, don't fail the operation
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();