import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/database/connection';
import { notifications } from '@/lib/database/schemas';
import { and, eq } from 'drizzle-orm';

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

    // Delete the notification (only if it belongs to the user)
    const deleted = await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, session.userId)
        )
      )
      .returning({ id: notifications.id });

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found or unauthorized' },
        { status: 404 }
      );
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