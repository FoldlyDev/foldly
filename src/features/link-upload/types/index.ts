import type { links, users, batches, files } from '@/lib/database/schemas';
import type { InferSelectModel } from 'drizzle-orm';

// Type aliases for database models
type Link = InferSelectModel<typeof links>;
type User = InferSelectModel<typeof users>;
type Batch = InferSelectModel<typeof batches>;
type FileRecord = InferSelectModel<typeof files>;

export interface LinkWithOwner extends Link {
  owner: Pick<User, 'id' | 'username' | 'storageUsed'>;
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

export interface PublicFile extends FileRecord {
  batch: Pick<Batch, 'id' | 'uploaderName' | 'createdAt'>;
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
  // Staging support
  isStaged?: boolean;
  stagingId?: string;
}

// Batch upload types for processing staged items
export interface BatchUploadPayload {
  files: Array<{
    id: string;
    file: File;
    parentFolderId?: string;
    uploaderName?: string;
    sortOrder?: number;
  }>;
  folders: Array<{
    id: string;
    name: string;
    parentFolderId?: string;
    sortOrder?: number;
  }>;
  linkId: string;
  uploaderName?: string;
  uploaderEmail?: string;
  uploaderMessage?: string;
}

export interface BatchUploadProgress {
  total: number;
  completed: number;
  failed: number;
  currentItem?: string;
  errors: Array<{
    itemId: string;
    itemName: string;
    error: string;
  }>;
}