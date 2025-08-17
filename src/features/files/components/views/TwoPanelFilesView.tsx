'use client';

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { Separator } from '@/components/ui/shadcn/separator';
import { Badge } from '@/components/ui/shadcn/badge';
import {
  FolderOpen,
  Files,
  ArrowRight,
  Copy,
  Download,
  Upload,
  Users,
  HardDrive,
  Cloud,
} from 'lucide-react';
import { useFilesDataStore } from '../../store/files-data-store';
import { formatFileSize } from '../../utils/enhanced-mock-data';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface PanelHeaderProps {
  title: string;
  icon: React.ReactNode;
  subtitle: string;
  fileCount: number;
  folderCount: number;
  totalSize: number;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline';
}

// =============================================================================
// PANEL HEADER COMPONENT
// =============================================================================

const PanelHeader = memo(
  ({
    title,
    icon,
    subtitle,
    fileCount,
    folderCount,
    totalSize,
    badge,
    badgeVariant = 'default',
  }: PanelHeaderProps) => (
    <CardHeader className='pb-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          {icon}
          <div>
            <CardTitle className='text-lg font-semibold'>{title}</CardTitle>
            <p className='text-sm text-gray-600'>{subtitle}</p>
          </div>
        </div>
        {badge && (
          <Badge variant={badgeVariant} className='text-xs'>
            {badge}
          </Badge>
        )}
      </div>

      <div className='flex items-center gap-6 text-sm text-gray-600'>
        <div className='flex items-center gap-1'>
          <Files className='w-4 h-4' />
          <span>{fileCount} files</span>
        </div>
        <div className='flex items-center gap-1'>
          <FolderOpen className='w-4 h-4' />
          <span>{folderCount} folders</span>
        </div>
        <div className='flex items-center gap-1'>
          <HardDrive className='w-4 h-4' />
          <span>{formatFileSize(totalSize)}</span>
        </div>
      </div>
    </CardHeader>
  )
);

PanelHeader.displayName = 'PanelHeader';

// =============================================================================
// MOCK WORKSPACE DATA
// =============================================================================

const MOCK_WORKSPACE_FILES = [
  {
    id: 'ws_file_1',
    name: 'Project Proposal Draft.docx',
    type: 'document',
    size: 2456789,
    modifiedAt: new Date('2024-01-15'),
    folderId: 'ws_folder_active',
  },
  {
    id: 'ws_file_2',
    name: 'Meeting Notes - Q1 Planning.md',
    type: 'document',
    size: 45123,
    modifiedAt: new Date('2024-01-14'),
    folderId: 'ws_folder_active',
  },
  {
    id: 'ws_file_3',
    name: 'Company Logo - Final.png',
    type: 'image',
    size: 892456,
    modifiedAt: new Date('2024-01-10'),
    folderId: 'ws_folder_assets',
  },
];

const MOCK_WORKSPACE_FOLDERS = [
  {
    id: 'ws_folder_active',
    name: 'Active Projects',
    color: '#3b82f6',
    fileCount: 2,
    description: 'Current project files and documents',
  },
  {
    id: 'ws_folder_assets',
    name: 'Design Assets',
    color: '#10b981',
    fileCount: 1,
    description: 'Logos, images, and design files',
  },
  {
    id: 'ws_folder_archive',
    name: 'Archive',
    color: '#6b7280',
    fileCount: 0,
    description: 'Completed and archived projects',
  },
];

// =============================================================================
// SIMPLIFIED FILE/FOLDER DISPLAY COMPONENTS FOR TWO-PANEL VIEW
// =============================================================================

