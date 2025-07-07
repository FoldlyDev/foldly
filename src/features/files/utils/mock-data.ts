// Files Feature Mock Data for Foldly - Development and Testing Data
// Comprehensive mock data for file management functionality
// Following 2025 TypeScript best practices with realistic data

import type {
  FileData,
  FolderData,
  WorkspaceData,
  FileId,
  FolderId,
  WorkspaceId,
} from '../types';

// =============================================================================
// MOCK FILES DATA
// =============================================================================

/**
 * Sample files with realistic properties and metadata
 * Using web URLs for thumbnails and downloads to avoid 404 errors
 */
export const MOCK_FILES: FileData[] = [
  {
    id: 'file_1' as FileId,
    name: 'Project-Presentation.pdf',
    type: 'DOCUMENT',
    size: 2547896, // ~2.5MB
    mimeType: 'application/pdf',
    path: '/documents/presentations/Project-Presentation.pdf',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    thumbnailUrl: 'https://via.placeholder.com/150x200/2563eb/ffffff?text=PDF',
    createdAt: new Date('2024-12-15T10:30:00Z'),
    updatedAt: new Date('2024-12-15T10:30:00Z'),
    uploadedAt: new Date('2024-12-15T10:30:00Z'),
    status: 'COMPLETED',
    uploadProgress: 100,
    folderId: 'folder_1' as FolderId,
    workspaceId: 'workspace_1' as WorkspaceId,
    tags: ['presentation', 'work', 'important'],
    description: 'Annual project presentation for Q4 review',
    downloadCount: 15,
    isShared: true,
    isPublic: false,
    sharedAt: new Date('2024-12-15T11:00:00Z'),
    sharedBy: 'user_1',
    permissions: {
      canView: true,
      canEdit: false,
      canDelete: true,
      canShare: true,
      canMove: true,
      canRename: true,
    },
    metadata: {
      author: 'John Doe',
      title: 'Project Presentation Q4',
      pages: 24,
      resolution: null,
      duration: null,
      dimensions: null,
      encoding: null,
      checksum: 'sha256:abc123def456',
      contentType: 'application/pdf',
      language: 'en',
      keywords: ['project', 'presentation', 'quarterly'],
    },
    versions: [
      {
        id: 'version_1',
        version: '1.0',
        createdAt: new Date('2024-12-15T10:30:00Z'),
        size: 2547896,
        checksum: 'sha256:abc123def456',
        comment: 'Initial version',
      },
    ],
    backup: {
      isEnabled: true,
      lastBackupAt: new Date('2024-12-15T11:00:00Z'),
      backupCount: 3,
      backupSize: 2547896,
    },
  },
  {
    id: 'file_2' as FileId,
    name: 'Design-Assets.zip',
    type: 'ARCHIVE',
    size: 15728640, // ~15MB
    mimeType: 'application/zip',
    path: '/projects/design/Design-Assets.zip',
    url: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-zip-file.zip',
    thumbnailUrl: 'https://via.placeholder.com/150x150/f59e0b/ffffff?text=ZIP',
    createdAt: new Date('2024-12-10T14:20:00Z'),
    updatedAt: new Date('2024-12-10T14:20:00Z'),
    uploadedAt: new Date('2024-12-10T14:20:00Z'),
    status: 'COMPLETED',
    uploadProgress: 100,
    folderId: 'folder_2' as FolderId,
    workspaceId: 'workspace_1' as WorkspaceId,
    tags: ['design', 'assets', 'zip'],
    description: 'Complete design assets package for the new website',
    downloadCount: 8,
    isShared: false,
    isPublic: false,
    sharedAt: null,
    sharedBy: null,
    permissions: {
      canView: true,
      canEdit: false,
      canDelete: true,
      canShare: true,
      canMove: true,
      canRename: true,
    },
    metadata: {
      author: 'Design Team',
      title: 'Design Assets Package',
      pages: null,
      resolution: null,
      duration: null,
      dimensions: null,
      encoding: 'zip',
      checksum: 'sha256:def789ghi012',
      contentType: 'application/zip',
      language: null,
      keywords: ['design', 'assets', 'website'],
    },
    versions: [
      {
        id: 'version_2',
        version: '2.0',
        createdAt: new Date('2024-12-10T14:20:00Z'),
        size: 15728640,
        checksum: 'sha256:def789ghi012',
        comment: 'Updated with new branding',
      },
    ],
    backup: {
      isEnabled: true,
      lastBackupAt: new Date('2024-12-10T15:00:00Z'),
      backupCount: 2,
      backupSize: 15728640,
    },
  },
  {
    id: 'file_3' as FileId,
    name: 'Demo-Video.mp4',
    type: 'VIDEO',
    size: 87654321, // ~87MB
    mimeType: 'video/mp4',
    path: '/media/videos/Demo-Video.mp4',
    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    thumbnailUrl: 'https://via.placeholder.com/150x100/dc2626/ffffff?text=MP4',
    createdAt: new Date('2024-12-08T09:15:00Z'),
    updatedAt: new Date('2024-12-08T09:15:00Z'),
    uploadedAt: new Date('2024-12-08T09:15:00Z'),
    status: 'COMPLETED',
    uploadProgress: 100,
    folderId: 'folder_3' as FolderId,
    workspaceId: 'workspace_1' as WorkspaceId,
    tags: ['video', 'demo', 'tutorial'],
    description: 'Product demonstration video for client presentation',
    downloadCount: 25,
    isShared: true,
    isPublic: true,
    sharedAt: new Date('2024-12-08T10:00:00Z'),
    sharedBy: 'user_2',
    permissions: {
      canView: true,
      canEdit: false,
      canDelete: true,
      canShare: true,
      canMove: true,
      canRename: true,
    },
    metadata: {
      author: 'Video Team',
      title: 'Product Demo Video',
      pages: null,
      resolution: '1920x1080',
      duration: 185, // 3:05 minutes
      dimensions: { width: 1920, height: 1080 },
      encoding: 'H.264',
      checksum: 'sha256:ghi345jkl678',
      contentType: 'video/mp4',
      language: 'en',
      keywords: ['product', 'demo', 'tutorial'],
    },
    versions: [
      {
        id: 'version_3',
        version: '1.0',
        createdAt: new Date('2024-12-08T09:15:00Z'),
        size: 87654321,
        checksum: 'sha256:ghi345jkl678',
        comment: 'Final version with editing',
      },
    ],
    backup: {
      isEnabled: true,
      lastBackupAt: new Date('2024-12-08T10:30:00Z'),
      backupCount: 1,
      backupSize: 87654321,
    },
  },
  {
    id: 'file_4' as FileId,
    name: 'Team-Photo.jpg',
    type: 'IMAGE',
    size: 3145728, // ~3MB
    mimeType: 'image/jpeg',
    path: '/photos/team/Team-Photo.jpg',
    url: 'https://picsum.photos/800/600?random=1',
    thumbnailUrl: 'https://picsum.photos/150/150?random=1',
    createdAt: new Date('2024-12-05T16:45:00Z'),
    updatedAt: new Date('2024-12-05T16:45:00Z'),
    uploadedAt: new Date('2024-12-05T16:45:00Z'),
    status: 'COMPLETED',
    uploadProgress: 100,
    folderId: 'folder_4' as FolderId,
    workspaceId: 'workspace_1' as WorkspaceId,
    tags: ['photo', 'team', 'company'],
    description: 'Official team photo for the company website',
    downloadCount: 12,
    isShared: true,
    isPublic: false,
    sharedAt: new Date('2024-12-05T17:00:00Z'),
    sharedBy: 'user_3',
    permissions: {
      canView: true,
      canEdit: true,
      canDelete: true,
      canShare: true,
      canMove: true,
      canRename: true,
    },
    metadata: {
      author: 'Company Photographer',
      title: 'Team Photo 2024',
      pages: null,
      resolution: '4032x3024',
      duration: null,
      dimensions: { width: 4032, height: 3024 },
      encoding: 'JPEG',
      checksum: 'sha256:jkl901mno234',
      contentType: 'image/jpeg',
      language: null,
      keywords: ['team', 'photo', 'company', '2024'],
    },
    versions: [
      {
        id: 'version_4',
        version: '1.0',
        createdAt: new Date('2024-12-05T16:45:00Z'),
        size: 3145728,
        checksum: 'sha256:jkl901mno234',
        comment: 'Original high-res photo',
      },
    ],
    backup: {
      isEnabled: true,
      lastBackupAt: new Date('2024-12-05T17:15:00Z'),
      backupCount: 1,
      backupSize: 3145728,
    },
  },
  {
    id: 'file_5' as FileId,
    name: 'Budget-Report.docx',
    type: 'DOCUMENT',
    size: 1048576, // ~1MB
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    path: '/documents/reports/Budget-Report.docx',
    url: 'https://file-examples.com/storage/fe36b7244e21950c4c2d6b5/2017/10/file_example_DOC_10kB.doc',
    thumbnailUrl: 'https://via.placeholder.com/150x200/1e40af/ffffff?text=DOC',
    createdAt: new Date('2024-12-03T11:30:00Z'),
    updatedAt: new Date('2024-12-03T14:22:00Z'),
    uploadedAt: new Date('2024-12-03T11:30:00Z'),
    status: 'COMPLETED',
    uploadProgress: 100,
    folderId: 'folder_1' as FolderId,
    workspaceId: 'workspace_1' as WorkspaceId,
    tags: ['report', 'budget', 'financial'],
    description: 'Quarterly budget report with financial analysis',
    downloadCount: 6,
    isShared: false,
    isPublic: false,
    sharedAt: null,
    sharedBy: null,
    permissions: {
      canView: true,
      canEdit: true,
      canDelete: true,
      canShare: true,
      canMove: true,
      canRename: true,
    },
    metadata: {
      author: 'Finance Team',
      title: 'Q4 Budget Report',
      pages: 18,
      resolution: null,
      duration: null,
      dimensions: null,
      encoding: null,
      checksum: 'sha256:mno567pqr890',
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      language: 'en',
      keywords: ['budget', 'report', 'financial', 'quarterly'],
    },
    versions: [
      {
        id: 'version_5a',
        version: '1.0',
        createdAt: new Date('2024-12-03T11:30:00Z'),
        size: 1048576,
        checksum: 'sha256:mno567pqr890',
        comment: 'Initial draft',
      },
      {
        id: 'version_5b',
        version: '1.1',
        createdAt: new Date('2024-12-03T14:22:00Z'),
        size: 1048576,
        checksum: 'sha256:mno567pqr891',
        comment: 'Added financial analysis section',
      },
    ],
    backup: {
      isEnabled: true,
      lastBackupAt: new Date('2024-12-03T15:00:00Z'),
      backupCount: 2,
      backupSize: 1048576,
    },
  },
  {
    id: 'file_6' as FileId,
    name: 'Quarterly-Metrics.pptx',
    type: 'PRESENTATION',
    size: 5242880, // ~5MB
    mimeType:
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    path: '/presentations/metrics/Quarterly-Metrics.pptx',
    url: 'https://file-examples.com/storage/fe36b7244e21950c4c2d6b5/2017/10/file_example_PPT_250kB.ppt',
    thumbnailUrl: 'https://via.placeholder.com/150x200/dc2626/ffffff?text=PPT',
    createdAt: new Date('2024-12-01T13:15:00Z'),
    updatedAt: new Date('2024-12-01T13:15:00Z'),
    uploadedAt: new Date('2024-12-01T13:15:00Z'),
    status: 'COMPLETED',
    uploadProgress: 100,
    folderId: 'folder_1' as FolderId,
    workspaceId: 'workspace_1' as WorkspaceId,
    tags: ['presentation', 'metrics', 'quarterly'],
    description: 'Quarterly performance metrics presentation',
    downloadCount: 9,
    isShared: true,
    isPublic: false,
    sharedAt: new Date('2024-12-01T14:00:00Z'),
    sharedBy: 'user_1',
    permissions: {
      canView: true,
      canEdit: false,
      canDelete: true,
      canShare: true,
      canMove: true,
      canRename: true,
    },
    metadata: {
      author: 'Analytics Team',
      title: 'Q4 Performance Metrics',
      pages: 35,
      resolution: null,
      duration: null,
      dimensions: null,
      encoding: null,
      checksum: 'sha256:pqr123stu456',
      contentType:
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      language: 'en',
      keywords: ['metrics', 'performance', 'quarterly'],
    },
    versions: [
      {
        id: 'version_6',
        version: '1.0',
        createdAt: new Date('2024-12-01T13:15:00Z'),
        size: 5242880,
        checksum: 'sha256:pqr123stu456',
        comment: 'Final presentation version',
      },
    ],
    backup: {
      isEnabled: true,
      lastBackupAt: new Date('2024-12-01T14:30:00Z'),
      backupCount: 1,
      backupSize: 5242880,
    },
  },
  {
    id: 'file_7' as FileId,
    name: 'Background-Music.mp3',
    type: 'AUDIO',
    size: 7340032, // ~7MB
    mimeType: 'audio/mpeg',
    path: '/media/audio/Background-Music.mp3',
    url: 'https://file-examples.com/storage/fe36b7244e21950c4c2d6b5/2017/11/file_example_MP3_700KB.mp3',
    thumbnailUrl: 'https://via.placeholder.com/150x150/059669/ffffff?text=MP3',
    createdAt: new Date('2024-11-28T08:45:00Z'),
    updatedAt: new Date('2024-11-28T08:45:00Z'),
    uploadedAt: new Date('2024-11-28T08:45:00Z'),
    status: 'COMPLETED',
    uploadProgress: 100,
    folderId: 'folder_3' as FolderId,
    workspaceId: 'workspace_1' as WorkspaceId,
    tags: ['audio', 'music', 'background'],
    description: 'Background music for video presentations',
    downloadCount: 4,
    isShared: false,
    isPublic: false,
    sharedAt: null,
    sharedBy: null,
    permissions: {
      canView: true,
      canEdit: false,
      canDelete: true,
      canShare: true,
      canMove: true,
      canRename: true,
    },
    metadata: {
      author: 'Audio Team',
      title: 'Background Music Track',
      pages: null,
      resolution: null,
      duration: 180, // 3:00 minutes
      dimensions: null,
      encoding: 'MP3',
      checksum: 'sha256:stu789vwx012',
      contentType: 'audio/mpeg',
      language: null,
      keywords: ['background', 'music', 'audio'],
    },
    versions: [
      {
        id: 'version_7',
        version: '1.0',
        createdAt: new Date('2024-11-28T08:45:00Z'),
        size: 7340032,
        checksum: 'sha256:stu789vwx012',
        comment: 'Original audio file',
      },
    ],
    backup: {
      isEnabled: true,
      lastBackupAt: new Date('2024-11-28T09:00:00Z'),
      backupCount: 1,
      backupSize: 7340032,
    },
  },
  {
    id: 'file_8' as FileId,
    name: 'Logo-Design.png',
    type: 'IMAGE',
    size: 2097152, // ~2MB
    mimeType: 'image/png',
    path: '/design/branding/Logo-Design.png',
    url: 'https://picsum.photos/800/600?random=2',
    thumbnailUrl: 'https://picsum.photos/150/150?random=2',
    createdAt: new Date('2024-11-25T15:30:00Z'),
    updatedAt: new Date('2024-11-25T15:30:00Z'),
    uploadedAt: new Date('2024-11-25T15:30:00Z'),
    status: 'COMPLETED',
    uploadProgress: 100,
    folderId: 'folder_2' as FolderId,
    workspaceId: 'workspace_1' as WorkspaceId,
    tags: ['logo', 'design', 'branding'],
    description: 'Official company logo in PNG format',
    downloadCount: 18,
    isShared: true,
    isPublic: true,
    sharedAt: new Date('2024-11-25T16:00:00Z'),
    sharedBy: 'user_2',
    permissions: {
      canView: true,
      canEdit: true,
      canDelete: true,
      canShare: true,
      canMove: true,
      canRename: true,
    },
    metadata: {
      author: 'Brand Team',
      title: 'Company Logo',
      pages: null,
      resolution: '1024x1024',
      duration: null,
      dimensions: { width: 1024, height: 1024 },
      encoding: 'PNG',
      checksum: 'sha256:vwx345yz6789',
      contentType: 'image/png',
      language: null,
      keywords: ['logo', 'brand', 'company'],
    },
    versions: [
      {
        id: 'version_8',
        version: '1.0',
        createdAt: new Date('2024-11-25T15:30:00Z'),
        size: 2097152,
        checksum: 'sha256:vwx345yz6789',
        comment: 'Final logo design',
      },
    ],
    backup: {
      isEnabled: true,
      lastBackupAt: new Date('2024-11-25T16:15:00Z'),
      backupCount: 1,
      backupSize: 2097152,
    },
  },
] as const; // =============================================================================
// MOCK FOLDERS DATA
// =============================================================================

