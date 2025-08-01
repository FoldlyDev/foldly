'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/core/shadcn/button';
import { cn } from '@/lib/utils';
import { useUploadStore } from '../../stores/upload-store';
import { useUploadFiles } from '../../hooks/use-upload-files';
import { validateFiles } from '../../lib/utils/validation';
import { formatBytes } from '../../lib/utils/format';
import type { LinkWithOwner } from '../../types';

interface UploadDropzoneProps {
  link: LinkWithOwner;
  disabled?: boolean;
  compact?: boolean;
}

export function UploadDropzone({ link, disabled, compact }: UploadDropzoneProps) {
  const { addFiles, currentBatch, removeFile } = useUploadStore();
  const { uploadFiles } = useUploadFiles();
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null);

      // Validate files
      const validation = await validateFiles(acceptedFiles, link);
      if (!validation.valid) {
        setError(validation.error || 'Invalid files');
        return;
      }

      // Add files to batch
      addFiles(acceptedFiles);
    },
    [link, addFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    accept: link.allowed_file_types 
      ? (link.allowed_file_types as string[]).reduce((acc, type) => {
          acc[type] = [];
          return acc;
        }, {} as Record<string, string[]>)
      : undefined,
    maxSize: Math.min(link.max_file_size, link.subscription.maxFileSize),
    maxFiles: link.max_files,
  });

  const handleUpload = async () => {
    if (!currentBatch) return;
    setError(null);
    await uploadFiles(link);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-colors cursor-pointer',
          'hover:border-primary/50 hover:bg-muted/50',
          isDragActive && 'border-primary bg-primary/10',
          disabled && 'opacity-50 cursor-not-allowed',
          compact ? 'p-6' : 'p-8',
          error && 'border-destructive'
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <Upload className={cn('text-muted-foreground', compact ? 'h-8 w-8' : 'h-12 w-12')} />
          
          <div>
            <p className={cn('font-medium', compact ? 'text-sm' : 'text-base')}>
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
              or click to browse
            </p>
          </div>

          {!compact && (
            <p className="text-xs text-muted-foreground">
              Max file size: {formatBytes(Math.min(link.max_file_size, link.subscription.maxFileSize))}
              {link.allowed_file_types && (
                <> • Allowed: {(link.allowed_file_types as string[]).join(', ')}</>
              )}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {currentBatch && currentBatch.files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            Selected Files ({currentBatch.files.length})
          </h4>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {currentBatch.files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2 rounded-md bg-muted"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="text-sm truncate">{file.file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({formatBytes(file.file.size)})
                  </span>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            onClick={handleUpload}
            disabled={disabled}
            className="w-full"
          >
            Upload {currentBatch.files.length} file{currentBatch.files.length > 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  );
}