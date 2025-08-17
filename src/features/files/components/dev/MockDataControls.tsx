// Mock Data Controls - Development Component
// Allows easy testing of populated vs empty states in the files feature

'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Badge } from '@/components/ui/shadcn/badge';
import { Separator } from '@/components/ui/shadcn/separator';
import { FileText, Folder, Database, Trash2, RefreshCw } from 'lucide-react';
import { useFilesDataStore } from '../../store/files-data-store';
import {
  MOCK_FILES,
  MOCK_FOLDERS,
  formatFileSize,
} from '../../utils/enhanced-mock-data';

// =============================================================================
// COMPONENT IMPLEMENTATION
// =============================================================================

const MockDataControls = memo(() => {
  const {
    files,
    folders,
    workspaceData,
    loadMockData,
    clearAllData,
    resetToMockData,
  } = useFilesDataStore();

  const totalFiles = files.length;
  const totalFolders = folders.length;
  const totalSize = files.reduce((sum, file) => sum + file.fileSize, 0);
  const isEmpty = totalFiles === 0 && totalFolders === 0;

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Database className='w-5 h-5' />
          Files Feature Mock Data Controls
        </CardTitle>
        <CardDescription>
          Test the files feature with realistic shared files and folders data
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Current State */}
        <div className='space-y-3'>
          <h3 className='text-sm font-medium text-gray-900'>Current State</h3>
          <div className='grid grid-cols-3 gap-4'>
            <div className='flex items-center gap-2 p-3 bg-blue-50 rounded-lg'>
              <Folder className='w-4 h-4 text-blue-600' />
              <div>
                <div className='text-lg font-semibold text-blue-900'>
                  {totalFolders}
                </div>
                <div className='text-xs text-blue-700'>Folders</div>
              </div>
            </div>

            <div className='flex items-center gap-2 p-3 bg-green-50 rounded-lg'>
              <FileText className='w-4 h-4 text-green-600' />
              <div>
                <div className='text-lg font-semibold text-green-900'>
                  {totalFiles}
                </div>
                <div className='text-xs text-green-700'>Files</div>
              </div>
            </div>

            <div className='flex items-center gap-2 p-3 bg-purple-50 rounded-lg'>
              <Database className='w-4 h-4 text-purple-600' />
              <div>
                <div className='text-lg font-semibold text-purple-900'>
                  {formatFileSize(totalSize)}
                </div>
                <div className='text-xs text-purple-700'>Total Size</div>
              </div>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Badge variant={isEmpty ? 'destructive' : 'default'}>
              {isEmpty ? 'Empty State' : 'Populated State'}
            </Badge>
            {workspaceData && (
              <Badge variant='secondary'>Workspace Data Loaded</Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Mock Data Preview */}
        <div className='space-y-3'>
          <h3 className='text-sm font-medium text-gray-900'>
            Available Mock Data
          </h3>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div className='space-y-2'>
              <div className='font-medium text-gray-700'>
                📁 Mock Folders ({MOCK_FOLDERS.length})
              </div>
              <ul className='space-y-1 text-gray-600'>
                {MOCK_FOLDERS.map(folder => (
                  <li key={folder.id} className='flex items-center gap-2'>
                    <div
                      className='w-3 h-3 rounded-full'
                      style={{ backgroundColor: folder.color }}
                    />
                    <span className='truncate'>{folder.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className='space-y-2'>
              <div className='font-medium text-gray-700'>
                📄 Mock Files ({MOCK_FILES.length})
              </div>
              <ul className='space-y-1 text-gray-600'>
                {MOCK_FILES.slice(0, 6).map(file => (
                  <li key={file.id} className='flex items-center gap-2'>
                    <span className='text-xs'>
                      {formatFileSize(file.fileSize)}
                    </span>
                    <span className='truncate text-xs'>{file.fileName}</span>
                  </li>
                ))}
                {MOCK_FILES.length > 6 && (
                  <li className='text-xs text-gray-500'>
                    +{MOCK_FILES.length - 6} more files...
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <Separator />

        {/* Controls */}
        <div className='space-y-3'>
          <h3 className='text-sm font-medium text-gray-900'>Controls</h3>
          <div className='flex flex-wrap gap-2'>
            <Button
              onClick={loadMockData}
              className='flex items-center gap-2'
              variant='default'
              size='sm'
            >
              <Database className='w-4 h-4' />
              Load Mock Data
            </Button>

            <Button
              onClick={clearAllData}
              className='flex items-center gap-2'
              variant='outline'
              size='sm'
            >
              <Trash2 className='w-4 h-4' />
              Clear All Data
            </Button>

            <Button
              onClick={resetToMockData}
              className='flex items-center gap-2'
              variant='secondary'
              size='sm'
            >
              <RefreshCw className='w-4 h-4' />
              Reset to Mock
            </Button>
          </div>

          <div className='text-xs text-gray-500 bg-gray-50 p-3 rounded-lg'>
            <strong>Usage:</strong> Use these controls to test different states
            of the files feature. The mock data includes realistic files shared
            via upload links with proper folder organization, file metadata, and
            user information.
          </div>
        </div>

        {/* File Types Breakdown */}
        {!isEmpty && (
          <>
            <Separator />
            <div className='space-y-3'>
              <h3 className='text-sm font-medium text-gray-900'>
                Files by Folder
              </h3>
              <div className='space-y-2'>
                {folders.map(folder => {
                  const folderFiles = files.filter(
                    f => f.folderId === folder.id
                  );
                  return (
                    <div
                      key={folder.id}
                      className='flex items-center justify-between p-2 bg-gray-50 rounded'
                    >
                      <div className='flex items-center gap-2'>
                        <div
                          className='w-3 h-3 rounded-full'
                          style={{ backgroundColor: folder.color }}
                        />
                        <span className='text-sm font-medium'>
                          {folder.name}
                        </span>
                      </div>
                      <Badge variant='outline' className='text-xs'>
                        {folderFiles.length} files
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});

MockDataControls.displayName = 'MockDataControls';

export default MockDataControls;