const SimpleFileCard = memo(
  ({
    file,
    isSelected,
    onToggleSelect,
  }: {
    file: any;
    isSelected: boolean;
    onToggleSelect: (fileId: string) => void;
  }) => {
    const getFileIcon = (fileName: string) => {
      const ext = fileName.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'pdf':
          return '📄';
        case 'doc':
        case 'docx':
          return '📝';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
          return '🖼️';
        case 'mp4':
        case 'avi':
        case 'mov':
          return '🎬';
        case 'zip':
        case 'rar':
          return '📦';
        default:
          return '📄';
      }
    };

    return (
      <div
        className={cn(
          'p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50',
          isSelected && 'bg-blue-50 border-blue-300'
        )}
        onClick={() => onToggleSelect(file.id)}
      >
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={isSelected}
              onChange={() => onToggleSelect(file.id)}
              className='w-4 h-4'
              onClick={e => e.stopPropagation()}
            />
            <div className='text-2xl'>{getFileIcon(file.fileName)}</div>
          </div>
          <div className='flex-1'>
            <h4 className='font-medium text-gray-900 truncate'>
              {file.fileName}
            </h4>
            <p className='text-sm text-gray-600'>
              {formatFileSize(file.fileSize)} •{' '}
              {new Date(file.uploadedAt).toLocaleDateString()}
            </p>
            {file.uploaderName && (
              <p className='text-xs text-gray-500'>
                Uploaded by {file.uploaderName}
              </p>
            )}
          </div>
          <Button variant='ghost' size='sm'>
            <Download className='w-4 h-4' />
          </Button>
        </div>
      </div>
    );
  }
);

SimpleFileCard.displayName = 'SimpleFileCard';

const SimpleFolderCard = memo(
  ({
    folder,
    onNavigate,
  }: {
    folder: any;
    onNavigate: (folderId: string) => void;
  }) => (
    <div
      className='p-4 border rounded-lg hover:bg-gray-50 cursor-pointer'
      onClick={() => onNavigate(folder.id)}
    >
      <div className='flex items-center gap-3'>
        <div
          className='w-4 h-4 rounded-full'
          style={{ backgroundColor: folder.color }}
        />
        <div className='flex-1'>
          <h4 className='font-medium text-gray-900'>{folder.name}</h4>
          <p className='text-sm text-gray-600'>{folder.description}</p>
        </div>
        <Badge variant='outline' className='text-xs'>
          {folder.fileCount || 0} files
        </Badge>
      </div>
    </div>
  )
);

