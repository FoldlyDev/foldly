import type { Link, User, Batch, File } from '@/lib/database/schemas';

export interface LinkWithOwner extends Link {
  owner: Pick<User, 'id' | 'username' | 'storage_used'>;
  subscription: {
    storageLimit: number;
    maxFileSize: number;
  };
}

export interface UploadSession {
  linkId: string;
  uploaderName: string;
  uploaderEmail?: string;
  uploaderMessage?: string;
  authenticated: boolean;
}

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface UploadBatch {
  id: string;
  files: UploadFile[];
  totalSize: number;
  processedSize: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
}

export interface StorageQuota {
  used: number;
  limit: number;
  available: number;
  percentage: number;
}

export interface PublicFile extends File {
  batch: Pick<Batch, 'id' | 'uploader_name' | 'created_at'>;
}

export interface FileTreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  mimeType?: string;
  downloadUrl?: string;
  children?: FileTreeNode[];
  uploadedAt?: Date;
  uploaderName?: string;
}