/**
 * Sample folders with different colors and purposes
 */
export const MOCK_FOLDERS: FolderData[] = [
  {
    id: 'folder_1' as FolderId,
    name: 'Documents',
    path: '/documents',
    color: 'blue',
    icon: '📁',
    description: 'Important documents and reports',
    parentId: null,
    workspaceId: 'workspace_1' as WorkspaceId,
    createdAt: new Date('2024-11-20T10:00:00Z'),
    updatedAt: new Date('2024-12-15T10:30:00Z'),
    fileCount: 3,
    subfolderCount: 2,
    totalSize: 8844352, // ~8.4MB
    isShared: true,
    isPublic: false,
    sharedAt: new Date('2024-11-20T11:00:00Z'),
    sharedBy: 'user_1',
    permissions: {
      canView: true,
      canEdit: true,
      canDelete: true,
      canShare: true,
      canMove: true,
      canRename: true,
    },
    tags: ['documents', 'official', 'reports'],
    metadata: {
      author: 'Team Lead',
      keywords: ['documents', 'reports', 'official'],
      customProperties: {
        department: 'Administration',
        priority: 'high',
      },
    },
    backup: {
      isEnabled: true,
      lastBackupAt: new Date('2024-12-15T11:00:00Z'),
      backupCount: 5,
      backupSize: 8844352,
    },
  },
  {
    id: 'folder_2' as FolderId,
    name: 'Design Assets',
    path: '/design',
    color: 'purple',
    icon: '🎨',
    description: 'Design files, logos, and branding materials',
    parentId: null,
    workspaceId: 'workspace_1' as WorkspaceId,
    createdAt: new Date('2024-11-18T14:30:00Z'),
    updatedAt: new Date('2024-11-25T16:00:00Z'),
    fileCount: 2,
    subfolderCount: 1,
    totalSize: 17825792, // ~17MB
    isShared: true,
    isPublic: false,
    sharedAt: new Date('2024-11-18T15:00:00Z'),
    sharedBy: 'user_2',
    permissions: {
      canView: true,
      canEdit: true,
      canDelete: true,
      canShare: true,
      canMove: true,
      canRename: true,
    },
    tags: ['design', 'branding', 'assets'],
    metadata: {
      author: 'Design Team',
      keywords: ['design', 'branding', 'assets'],
      customProperties: {
        department: 'Creative',
        priority: 'medium',
      },
    },
    backup: {
      isEnabled: true,
      lastBackupAt: new Date('2024-11-25T16:15:00Z'),
      backupCount: 3,
      backupSize: 17825792,
    },
  },
  {
    id: 'folder_3' as FolderId,
    name: 'Media Files',
    path: '/media',
    color: 'green',
    icon: '🎬',
    description: 'Videos, audio, and multimedia content',
    parentId: null,
    workspaceId: 'workspace_1' as WorkspaceId,
    createdAt: new Date('2024-11-15T09:00:00Z'),
    updatedAt: new Date('2024-12-08T10:30:00Z'),
    fileCount: 2,
    subfolderCount: 0,
    totalSize: 94994353, // ~95MB
    isShared: true,
    isPublic: true,
    sharedAt: new Date('2024-11-15T10:00:00Z'),
    sharedBy: 'user_3',
    permissions: {
      canView: true,
      canEdit: false,
      canDelete: true,
      canShare: true,
      canMove: true,
      canRename: true,
    },
    tags: ['media', 'video', 'audio'],
    metadata: {
      author: 'Media Team',
      keywords: ['media', 'video', 'audio'],
      customProperties: {
        department: 'Marketing',
        priority: 'high',
      },
    },
    backup: {
      isEnabled: true,
      lastBackupAt: new Date('2024-12-08T11:00:00Z'),
      backupCount: 4,
      backupSize: 94994353,
    },
  },
  {
    id: 'folder_4' as FolderId,
    name: 'Team Photos',
    path: '/photos/team',
    color: 'orange',
    icon: '📸',
    description: 'Official team photos and company events',
    parentId: 'folder_5' as FolderId,
    workspaceId: 'workspace_1' as WorkspaceId,
    createdAt: new Date('2024-11-10T16:00:00Z'),
    updatedAt: new Date('2024-12-05T17:00:00Z'),
    fileCount: 1,
    subfolderCount: 0,
    totalSize: 3145728, // ~3MB
    isShared: true,
    isPublic: false,
    sharedAt: new Date('2024-11-10T17:00:00Z'),
    sharedBy: 'user_3',
    permissions: {
      canView: true,
      canEdit: true,
      canDelete: true,
      canShare: true,
      canMove: true,
      canRename: true,
    },
    tags: ['photos', 'team', 'company'],
    metadata: {
      author: 'HR Team',
      keywords: ['photos', 'team', 'company'],
      customProperties: {
        department: 'Human Resources',
        priority: 'medium',
      },
    },
    backup: {
      isEnabled: true,
      lastBackupAt: new Date('2024-12-05T17:15:00Z'),
      backupCount: 2,
      backupSize: 3145728,
    },
  },
  {
    id: 'folder_5' as FolderId,
    name: 'Photos',
    path: '/photos',
    color: 'yellow',
    icon: '📷',
    description: 'All company photos and images',
    parentId: null,
    workspaceId: 'workspace_1' as WorkspaceId,
    createdAt: new Date('2024-11-10T15:30:00Z'),
    updatedAt: new Date('2024-12-05T17:00:00Z'),
    fileCount: 0,
    subfolderCount: 1,
    totalSize: 3145728, // ~3MB (includes subfolder)
    isShared: true,
    isPublic: false,
    sharedAt: new Date('2024-11-10T16:30:00Z'),
    sharedBy: 'user_3',
    permissions: {
      canView: true,
      canEdit: true,
      canDelete: true,
      canShare: true,
      canMove: true,
      canRename: true,
    },
    tags: ['photos', 'images', 'company'],
    metadata: {
      author: 'HR Team',
      keywords: ['photos', 'images', 'company'],
      customProperties: {
        department: 'Human Resources',
        priority: 'low',
      },
    },
    backup: {
      isEnabled: true,
      lastBackupAt: new Date('2024-12-05T17:15:00Z'),
      backupCount: 2,
      backupSize: 3145728,
    },
  },
  {
    id: 'folder_6' as FolderId,
    name: 'Archive',
    path: '/archive',
    color: 'gray',
    icon: '📦',
    description: 'Archived files and old projects',
    parentId: null,
    workspaceId: 'workspace_1' as WorkspaceId,
    createdAt: new Date('2024-11-01T12:00:00Z'),
    updatedAt: new Date('2024-11-01T12:00:00Z'),
    fileCount: 0,
    subfolderCount: 0,
    totalSize: 0,
    isShared: false,
    isPublic: false,
    sharedAt: null,
    sharedBy: null,
    permissions: {
      canView: true,
      canEdit: false,
      canDelete: true,
      canShare: false,
      canMove: true,
      canRename: true,
    },
    tags: ['archive', 'old', 'backup'],
    metadata: {
      author: 'System',
      keywords: ['archive', 'old', 'backup'],
      customProperties: {
        department: 'IT',
        priority: 'low',
      },
    },
    backup: {
      isEnabled: false,
      lastBackupAt: null,
      backupCount: 0,
      backupSize: 0,
    },
  },
] as const;

