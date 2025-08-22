/**
 * Link Upload Handler
 * Handles uploads to shared links
 */

import { BaseUploadHandler } from './base-handler';
import type { 
  UploadHandle, 
  UploadResult, 
  UploadOptions,
  LinkUploadContext 
} from '../types';
import { uploadFileToLinkAction } from '@/features/link-upload/lib/actions/upload-to-link';
import { isLinkContext } from '../types';

interface UploaderInfo {
  name: string;
  email?: string;
  message?: string;
}

export class LinkUploadHandler extends BaseUploadHandler {
  get contextType(): string {
    return 'link';
  }

  async process(
    handle: UploadHandle,
    options: UploadOptions
  ): Promise<UploadResult> {
    if (!isLinkContext(handle.context)) {
      throw new Error('Invalid context for link handler');
    }

    const context = handle.context as LinkUploadContext;
    
    try {
      this.logStart(handle);

      // Build uploader info object with optional properties
      const uploaderInfo = this.buildUploaderInfo(context);
      
      // Use existing server action for link uploads
      const result = await uploadFileToLinkAction(
        handle.file,
        context.linkId,
        uploaderInfo,
        context.folderId,
        context.password
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
   * Build uploader info with optional properties
   */
  private buildUploaderInfo(context: LinkUploadContext): UploaderInfo {
    const info: UploaderInfo = {
      name: context.uploaderName,
    };

    if (context.uploaderEmail) {
      info.email = context.uploaderEmail;
    }
    
    if (context.message) {
      info.message = context.message;
    }

    return info;
  }

  /**
   * Validate link-specific requirements
   */
  async validate(
    file: File,
    context: LinkUploadContext
  ): Promise<{ valid: boolean; error?: string }> {
    // Link-specific validation
    if (!context.uploaderName || context.uploaderName.trim() === '') {
      return {
        valid: false,
        error: 'Uploader name is required',
      };
    }

    // Additional validation is handled by the server action
    return { valid: true };
  }
}