import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/database/connection';
import { notifications, links } from '@/lib/database/schemas';
import { and, eq } from 'drizzle-orm';

export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mark all unread notifications as read for the user
    const updated = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.userId, session.userId),
          eq(notifications.isRead, false)
        )
      )
      .returning({ id: notifications.id, linkId: notifications.linkId });

    // Reset unread counts for all affected links
    if (updated.length > 0) {
      // Group by linkId to update each link
      const linkIds = new Set(updated.map(n => n.linkId));
      
      for (const linkId of linkIds) {
        await db
          .update(links)
          .set({
            unreadUploads: 0,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(links.id, linkId),
              eq(links.userId, session.userId)
            )
          );
      }
    }

    return NextResponse.json({ 
      success: true,
      count: updated.length,
      message: `Marked ${updated.length} notifications as read`
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}