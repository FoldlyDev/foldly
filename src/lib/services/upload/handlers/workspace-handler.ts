/**
 * Workspace Upload Handler
 * Handles uploads to user workspaces
 */

import { BaseUploadHandler } from './base-handler';
import type { 
  UploadHandle, 
  UploadResult, 
  UploadOptions,
  WorkspaceUploadContext 
} from '../types';
import { uploadFileAction } from '@/features/workspace/lib/actions/file-actions';
import { isWorkspaceContext } from '../types';

export class WorkspaceUploadHandler extends BaseUploadHandler {
  get contextType(): string {
    return 'workspace';
  }

  async process(
    handle: UploadHandle,
    options: UploadOptions
  ): Promise<UploadResult> {
    if (!isWorkspaceContext(handle.context)) {
      throw new Error('Invalid context for workspace handler');
    }

    const context = handle.context as WorkspaceUploadContext;
    
    try {
      this.logStart(handle);

      // Use existing server action for workspace uploads
      const result = await uploadFileAction(
        handle.file,
        context.workspaceId,
        context.folderId,
        options.clientIp
      );

      if (result.success && result.data) {
        const uploadResult: UploadResult = {
          success: true,
          fileId: result.data,
          fileName: handle.file.name,
          fileSize: handle.file.size,
          storagePath: result.data,
        };
        
        this.logComplete(handle, uploadResult);
        return uploadResult;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      this.logError(handle, error);
      throw error;
    }
  }

  /**
   * Validate workspace-specific requirements
   */
  async validate(
    file: File,
    context: WorkspaceUploadContext
  ): Promise<{ valid: boolean; error?: string }> {
    // Workspace-specific validation can be added here
    // For now, validation is handled by the server action
    return { valid: true };
  }
}