SimpleFolderCard.displayName = 'SimpleFolderCard';

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const TwoPanelFilesView = memo(() => {
  const { files, folders } = useFilesDataStore();
  const [selectedSharedItems, setSelectedSharedItems] = useState<Set<string>>(
    new Set()
  );
  const [dragOver, setDragOver] = useState<'shared' | 'workspace' | null>(null);

  // Calculate stats for shared files
  const sharedStats = {
    fileCount: files.length,
    folderCount: folders.length,
    totalSize: files.reduce((sum, file) => sum + file.fileSize, 0),
  };

  // Calculate stats for workspace files
  const workspaceStats = {
    fileCount: MOCK_WORKSPACE_FILES.length,
    folderCount: MOCK_WORKSPACE_FOLDERS.length,
    totalSize: MOCK_WORKSPACE_FILES.reduce((sum, file) => sum + file.size, 0),
  };

  // Handle file selection
  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedSharedItems);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedSharedItems(newSelection);
  };

  // Handle copy to workspace
  const copyToWorkspace = () => {
    if (selectedSharedItems.size === 0) return;

    // Here you would implement the actual copy logic
    console.log('Copying files to workspace:', Array.from(selectedSharedItems));

    // Reset selection
    setSelectedSharedItems(new Set());

    // Show success notification (you'd use your toast system)
    alert(`Copied ${selectedSharedItems.size} file(s) to workspace!`);
  };

  return (
    <div className='h-full flex flex-col gap-6 p-6'>
      {/* Header */}
      <div className='text-center'>
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>
          Files Management - Two Panel View
        </h1>
        <p className='text-gray-600'>
          Copy shared files from the left panel to your personal workspace on
          the right
        </p>
      </div>

      {/* Copy Controls */}
      {selectedSharedItems.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex items-center justify-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg'
        >
          <span className='text-sm font-medium text-blue-900'>
            {selectedSharedItems.size} file(s) selected
          </span>
          <Button
            onClick={copyToWorkspace}
            className='flex items-center gap-2'
            size='sm'
          >
            <Copy className='w-4 h-4' />
            Copy to Workspace
            <ArrowRight className='w-4 h-4' />
          </Button>
        </motion.div>
      )}

      {/* Two Panel Layout */}
      <div className='flex-1 grid grid-cols-2 gap-6 min-h-[600px]'>
        {/* LEFT PANEL - SHARED FILES */}
        <Card
          className={cn(
            'flex flex-col transition-all duration-200',
            dragOver === 'shared' && 'ring-2 ring-blue-500 bg-blue-50'
          )}
          onDragOver={e => {
            e.preventDefault();
            setDragOver('shared');
          }}
          onDragLeave={() => setDragOver(null)}
        >
          <PanelHeader
            title='Shared Files'
            icon={<Cloud className='w-6 h-6 text-blue-600' />}
            subtitle='Files uploaded via your share links'
            fileCount={sharedStats.fileCount}
            folderCount={sharedStats.folderCount}
            totalSize={sharedStats.totalSize}
            badge='From Share Links'
            badgeVariant='default'
          />

          <Separator />

          <CardContent className='flex-1 p-4 overflow-y-auto'>
            <div className='space-y-4'>
              {/* Folders */}
              {folders.map(folder => (
                <SimpleFolderCard
                  key={folder.id}
                  folder={folder}
                  onNavigate={folderId => {
                    // Handle folder navigation
                    console.log('Navigate to folder:', folderId);
                  }}
                />
              ))}

              {/* Files */}
              {files.map(file => (
                <SimpleFileCard
                  key={file.id}
                  file={file}
                  isSelected={selectedSharedItems.has(file.id)}
                  onToggleSelect={toggleFileSelection}
                />
              ))}

              {/* Empty State */}
              {files.length === 0 && folders.length === 0 && (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                  <Upload className='w-12 h-12 text-gray-400 mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>
                    No shared files yet
                  </h3>
                  <p className='text-gray-600 max-w-sm'>
                    Files uploaded via your share links will appear here
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT PANEL - WORKSPACE FILES */}
        <Card
          className={cn(
            'flex flex-col transition-all duration-200',
            dragOver === 'workspace' && 'ring-2 ring-green-500 bg-green-50'
          )}
          onDragOver={e => {
            e.preventDefault();
            setDragOver('workspace');
          }}
          onDragLeave={() => setDragOver(null)}
          onDrop={e => {
            e.preventDefault();
            setDragOver(null);
            // Handle drop logic here
          }}
        >
          <PanelHeader
            title='My Workspace'
            icon={<HardDrive className='w-6 h-6 text-green-600' />}
            subtitle='Your personal files and projects'
            fileCount={workspaceStats.fileCount}
            folderCount={workspaceStats.folderCount}
            totalSize={workspaceStats.totalSize}
            badge='Personal Storage'
            badgeVariant='secondary'
          />

          <Separator />

          <CardContent className='flex-1 p-4 overflow-y-auto'>
            <div className='space-y-4'>
              {/* Workspace Folders */}
              {MOCK_WORKSPACE_FOLDERS.map(folder => (
                <SimpleFolderCard
                  key={folder.id}
                  folder={folder}
                  onNavigate={folderId => {
                    // Handle workspace folder navigation
                    console.log('Navigate to workspace folder:', folderId);
                  }}
                />
              ))}

              {/* Workspace Files */}
              {MOCK_WORKSPACE_FILES.map(file => (
                <div
                  key={file.id}
                  className='p-4 border rounded-lg hover:bg-gray-50 cursor-pointer'
                >
                  <div className='flex items-center gap-3'>
                    <div className='text-2xl'>
                      {file.type === 'document'
                        ? '📄'
                        : file.type === 'image'
                          ? '🖼️'
                          : '📁'}
                    </div>
                    <div className='flex-1'>
                      <h4 className='font-medium text-gray-900'>{file.name}</h4>
                      <p className='text-sm text-gray-600'>
                        {formatFileSize(file.size)} •{' '}
                        {file.modifiedAt.toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant='ghost' size='sm'>
                      <Download className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Drop Zone Indicator */}
              {selectedSharedItems.size > 0 && (
                <div
                  className={cn(
                    'border-2 border-dashed border-green-300 rounded-lg p-8 text-center transition-all',
                    dragOver === 'workspace' && 'border-green-500 bg-green-50'
                  )}
                >
                  <ArrowRight className='w-8 h-8 text-green-600 mx-auto mb-2' />
                  <p className='text-green-700 font-medium'>
                    Drop here to copy {selectedSharedItems.size} file(s) to
                    workspace
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

TwoPanelFilesView.displayName = 'TwoPanelFilesView';

export default TwoPanelFilesView;
