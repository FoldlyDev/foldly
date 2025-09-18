import { BaseCloudProvider } from './types';
import type { CloudFile, Result } from './types';

interface OneDriveFile {
  id: string;
  name: string;
  size?: number;
  lastModifiedDateTime?: string;
  createdDateTime?: string;
  parentReference?: {
    id: string;
    path?: string;
  };
  webUrl?: string;
  '@microsoft.graph.downloadUrl'?: string;
  file?: {
    mimeType: string;
    hashes?: {
      quickXorHash?: string;
    };
  };
  folder?: {
    childCount: number;
  };
}

export class OneDriveProvider extends BaseCloudProvider {
  private readonly GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

  constructor(accessToken: string) {
    super(accessToken, 'https://graph.microsoft.com/v1.0');
  }

  async getFiles(folderId?: string): Promise<Result<CloudFile[]>> {
    // If a specific folder is requested, just get its contents
    if (folderId) {
      const endpoint = `${this.GRAPH_API_BASE}/me/drive/items/${folderId}/children?$top=1000`;
      const result = await this.makeRequest<{ value: OneDriveFile[] }>(endpoint);

      if (!result.success) return result;

      const files = result.data.value.map(this.mapOneDriveFileToCloudFile);
      return { success: true, data: files };
    }

    // For root, get all files recursively
    return this.getAllFilesRecursively();
  }

  private async getAllFilesRecursively(): Promise<Result<CloudFile[]>> {
    const allFiles: CloudFile[] = [];
    const processedFolders = new Set<string>();

    // First, get all files from root
    const rootEndpoint = `${this.GRAPH_API_BASE}/me/drive/root/children?$top=1000`;
    const rootResult = await this.makeRequest<{ value: OneDriveFile[] }>(rootEndpoint);

    if (!rootResult.success) return rootResult;

    const rootFiles = rootResult.data.value.map(this.mapOneDriveFileToCloudFile);
    allFiles.push(...rootFiles);

    // Find all folders in root
    const rootFolders = rootFiles.filter(f => f.isFolder);

    // Recursively get contents of each folder
    const fetchFolderContents = async (folder: CloudFile): Promise<void> => {
      if (processedFolders.has(folder.id)) return;
      processedFolders.add(folder.id);

      const endpoint = `${this.GRAPH_API_BASE}/me/drive/items/${folder.id}/children?$top=1000`;
      const result = await this.makeRequest<{ value: OneDriveFile[] }>(endpoint);

      if (!result.success) return;

      const folderFiles = result.data.value.map(this.mapOneDriveFileToCloudFile);
      allFiles.push(...folderFiles);

      // Recursively process subfolders
      const subFolders = folderFiles.filter(f => f.isFolder);
      for (const subFolder of subFolders) {
        await fetchFolderContents(subFolder);
      }
    };

    // Fetch contents of all root folders
    for (const folder of rootFolders) {
      await fetchFolderContents(folder);
    }

    return { success: true, data: allFiles };
  }

  async getFile(fileId: string): Promise<Result<CloudFile>> {
    const result = await this.makeRequest<OneDriveFile>(
      `${this.GRAPH_API_BASE}/me/drive/items/${fileId}`
    );

    if (!result.success) return result;

    return { success: true, data: this.mapOneDriveFileToCloudFile(result.data) };
  }

  async downloadFile(fileId: string): Promise<Result<Blob>> {
    // First get the download URL
    const fileResult = await this.makeRequest<OneDriveFile>(
      `${this.GRAPH_API_BASE}/me/drive/items/${fileId}?select=@microsoft.graph.downloadUrl`
    );

    if (!fileResult.success) return fileResult;

    const downloadUrl = fileResult.data['@microsoft.graph.downloadUrl'];
    if (!downloadUrl) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN',
          message: 'Download URL not available',
        },
      };
    }

    // Download the file (no auth needed for the download URL)
    const response = await fetch(downloadUrl);

    if (!response.ok) {
      return this.handleErrorResponse(response);
    }

    const blob = await response.blob();
    return { success: true, data: blob };
  }

  async uploadFile(file: File, folderId?: string): Promise<Result<CloudFile>> {
    const endpoint = folderId
      ? `${this.GRAPH_API_BASE}/me/drive/items/${folderId}:/${file.name}:/content`
      : `${this.GRAPH_API_BASE}/me/drive/root:/${file.name}:/content`;

    // For files <= 4MB, use simple upload
    if (file.size <= 4 * 1024 * 1024) {
      const result = await this.makeRequest<OneDriveFile>(
        endpoint,
        {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        }
      );

      if (!result.success) return result;

      return { success: true, data: this.mapOneDriveFileToCloudFile(result.data) };
    }

    // For larger files, we'd need to implement resumable upload
    // For now, return an error
    return {
      success: false,
      error: {
        code: 'UNKNOWN',
        message: 'Large file upload not implemented',
      },
    };
  }

  async createFolder(name: string, parentId?: string): Promise<Result<CloudFile>> {
    const endpoint = parentId
      ? `${this.GRAPH_API_BASE}/me/drive/items/${parentId}/children`
      : `${this.GRAPH_API_BASE}/me/drive/root/children`;

    const metadata = {
      name,
      folder: {},
      '@microsoft.graph.conflictBehavior': 'rename',
    };

    const result = await this.makeRequest<OneDriveFile>(
      endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!result.success) return result;

    return { success: true, data: this.mapOneDriveFileToCloudFile(result.data) };
  }

  async deleteFile(fileId: string): Promise<Result<void>> {
    const result = await this.makeRequest(
      `${this.GRAPH_API_BASE}/me/drive/items/${fileId}`,
      { method: 'DELETE' }
    );

    if (!result.success) return result;

    return { success: true, data: undefined };
  }

  async moveFile(fileId: string, newParentId: string): Promise<Result<CloudFile>> {
    const metadata = {
      parentReference: {
        id: newParentId,
      },
    };

    const result = await this.makeRequest<OneDriveFile>(
      `${this.GRAPH_API_BASE}/me/drive/items/${fileId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!result.success) return result;

    return { success: true, data: this.mapOneDriveFileToCloudFile(result.data) };
  }

  async searchFiles(query: string): Promise<Result<CloudFile[]>> {
    const result = await this.makeRequest<{ value: OneDriveFile[] }>(
      `${this.GRAPH_API_BASE}/me/drive/search(q='${encodeURIComponent(query)}')`
    );

    if (!result.success) return result;

    const files = result.data.value.map(this.mapOneDriveFileToCloudFile);
    return { success: true, data: files };
  }

  private mapOneDriveFileToCloudFile = (file: OneDriveFile): CloudFile => ({
    id: file.id,
    name: file.name,
    mimeType: file.file?.mimeType || 'application/vnd.ms-folder',
    size: file.size || 0,
    modifiedTime: file.lastModifiedDateTime || new Date().toISOString(),
    createdTime: file.createdDateTime || new Date().toISOString(),
    parents: file.parentReference?.id ? [file.parentReference.id] : undefined,
    webViewLink: file.webUrl,
    downloadUrl: file['@microsoft.graph.downloadUrl'],
    isFolder: !!file.folder,
    provider: 'onedrive',
  });
}