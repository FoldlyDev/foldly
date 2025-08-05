// Enhanced Mock Data for Files Feature - Shared Files via Upload Links
// Realistic data showing files shared with the user through various upload links

import type { FileUpload, Folder } from '../types/database';
import type { FileId, FolderId } from '@/types';

// =============================================================================
// MOCK FOLDERS - WORKSPACE ORGANIZATION
// =============================================================================

export const MOCK_FOLDERS: Folder[] = [
  {
    id: 'folder_client_assets' as FolderId,
    name: 'Client Assets',
    path: '/Client Assets',
    depth: 0,
    parentFolderId: undefined,
    uploadLinkId: 'link_client_upload',
    isArchived: false,
    sortOrder: 1,
    fileCount: 8,
    totalSize: 15728640, // ~15MB
    lastActivity: new Date('2024-12-20T15:30:00Z'),
    createdAt: new Date('2024-12-01T09:00:00Z'),
    updatedAt: new Date('2024-12-20T15:30:00Z'),
  },
  {
    id: 'folder_team_docs' as FolderId,
    name: 'Team Documents',
    path: '/Team Documents',
    depth: 0,
    parentFolderId: undefined,
    uploadLinkId: 'link_team_upload',
    isArchived: false,
    sortOrder: 2,
    fileCount: 12,
    totalSize: 25165824, // ~24MB
    lastActivity: new Date('2024-12-21T11:15:00Z'),
    createdAt: new Date('2024-11-15T14:00:00Z'),
    updatedAt: new Date('2024-12-21T11:15:00Z'),
  },
  {
    id: 'folder_media_uploads' as FolderId,
    name: 'Media & Assets',
    path: '/Media & Assets',
    depth: 0,
    parentFolderId: undefined,
    uploadLinkId: 'link_media_upload',
    isArchived: false,
    sortOrder: 3,
    fileCount: 15,
    totalSize: 45097984, // ~43MB
    lastActivity: new Date('2024-12-22T09:45:00Z'),
    createdAt: new Date('2024-12-10T10:30:00Z'),
    updatedAt: new Date('2024-12-22T09:45:00Z'),
  },
  {
    id: 'folder_feedback' as FolderId,
    name: 'Feedback & Reviews',
    path: '/Feedback & Reviews',
    depth: 0,
    parentFolderId: undefined,
    uploadLinkId: 'link_feedback_upload',
    isArchived: false,
    sortOrder: 4,
    fileCount: 6,
    totalSize: 8388608, // ~8MB
    lastActivity: new Date('2024-12-19T16:20:00Z'),
    createdAt: new Date('2024-12-05T13:15:00Z'),
    updatedAt: new Date('2024-12-19T16:20:00Z'),
  },
];

// =============================================================================
// MOCK FILES - SHARED VIA UPLOAD LINKS
// =============================================================================