// =============================================================================
// MOCK WORKSPACE DATA
// =============================================================================

/**
 * Sample workspace with comprehensive metadata
 */
export const MOCK_WORKSPACE: WorkspaceData = {
  id: 'workspace_1' as WorkspaceId,
  name: 'My Workspace',
  description: 'Main workspace for all project files and documents',
  path: '/',
  createdAt: new Date('2024-11-01T10:00:00Z'),
  updatedAt: new Date('2024-12-15T10:30:00Z'),
  fileCount: 8,
  folderCount: 6,
  totalSize: 127959425, // ~128MB
  isShared: true,
  isPublic: false,
  sharedAt: new Date('2024-11-01T11:00:00Z'),
  sharedBy: 'user_1',
  permissions: {
    canView: true,
    canEdit: true,
    canDelete: true,
    canShare: true,
    canMove: true,
    canRename: true,
  },
  settings: {
    defaultView: 'grid',
    sortBy: 'name',
    sortOrder: 'asc',
    showHiddenFiles: false,
    autoBackup: true,
    thumbnailSize: 'medium',
    enableVersioning: true,
    maxVersions: 10,
    compressionLevel: 6,
  },
  metadata: {
    author: 'Team Lead',
    keywords: ['workspace', 'main', 'project'],
    customProperties: {
      department: 'All',
      priority: 'high',
      theme: 'default',
    },
  },
  backup: {
    isEnabled: true,
    lastBackupAt: new Date('2024-12-15T11:00:00Z'),
    backupCount: 15,
    backupSize: 127959425,
  },
  statistics: {
    totalFiles: 8,
    totalFolders: 6,
    totalSize: 127959425,
    filesByType: {
      IMAGE: 2,
      VIDEO: 1,
      AUDIO: 1,
      DOCUMENT: 2,
      SPREADSHEET: 0,
      PRESENTATION: 1,
      ARCHIVE: 1,
      CODE: 0,
      FONT: 0,
      DESIGN: 0,
      DATA: 0,
      EXECUTABLE: 0,
      OTHER: 0,
    },
    sizeByType: {
      IMAGE: 5242880,
      VIDEO: 87654321,
      AUDIO: 7340032,
      DOCUMENT: 3596472,
      SPREADSHEET: 0,
      PRESENTATION: 5242880,
      ARCHIVE: 15728640,
      CODE: 0,
      FONT: 0,
      DESIGN: 0,
      DATA: 0,
      EXECUTABLE: 0,
      OTHER: 0,
    },
    recentActivity: {
      lastFileAdded: new Date('2024-12-15T10:30:00Z'),
      lastFolderCreated: new Date('2024-11-20T10:00:00Z'),
      lastFileModified: new Date('2024-12-03T14:22:00Z'),
      totalDownloads: 97,
      totalUploads: 8,
    },
  },
} as const;

