// Shared Cloud Storage Types

export interface CloudProvider {
  id: 'google-drive' | 'onedrive';
  name: string;
  icon: string;
}

export interface CloudFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  modifiedTime?: string;
  createdTime?: string;
  parents?: string[] | undefined;
  webViewLink?: string | undefined;
  downloadUrl?: string | undefined;
  thumbnailLink?: string | undefined;
  isFolder: boolean;
  provider: CloudProvider['id'];
}

export interface CloudTreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: CloudTreeNode[];
  parentId?: string;
  file: CloudFile;
  isLoading?: boolean;
  isExpanded?: boolean;
}

export interface CloudTransferRequest {
  sourceProvider: CloudProvider['id'];
  targetProvider: CloudProvider['id'];
  fileIds: string[];
  targetFolderId?: string;
}

export interface CloudTransferProgress {
  id: string;
  status: 'pending' | 'uploading' | 'downloading' | 'completed' | 'failed';
  progress: number;
  totalFiles: number;
  completedFiles: number;
  currentFile?: string;
  error?: string;
}

export interface CloudProviderConfig {
  clientId: string;
  scopes: string[];
  apiEndpoint: string;
}

export interface CloudAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  provider: CloudProvider['id'];
}

export interface CloudStorageError {
  code: 'AUTH_FAILED' | 'NETWORK_ERROR' | 'PERMISSION_DENIED' | 'QUOTA_EXCEEDED' | 'UNKNOWN';
  message: string;
  provider?: CloudProvider['id'];
}

export type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: CloudStorageError };

export interface CloudProviderApi {
  getFiles(folderId?: string): Promise<Result<CloudFile[]>>;
  getFile(fileId: string): Promise<Result<CloudFile>>;
  downloadFile(fileId: string): Promise<Result<Blob>>;
  uploadFile(file: File, folderId?: string): Promise<Result<CloudFile>>;
  createFolder(name: string, parentId?: string): Promise<Result<CloudFile>>;
  deleteFile(fileId: string): Promise<Result<void>>;
  moveFile(fileId: string, newParentId: string): Promise<Result<CloudFile>>;
  searchFiles(query: string): Promise<Result<CloudFile[]>>;
}

// Base provider abstract class
export abstract class BaseCloudProvider implements CloudProviderApi {
  protected accessToken: string;
  protected apiEndpoint: string;

  constructor(accessToken: string, apiEndpoint: string) {
    this.accessToken = accessToken;
    this.apiEndpoint = apiEndpoint;
  }

  abstract getFiles(folderId?: string): Promise<Result<CloudFile[]>>;
  abstract getFile(fileId: string): Promise<Result<CloudFile>>;
  abstract downloadFile(fileId: string): Promise<Result<Blob>>;
  abstract uploadFile(file: File, folderId?: string): Promise<Result<CloudFile>>;
  abstract createFolder(name: string, parentId?: string): Promise<Result<CloudFile>>;
  abstract deleteFile(fileId: string): Promise<Result<void>>;
  abstract moveFile(fileId: string, newParentId: string): Promise<Result<CloudFile>>;
  abstract searchFiles(query: string): Promise<Result<CloudFile[]>>;

  protected async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<Result<T>> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        return this.handleErrorResponse(response);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
      };
    }
  }

  protected async handleErrorResponse(response: Response): Promise<Result<any>> {
    let error: CloudStorageError;

    switch (response.status) {
      case 401:
        error = {
          code: 'AUTH_FAILED',
          message: 'Authentication failed. Please reconnect your account.',
        };
        break;
      case 403:
        error = {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to perform this action.',
        };
        break;
      case 507:
        error = {
          code: 'QUOTA_EXCEEDED',
          message: 'Storage quota exceeded.',
        };
        break;
      default:
        error = {
          code: 'UNKNOWN',
          message: `Request failed with status ${response.status}`,
        };
    }

    return { success: false, error };
  }
}