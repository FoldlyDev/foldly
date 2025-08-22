import { 
  CloudTransferRequest, 
  CloudTransferProgress, 
  Result, 
  CloudProvider,
  GoogleDriveProvider,
  OneDriveProvider 
} from '@/lib/services/cloud-storage';

export class CloudTransferManager {
  private sourceProvider: GoogleDriveProvider | OneDriveProvider;
  private targetProvider: GoogleDriveProvider | OneDriveProvider;
  private progress: CloudTransferProgress;
  private onProgressUpdate?: (progress: CloudTransferProgress) => void;

  constructor(
    sourceToken: string,
    targetToken: string,
    sourceType: CloudProvider['id'],
    targetType: CloudProvider['id']
  ) {
    this.sourceProvider = this.createProvider(sourceType, sourceToken);
    this.targetProvider = this.createProvider(targetType, targetToken);
    this.progress = {
      id: crypto.randomUUID(),
      status: 'pending',
      progress: 0,
      totalFiles: 0,
      completedFiles: 0,
    };
  }

  private createProvider(type: CloudProvider['id'], token: string) {
    switch (type) {
      case 'google-drive':
        return new GoogleDriveProvider(token);
      case 'onedrive':
        return new OneDriveProvider(token);
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  setProgressCallback(callback: (progress: CloudTransferProgress) => void) {
    this.onProgressUpdate = callback;
  }

  async transfer(request: CloudTransferRequest): Promise<Result<void>> {
    try {
      this.progress = {
        ...this.progress,
        status: 'pending',
        totalFiles: request.fileIds.length,
        completedFiles: 0,
      };
      this.updateProgress();

      for (let i = 0; i < request.fileIds.length; i++) {
        const fileId = request.fileIds[i];
        
        // Get file info
        const fileResult = await this.sourceProvider.getFile(fileId);
        if (!fileResult.success) {
          this.progress.status = 'failed';
          this.progress.error = fileResult.error.message;
          this.updateProgress();
          return fileResult;
        }

        const file = fileResult.data;
        this.progress.currentFile = file.name;
        this.progress.status = 'downloading';
        this.updateProgress();

        // Skip folders - handle them separately if needed
        if (file.isFolder) {
          this.progress.completedFiles++;
          this.progress.progress = (this.progress.completedFiles / this.progress.totalFiles) * 100;
          this.updateProgress();
          continue;
        }

        // Download file
        const downloadResult = await this.sourceProvider.downloadFile(fileId);
        if (!downloadResult.success) {
          this.progress.status = 'failed';
          this.progress.error = downloadResult.error.message;
          this.updateProgress();
          return downloadResult;
        }

        // Convert blob to File
        const blob = downloadResult.data;
        const uploadFile = new File([blob], file.name, { type: file.mimeType });

        // Upload to target
        this.progress.status = 'uploading';
        this.updateProgress();

        const uploadResult = await this.targetProvider.uploadFile(
          uploadFile,
          request.targetFolderId
        );

        if (!uploadResult.success) {
          this.progress.status = 'failed';
          this.progress.error = uploadResult.error.message;
          this.updateProgress();
          return uploadResult;
        }

        // Update progress
        this.progress.completedFiles++;
        this.progress.progress = (this.progress.completedFiles / this.progress.totalFiles) * 100;
        this.updateProgress();
      }

      this.progress.status = 'completed';
      this.progress.progress = 100;
      this.updateProgress();

      return { success: true, data: undefined };
    } catch (error) {
      this.progress.status = 'failed';
      this.progress.error = error instanceof Error ? error.message : 'Transfer failed';
      this.updateProgress();

      return {
        success: false,
        error: {
          code: 'UNKNOWN',
          message: this.progress.error,
        },
      };
    }
  }

  private updateProgress() {
    if (this.onProgressUpdate) {
      this.onProgressUpdate({ ...this.progress });
    }
  }

  getProgress(): CloudTransferProgress {
    return { ...this.progress };
  }
}