// =============================================================================
// INITIALIZATION FUNCTIONS
// =============================================================================

/**
 * Initialize mock data for development
 */
export const initializeMockData = () => {
  return {
    files: MOCK_FILES,
    folders: MOCK_FOLDERS,
    workspace: MOCK_WORKSPACE,
  };
};

/**
 * Get files by folder ID
 */
export const getFilesByFolderId = (folderId: FolderId): FileData[] => {
  return MOCK_FILES.filter(file => file.folderId === folderId);
};

/**
 * Get files by workspace ID
 */
export const getFilesByWorkspaceId = (workspaceId: WorkspaceId): FileData[] => {
  return MOCK_FILES.filter(file => file.workspaceId === workspaceId);
};

/**
 * Get root folders (folders without parent)
 */
export const getRootFolders = (): FolderData[] => {
  return MOCK_FOLDERS.filter(folder => folder.parentId === null);
};

/**
 * Get subfolders by parent ID
 */
export const getSubfoldersByParentId = (parentId: FolderId): FolderData[] => {
  return MOCK_FOLDERS.filter(folder => folder.parentId === parentId);
};

/**
 * Get folder by ID
 */
export const getFolderById = (folderId: FolderId): FolderData | null => {
  return MOCK_FOLDERS.find(folder => folder.id === folderId) ?? null;
};

