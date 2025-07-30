import { NextRequest, NextResponse } from 'next/server';
import { storageCleanupService } from '@/lib/services/storage/storage-cleanup-service';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for cleanup operations

/**
 * Cron job endpoint for storage cleanup
 * Should be called periodically (e.g., daily) by Vercel Cron or external scheduler
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🧹 Starting scheduled storage cleanup...');
    
    // Run cleanup
    const result = await storageCleanupService.cleanupPartialUploads();
    
    if (result.success) {
      console.log(`✅ Storage cleanup completed: ${result.data!.cleaned} files removed`);
      
      return NextResponse.json({
        success: true,
        cleaned: result.data!.cleaned,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error('❌ Storage cleanup failed:', result.error);
      
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Storage cleanup error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Cleanup failed' 
      },
      { status: 500 }
    );
  }
}