export const MOCK_FILES: FileUpload[] = [
  // Client Assets Folder
  {
    id: 'file_logo_design' as FileId,
    uploadLinkId: 'link_client_upload',
    folderId: 'folder_client_assets' as FolderId,
    batchId: 'batch_client_001',
    uploaderName: 'Sarah Johnson',
    uploaderEmail: 'sarah@designstudio.com',
    uploaderMessage:
      'Final logo variations for your review. Please check the color schemes!',
    fileName: 'Logo_Variations_Final.ai',
    originalFileName: 'CompanyLogo_v3_FINAL.ai',
    fileSize: 4194304, // 4MB
    fileType: 'application/illustrator',
    mimeType: 'application/illustrator',
    storagePath: '/client-assets/logo-variations-final.ai',
    md5Hash: 'a1b2c3d4e5f6789',
    processingStatus: 'completed',
    isProcessed: true,
    isSafe: true,
    thumbnailPath: '/thumbnails/logo-preview.png',
    downloadCount: 8,
    lastDownloadAt: new Date('2024-12-20T14:30:00Z'),
    classification: 'internal',
    tags: ['logo', 'design', 'final'],
    isArchived: false,
    createdAt: new Date('2024-12-15T10:30:00Z'),
    updatedAt: new Date('2024-12-15T10:30:00Z'),
  },
  {
    id: 'file_brand_guidelines' as FileId,
    uploadLinkId: 'link_client_upload',
    folderId: 'folder_client_assets' as FolderId,
    batchId: 'batch_client_001',
    uploaderName: 'Sarah Johnson',
    uploaderEmail: 'sarah@designstudio.com',
    uploaderMessage: 'Brand guidelines document - please review section 3',
    fileName: 'Brand_Guidelines_2024.pdf',
    originalFileName: 'Brand Guidelines Dec 2024.pdf',
    fileSize: 2097152, // 2MB
    fileType: 'application/pdf',
    mimeType: 'application/pdf',
    storagePath: '/client-assets/brand-guidelines-2024.pdf',
    processingStatus: 'completed',
    isProcessed: true,
    isSafe: true,
    thumbnailPath: '/thumbnails/pdf-preview.png',
    downloadCount: 12,
    lastDownloadAt: new Date('2024-12-19T16:45:00Z'),
    classification: 'internal',
    tags: ['brand', 'guidelines', 'reference'],
    isArchived: false,
    createdAt: new Date('2024-12-15T11:00:00Z'),
    updatedAt: new Date('2024-12-15T11:00:00Z'),
  },
  {
    id: 'file_product_photos' as FileId,
    uploadLinkId: 'link_client_upload',
    folderId: 'folder_client_assets' as FolderId,
    batchId: 'batch_client_002',
    uploaderName: 'Mike Chen',
    uploaderEmail: 'mike@photographyco.com',
    uploaderMessage:
      'Product photography session results - high resolution images',
    fileName: 'Product_Photos_Session1.zip',
    originalFileName: 'ProductShoot_December_HighRes.zip',
    fileSize: 52428800, // 50MB
    fileType: 'application/zip',
    mimeType: 'application/zip',
    storagePath: '/client-assets/product-photos-session1.zip',
    processingStatus: 'completed',
    isProcessed: true,
    isSafe: true,
    downloadCount: 5,
    lastDownloadAt: new Date('2024-12-18T13:20:00Z'),
    classification: 'internal',
    tags: ['photography', 'products', 'high-res'],
    isArchived: false,
    createdAt: new Date('2024-12-16T14:15:00Z'),
    updatedAt: new Date('2024-12-16T14:15:00Z'),
  },

  // Team Documents Folder
  {
    id: 'file_project_spec' as FileId,
    uploadLinkId: 'link_team_upload',
    folderId: 'folder_team_docs' as FolderId,
    batchId: 'batch_team_001',
    uploaderName: 'Alex Rodriguez',
    uploaderEmail: 'alex@company.com',
    uploaderMessage:
      'Updated project specifications with client feedback integrated',
    fileName: 'Project_Specifications_v2.docx',
    originalFileName: 'ProjectSpec_Updated_Final.docx',
    fileSize: 1048576, // 1MB
    fileType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    storagePath: '/team-docs/project-specifications-v2.docx',
    processingStatus: 'completed',
    isProcessed: true,
    isSafe: true,
    thumbnailPath: '/thumbnails/docx-preview.png',
    downloadCount: 15,
    lastDownloadAt: new Date('2024-12-21T10:30:00Z'),
    classification: 'internal',
    tags: ['specifications', 'project', 'requirements'],
    isArchived: false,
    createdAt: new Date('2024-12-18T09:45:00Z'),
    updatedAt: new Date('2024-12-18T09:45:00Z'),
  },
  {
    id: 'file_meeting_notes' as FileId,
    uploadLinkId: 'link_team_upload',
    folderId: 'folder_team_docs' as FolderId,
    batchId: 'batch_team_002',
    uploaderName: 'Emma Davis',
    uploaderEmail: 'emma@company.com',
    uploaderMessage: 'Meeting notes from client call - action items included',
    fileName: 'Client_Meeting_Notes_Dec20.md',
    originalFileName: 'Meeting Notes - Client Call December 20.md',
    fileSize: 32768, // 32KB
    fileType: 'text/markdown',
    mimeType: 'text/markdown',
    storagePath: '/team-docs/client-meeting-notes-dec20.md',
    processingStatus: 'completed',
    isProcessed: true,
    isSafe: true,
    downloadCount: 8,
    lastDownloadAt: new Date('2024-12-21T11:15:00Z'),
    classification: 'internal',
    tags: ['meeting', 'notes', 'action-items'],
    isArchived: false,
    createdAt: new Date('2024-12-20T15:30:00Z'),
    updatedAt: new Date('2024-12-20T15:30:00Z'),
  },

  // Media & Assets Folder
  {
    id: 'file_hero_video' as FileId,
    uploadLinkId: 'link_media_upload',
    folderId: 'folder_media_uploads' as FolderId,
    batchId: 'batch_media_001',
    uploaderName: 'Creative Agency',
    uploaderEmail: 'creative@agency.com',
    uploaderMessage: 'Hero video for homepage - 4K resolution, ready for web',
    fileName: 'Homepage_Hero_4K.mp4',
    originalFileName: 'Hero Video - Homepage - 4K Quality.mp4',
    fileSize: 67108864, // 64MB
    fileType: 'video/mp4',
    mimeType: 'video/mp4',
    storagePath: '/media/homepage-hero-4k.mp4',
    processingStatus: 'completed',
    isProcessed: true,
    isSafe: true,
    thumbnailPath: '/thumbnails/video-preview.jpg',
    downloadCount: 3,
    lastDownloadAt: new Date('2024-12-22T09:45:00Z'),
    classification: 'public',
    tags: ['video', 'homepage', '4k', 'hero'],
    isArchived: false,
    createdAt: new Date('2024-12-21T16:20:00Z'),
    updatedAt: new Date('2024-12-21T16:20:00Z'),
  },
  {
    id: 'file_social_assets' as FileId,
    uploadLinkId: 'link_media_upload',
    folderId: 'folder_media_uploads' as FolderId,
    batchId: 'batch_media_002',
    uploaderName: 'Social Media Team',
    uploaderEmail: 'social@company.com',
    uploaderMessage: 'Social media assets for December campaign',
    fileName: 'Social_Assets_December.zip',
    originalFileName: 'December Campaign - Social Media Pack.zip',
    fileSize: 25165824, // 24MB
    fileType: 'application/zip',
    mimeType: 'application/zip',
    storagePath: '/media/social-assets-december.zip',
    processingStatus: 'completed',
    isProcessed: true,
    isSafe: true,
    downloadCount: 7,
    lastDownloadAt: new Date('2024-12-20T14:10:00Z'),
    classification: 'public',
    tags: ['social-media', 'campaign', 'december'],
    isArchived: false,
    createdAt: new Date('2024-12-19T11:30:00Z'),
    updatedAt: new Date('2024-12-19T11:30:00Z'),
  },

  // Feedback & Reviews Folder
  {
    id: 'file_client_feedback' as FileId,
    uploadLinkId: 'link_feedback_upload',
    folderId: 'folder_feedback' as FolderId,
    batchId: 'batch_feedback_001',
    uploaderName: 'Jessica Miller',
    uploaderEmail: 'jessica@clientcompany.com',
    uploaderMessage:
      'Detailed feedback on the latest designs - please address the color concerns',
    fileName: 'Design_Feedback_Round2.pdf',
    originalFileName: 'Feedback - Design Review Round 2.pdf',
    fileSize: 524288, // 512KB
    fileType: 'application/pdf',
    mimeType: 'application/pdf',
    storagePath: '/feedback/design-feedback-round2.pdf',
    processingStatus: 'completed',
    isProcessed: true,
    isSafe: true,
    thumbnailPath: '/thumbnails/pdf-preview.png',
    downloadCount: 6,
    lastDownloadAt: new Date('2024-12-19T16:20:00Z'),
    classification: 'confidential',
    tags: ['feedback', 'design', 'review'],
    isArchived: false,
    createdAt: new Date('2024-12-19T14:45:00Z'),
    updatedAt: new Date('2024-12-19T14:45:00Z'),
  },
  {
    id: 'file_recorded_review' as FileId,
    uploadLinkId: 'link_feedback_upload',
    folderId: 'folder_feedback' as FolderId,
    batchId: 'batch_feedback_002',
    uploaderName: 'David Thompson',
    uploaderEmail: 'david@clientcompany.com',
    uploaderMessage: 'Screen recording of website review with annotations',
    fileName: 'Website_Review_Recording.mov',
    originalFileName: 'Website Review - Screen Recording with Comments.mov',
    fileSize: 15728640, // 15MB
    fileType: 'video/quicktime',
    mimeType: 'video/quicktime',
    storagePath: '/feedback/website-review-recording.mov',
    processingStatus: 'completed',
    isProcessed: true,
    isSafe: true,
    thumbnailPath: '/thumbnails/video-preview.jpg',
    downloadCount: 4,
    lastDownloadAt: new Date('2024-12-18T10:15:00Z'),
    classification: 'confidential',
    tags: ['review', 'website', 'recording'],
    isArchived: false,
    createdAt: new Date('2024-12-17T13:20:00Z'),
    updatedAt: new Date('2024-12-17T13:20:00Z'),
  },
];

