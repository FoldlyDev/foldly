import { BaseCloudProvider } from './types';
import type { CloudFile, Result } from './types';

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  createdTime?: string;
  parents?: string[];
  webViewLink?: string;
  thumbnailLink?: string;
}

export class GoogleDriveProvider extends BaseCloudProvider {
  private readonly DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
  private readonly UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

  constructor(accessToken: string) {
    super(accessToken, 'https://www.googleapis.com/drive/v3');
  }

  async getFiles(folderId?: string): Promise<Result<CloudFile[]>> {
    // If a specific folder is requested, just get its contents
    if (folderId) {
      const query = `'${folderId}' in parents and trashed = false`;
      const result = await this.makeRequest<{ files: GoogleDriveFile[] }>(
        `${this.DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,modifiedTime,createdTime,parents,webViewLink,thumbnailLink)&pageSize=1000`
      );

      if (!result.success) return result;

      const files = result.data.files.map(this.mapGoogleFileToCloudFile);
      return { success: true, data: files };
    }

    // For root, get all files recursively
    return this.getAllFilesRecursively();
  }

  private async getAllFilesRecursively(): Promise<Result<CloudFile[]>> {
    const allFiles: CloudFile[] = [];
    const processedFolders = new Set<string>();

    // First, get all files from root
    const rootQuery = "'root' in parents and trashed = false";
    const rootResult = await this.makeRequest<{ files: GoogleDriveFile[] }>(
      `${this.DRIVE_API_BASE}/files?q=${encodeURIComponent(rootQuery)}&fields=files(id,name,mimeType,size,modifiedTime,createdTime,parents,webViewLink,thumbnailLink)&pageSize=1000`
    );

    if (!rootResult.success) return rootResult;

    const rootFiles = rootResult.data.files.map(this.mapGoogleFileToCloudFile);
    allFiles.push(...rootFiles);

    // Find all folders in root
    const rootFolders = rootFiles.filter(f => f.isFolder);

    // Recursively get contents of each folder
    const fetchFolderContents = async (folder: CloudFile): Promise<void> => {
      if (processedFolders.has(folder.id)) return;
      processedFolders.add(folder.id);

      const query = `'${folder.id}' in parents and trashed = false`;
      const result = await this.makeRequest<{ files: GoogleDriveFile[] }>(
        `${this.DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,modifiedTime,createdTime,parents,webViewLink,thumbnailLink)&pageSize=1000`
      );

      if (!result.success) return;

      const folderFiles = result.data.files.map(this.mapGoogleFileToCloudFile);
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
    const result = await this.makeRequest<GoogleDriveFile>(
      `${this.DRIVE_API_BASE}/files/${fileId}?fields=id,name,mimeType,size,modifiedTime,createdTime,parents,webViewLink,thumbnailLink`
    );

    if (!result.success) return result;

    return { success: true, data: this.mapGoogleFileToCloudFile(result.data) };
  }

  async downloadFile(fileId: string): Promise<Result<Blob>> {
    const response = await fetch(
      `${this.DRIVE_API_BASE}/files/${fileId}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return this.handleErrorResponse(response);
    }

    const blob = await response.blob();
    return { success: true, data: blob };
  }

  async uploadFile(file: File, folderId?: string): Promise<Result<CloudFile>> {
    const metadata = {
      name: file.name,
      parents: folderId ? [folderId] : undefined,
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', file);

    const result = await this.makeRequest<GoogleDriveFile>(
      `${this.UPLOAD_API_BASE}/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,createdTime,parents,webViewLink,thumbnailLink`,
      {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type, let browser set it with boundary
        },
      }
    );

    if (!result.success) return result;

    return { success: true, data: this.mapGoogleFileToCloudFile(result.data) };
  }

  async createFolder(name: string, parentId?: string): Promise<Result<CloudFile>> {
    const metadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    };

    const result = await this.makeRequest<GoogleDriveFile>(
      `${this.DRIVE_API_BASE}/files?fields=id,name,mimeType,size,modifiedTime,createdTime,parents,webViewLink,thumbnailLink`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!result.success) return result;

    return { success: true, data: this.mapGoogleFileToCloudFile(result.data) };
  }

  async deleteFile(fileId: string): Promise<Result<void>> {
    const result = await this.makeRequest(
      `${this.DRIVE_API_BASE}/files/${fileId}`,
      { method: 'DELETE' }
    );

    if (!result.success) return result;

    return { success: true, data: undefined };
  }

  async moveFile(fileId: string, newParentId: string): Promise<Result<CloudFile>> {
    // First, get the current file to know its current parents
    const fileResult = await this.getFile(fileId);
    if (!fileResult.success) return fileResult;

    const currentParents = fileResult.data.parents?.join(',') || '';

    const result = await this.makeRequest<GoogleDriveFile>(
      `${this.DRIVE_API_BASE}/files/${fileId}?addParents=${newParentId}&removeParents=${currentParents}&fields=id,name,mimeType,size,modifiedTime,createdTime,parents,webViewLink,thumbnailLink`,
      { method: 'PATCH' }
    );

    if (!result.success) return result;

    return { success: true, data: this.mapGoogleFileToCloudFile(result.data) };
  }

  async searchFiles(query: string): Promise<Result<CloudFile[]>> {
    const searchQuery = `name contains '${query}' and trashed = false`;

    const result = await this.makeRequest<{ files: GoogleDriveFile[] }>(
      `${this.DRIVE_API_BASE}/files?q=${encodeURIComponent(searchQuery)}&fields=files(id,name,mimeType,size,modifiedTime,createdTime,parents,webViewLink,thumbnailLink)`
    );

    if (!result.success) return result;

    const files = result.data.files.map(this.mapGoogleFileToCloudFile);
    return { success: true, data: files };
  }

  private mapGoogleFileToCloudFile = (file: GoogleDriveFile): CloudFile => ({
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    size: file.size ? parseInt(file.size) : 0,
    modifiedTime: file.modifiedTime || new Date().toISOString(),
    createdTime: file.createdTime || new Date().toISOString(),
    parents: file.parents,
    webViewLink: file.webViewLink,
    thumbnailLink: file.thumbnailLink,
    isFolder: file.mimeType === 'application/vnd.google-apps.folder',
    provider: 'google-drive',
  });
}