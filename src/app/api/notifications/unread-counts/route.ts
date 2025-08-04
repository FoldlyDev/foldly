import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { notificationService } from '@/lib/services/notifications/notification-service';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await notificationService.getUnreadCounts(session.userId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch unread counts' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}