// =============================================================================
// WORKSPACE DATA
// =============================================================================

export const MOCK_WORKSPACE_DATA = {
  totalFiles: MOCK_FILES.length,
  totalFolders: MOCK_FOLDERS.length,
  totalSize: MOCK_FILES.reduce((sum, file) => sum + file.fileSize, 0),
  recentActivity: MOCK_FILES.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5),
  storageUsed: {
    used: MOCK_FILES.reduce((sum, file) => sum + file.fileSize, 0),
    total: 1073741824, // 1GB
    percentage: 67,
  },
  filesByType: {
    documents: MOCK_FILES.filter(
      f =>
        f.mimeType.includes('pdf') ||
        f.mimeType.includes('document') ||
        f.mimeType.includes('markdown')
    ).length,
    images: MOCK_FILES.filter(f => f.mimeType.includes('image')).length,
    videos: MOCK_FILES.filter(f => f.mimeType.includes('video')).length,
    archives: MOCK_FILES.filter(f => f.mimeType.includes('zip')).length,
    others: MOCK_FILES.filter(
      f =>
        !['pdf', 'document', 'markdown', 'image', 'video', 'zip'].some(type =>
          f.mimeType.includes(type)
        )
    ).length,
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get files by folder ID
 */
export const getFilesByFolder = (folderId: FolderId): FileUpload[] => {
  return MOCK_FILES.filter(file => file.folderId === folderId);
};

/**
 * Get recent files (last 7 days)
 */
export const getRecentFiles = (): FileUpload[] => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return MOCK_FILES.filter(
    file => new Date(file.createdAt) >= sevenDaysAgo
  ).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

/**
 * Get files by uploader
 */
export const getFilesByUploader = (uploaderEmail: string): FileUpload[] => {
  return MOCK_FILES.filter(file => file.uploaderEmail === uploaderEmail);
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file type icon
 */
export const getFileTypeIcon = (mimeType: string): string => {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('video')) return '🎥';
  if (mimeType.includes('audio')) return '🎵';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
  if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
    return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
    return '📋';
  if (mimeType.includes('text')) return '📄';
  return '📄';
};
