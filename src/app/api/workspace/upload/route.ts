import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadFileAction } from '@/features/workspace/lib/actions';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout for uploads

export async function POST(req: NextRequest) {
  try {
    console.log('Workspace upload request received');
    
    // Extract client IP for security audit
    const clientIp = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    req.ip || 
                    'unknown';
    
    const { userId } = await auth();
    
    if (!userId) {
      console.error('Upload failed: No authenticated user');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Authenticated user:', userId);

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const workspaceId = formData.get('workspaceId') as string;
    const folderId = formData.get('folderId') as string | null;
    
    console.log('Upload request data:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      workspaceId,
      folderId
    });

    if (!file || !workspaceId) {
      console.error('Upload failed: Missing required fields', {
        hasFile: !!file,
        hasWorkspaceId: !!workspaceId
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          details: {
            hasFile: !!file,
            hasWorkspaceId: !!workspaceId
          }
        },
        { status: 400 }
      );
    }

    // Use the workspace-specific upload action with IP for security
    const result = await uploadFileAction(
      file,
      workspaceId,
      folderId || undefined,
      clientIp
    );

    if (!result.success) {
      console.error('Upload action failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      storageInfo: result.storageInfo,
    });
  } catch (error) {
    console.error('Workspace upload API error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    );
  }
}