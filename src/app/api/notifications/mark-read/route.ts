import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { notificationService } from '@/lib/services/notifications/notification-service';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { linkId, notificationId } = body;

    if (linkId) {
      // Mark all notifications for a specific link as read
      const result = await notificationService.markLinkNotificationsAsRead(
        linkId,
        session.userId
      );
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to mark notifications as read' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        count: result.data?.count || 0 
      });
    } else if (notificationId) {
      // Mark a specific notification as read
      const result = await notificationService.markAsRead(
        notificationId,
        session.userId
      );
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to mark notification as read' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Either linkId or notificationId is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}