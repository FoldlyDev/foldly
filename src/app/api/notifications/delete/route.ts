import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/database/connection';
import { notifications, links } from '@/lib/database/schemas';
import { and, eq, sql } from 'drizzle-orm';

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // First, get the notification to check if it's unread and get the linkId
    const [notification] = await db
      .select({
        id: notifications.id,
        linkId: notifications.linkId,
        isRead: notifications.isRead,
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, session.userId)
        )
      )
      .limit(1);

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the notification
    await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId));

    // If the notification was unread, decrement the unread count in the links table
    if (!notification.isRead) {
      await db
        .update(links)
        .set({
          unreadUploads: sql`GREATEST(0, ${links.unreadUploads} - 1)`,
          updatedAt: new Date(),
        })
        .where(eq(links.id, notification.linkId));
    }

    return NextResponse.json({ 
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}