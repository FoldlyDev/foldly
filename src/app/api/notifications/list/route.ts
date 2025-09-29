import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/database/connection';
import { notifications, links } from '@/lib/database/schemas';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all notifications for the user with link details
    const userNotifications = await db
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
      .where(eq(notifications.userId, session.userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50); // Limit to recent 50 notifications

    return NextResponse.json({
      success: true,
      notifications: userNotifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}