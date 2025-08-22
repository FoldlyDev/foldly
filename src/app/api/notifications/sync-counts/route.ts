import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/database/connection';
import { notifications, links } from '@/lib/database/schemas';
import { and, eq, sql } from 'drizzle-orm';

/**
 * Sync notification counts - recalculates the unreadUploads count
 * based on actual unread notifications in the database
 */
export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all user's links
    const userLinks = await db
      .select({ id: links.id })
      .from(links)
      .where(eq(links.userId, session.userId));

    // For each link, count actual unread notifications and update the link
    for (const link of userLinks) {
      // Count unread notifications for this link
      const result = await db
        .select({ 
          count: sql<number>`COUNT(*)::int`
        })
        .from(notifications)
        .where(
          and(
            eq(notifications.linkId, link.id),
            eq(notifications.userId, session.userId),
            eq(notifications.isRead, false)
          )
        );

      const count = result[0]?.count || 0;

      // Update the link's unread count
      await db
        .update(links)
        .set({
          unreadUploads: count,
          updatedAt: new Date(),
        })
        .where(eq(links.id, link.id));
    }

    // Get the updated counts to return
    const updatedCounts = await db
      .select({
        linkId: links.id,
        unreadCount: links.unreadUploads,
      })
      .from(links)
      .where(
        and(
          eq(links.userId, session.userId),
          sql`${links.unreadUploads} > 0`
        )
      );

    const counts: Record<string, number> = {};
    updatedCounts.forEach(row => {
      counts[row.linkId] = row.unreadCount;
    });

    return NextResponse.json({ 
      success: true,
      counts: counts,
      message: 'Notification counts synchronized successfully'
    });
  } catch (error) {
    console.error('Error syncing notification counts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}