'use client';

import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/core/shadcn/button';
import { 
  CloudUpload, 
  FileIcon, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LinkWithOwner } from '../../types';

interface FileWithProgress {
  file: File;
  id: string;
  progress: number;
  status: 'staged' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

interface LinkUploadAreaProps {
  onFileSelect: (files: FileList) => void;
  isDragging: boolean;
  isUploading: boolean;
  linkData: LinkWithOwner;
  formatSize: (bytes: number) => string;
  files: FileWithProgress[];
  onRemoveFile: (fileId: string) => void;
}

export function LinkUploadArea({
  onFileSelect,
  isDragging,
  isUploading,
  linkData,
  formatSize,
  files,
  onRemoveFile,
}: LinkUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brandColor = linkData.brandEnabled && linkData.brandColor ? linkData.brandColor : '#3b82f6';

  const handleClick = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files);
      // Reset input so same files can be selected again
      e.target.value = '';
    }
  };

  const getStatusIcon = (file: FileWithProgress) => {
    switch (file.status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'staged':
        return <FileIcon className="w-4 h-4 text-blue-600" />;
      default:
        return <FileIcon className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (file: FileWithProgress) => {
    switch (file.status) {
      case 'uploading':
        return 'border-blue-200 bg-blue-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      case 'staged':
        return 'border-blue-200 bg-blue-50/50';
      default:
        return 'border-muted bg-card';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Drop Zone */}
      <div
        onClick={handleClick}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer',
          isDragging
            ? 'border-blue-400 bg-blue-50 scale-[1.02]'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30',
          isUploading && 'cursor-not-allowed opacity-60'
        )}
        style={{
          borderColor: isDragging && linkData.brandEnabled ? `${brandColor}66` : undefined,
          backgroundColor: isDragging && linkData.brandEnabled ? `${brandColor}0d` : undefined,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="sr-only"
          disabled={isUploading}
          accept={linkData.allowedFileTypes?.length ? (linkData.allowedFileTypes as string[]).join(',') : undefined}
        />

        <div className="space-y-4">
          <div 
            className="mx-auto w-12 h-12 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: linkData.brandEnabled ? `${brandColor}1a` : 'rgb(59 130 246 / 0.1)'
            }}
          >
            <CloudUpload 
              className="w-6 h-6"
              style={{ color: linkData.brandEnabled ? brandColor : 'rgb(59 130 246)' }}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {isDragging ? 'Drop files here' : 'Choose files to upload'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isDragging 
                ? `Release to add ${linkData.allowedFileTypes?.length ? 'allowed' : ''} files`
                : `Drag and drop files here, or click to browse`
              }
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            className="pointer-events-none"
            style={{
              borderColor: linkData.brandEnabled ? `${brandColor}33` : undefined,
              color: linkData.brandEnabled ? brandColor : undefined,
            }}
          >
            Select Files
          </Button>
        </div>
      </div>

      {/* Selected Files List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            <h4 className="font-medium text-sm">
              Staged files ({files.length})
            </h4>
            
            <div className="max-h-60 overflow-y-auto space-y-2">
              {files.map((fileData) => (
                <motion.div
                  key={fileData.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={cn(
                    'flex items-center gap-3 p-3 border rounded-lg',
                    getStatusColor(fileData)
                  )}
                >
                  {getStatusIcon(fileData)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {fileData.file.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatSize(fileData.file.size)}</span>
                      <span>•</span>
                      <span className="capitalize">{fileData.status}</span>
                      {fileData.error && (
                        <>
                          <span>•</span>
                          <span className="text-red-600">{fileData.error}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {fileData.status === 'staged' && !isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFile(fileData.id);
                      }}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}