/**
 * Get file by ID
 */
export const getFileById = (fileId: FileId): FileData | null => {
  return MOCK_FILES.find(file => file.id === fileId) ?? null;
};

/**
 * Get recent files (last 30 days)
 */
export const getRecentFiles = (): FileData[] => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return MOCK_FILES.filter(file => file.createdAt >= thirtyDaysAgo).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
};

/**
 * Get shared files
 */
export const getSharedFiles = (): FileData[] => {
  return MOCK_FILES.filter(file => file.isShared);
};

/**
 * Get public files
 */
export const getPublicFiles = (): FileData[] => {
  return MOCK_FILES.filter(file => file.isPublic);
};

/**
 * Get workspace statistics
 */
export const getWorkspaceStats = () => {
  const totalFiles = MOCK_FILES.length;
  const totalFolders = MOCK_FOLDERS.length;
  const totalSize = MOCK_FILES.reduce((sum, file) => sum + file.size, 0);

  return {
    totalFiles,
    totalFolders,
    totalSize,
    sharedFiles: MOCK_FILES.filter(file => file.isShared).length,
    publicFiles: MOCK_FILES.filter(file => file.isPublic).length,
    recentFiles: getRecentFiles().length,
  };
};

/**
 * Search files by name or tags
 */
export const searchFiles = (query: string): FileData[] => {
  const searchTerm = query.toLowerCase();

  return MOCK_FILES.filter(
    file =>
      file.name.toLowerCase().includes(searchTerm) ||
      file.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      file.description?.toLowerCase().includes(searchTerm)
  );
};

/**
 * Search folders by name or tags
 */
export const searchFolders = (query: string): FolderData[] => {
  const searchTerm = query.toLowerCase();

  return MOCK_FOLDERS.filter(
    folder =>
      folder.name.toLowerCase().includes(searchTerm) ||
      folder.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      folder.description?.toLowerCase().includes(searchTerm)
  );
};

/**
 * Get files filtered by type
 */
export const getFilesByType = (fileType: FileData['type']): FileData[] => {
  return MOCK_FILES.filter(file => file.type === fileType);
};

/**
 * Get files filtered by size range
 */
export const getFilesBySize = (
  minSize: number,
  maxSize: number
): FileData[] => {
  return MOCK_FILES.filter(
    file => file.size >= minSize && file.size <= maxSize
  );
};

/**
 * Get files filtered by date range
 */
export const getFilesByDateRange = (
  startDate: Date,
  endDate: Date
): FileData[] => {
  return MOCK_FILES.filter(
    file => file.createdAt >= startDate && file.createdAt <= endDate
  );
};
