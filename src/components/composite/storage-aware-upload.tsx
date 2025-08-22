// =============================================================================
// STORAGE-AWARE UPLOAD COMPONENT - Upload with Real-time Storage Validation
// =============================================================================
// 🎯 Demonstrates the new storage tracking system in action

'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  useStorageState,
  useUploadWithTracking,
  useStorageWarnings,
} from '@/lib/hooks/use-storage-tracking';
import { useUser } from '@clerk/nextjs';
import { formatBytes } from '@/lib/services/storage';
import { Progress } from '@/components/ui/shadcn/progress';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/shadcn/alert';
import { Badge } from '@/components/ui/shadcn/badge';
import {
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileIcon,
  HardDrive,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface StorageAwareUploadProps {
  className?: string;
  planKey?: string;
  onUploadComplete?: (fileId: string) => void;
  metadata?: {
    linkId?: string;
    batchId?: string;
    workspaceId?: string;
    folderId?: string;
  };
  maxFiles?: number;
  acceptedFileTypes?: string[];
}

export const StorageAwareUpload: React.FC<StorageAwareUploadProps> = ({
  className = '',
  planKey = 'free',
  onUploadComplete,
  metadata = {},
  maxFiles = 10,
  acceptedFileTypes,
}) => {
  const { user } = useUser();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});

  // Get storage state for validation
  const totalFileSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
  const { dashboard, validation, isLoading } = useStorageState(
    totalFileSize,
    planKey
  );
  const warnings = useStorageWarnings(planKey);
  const uploadMutation = useUploadWithTracking(planKey);

  // Dropzone configuration
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Validate total file count
      if (selectedFiles.length + acceptedFiles.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Add to selected files
      setSelectedFiles(prev => [...prev, ...acceptedFiles]);
    },
    [selectedFiles.length, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      maxFiles: maxFiles - selectedFiles.length,
      accept: acceptedFileTypes
        ? acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {})
        : undefined,
      disabled: !warnings.canUpload || uploadMutation.isPending,
    });

  // Remove file from selection
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload all selected files
  const handleUpload = async () => {
    if (!user || selectedFiles.length === 0) return;

    try {
      for (const [index, file] of selectedFiles.entries()) {
        const fileKey = `${file.name}-${Date.now()}`;
        setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }));

        // Generate storage path
        const timestamp = Date.now();
        const storagePath = `${user.id}/${timestamp}/${file.name}`;

        // Upload with tracking
        const result = await uploadMutation.mutateAsync({
          file,
          storagePath,
          metadata,
        });

        if (result.success) {
          setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }));
          onUploadComplete?.(result.fileId!);
          toast.success(`${file.name} uploaded successfully`);
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      }

      // Clear selected files after successful uploads
      setSelectedFiles([]);
      setUploadProgress({});
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className='p-6 text-center'>
          <p className='text-muted-foreground'>
            Please sign in to upload files.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className='p-6'>
          <div className='animate-pulse space-y-4'>
            <div className='h-4 bg-muted rounded w-1/4'></div>
            <div className='h-32 bg-muted rounded'></div>
            <div className='h-4 bg-muted rounded w-1/2'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Storage Warning */}
      {warnings.warningLevel !== 'normal' && (
        <Alert
          variant={
            warnings.warningLevel === 'critical' ? 'destructive' : 'default'
          }
        >
          <AlertTriangle className='h-4 w-4' />
          <AlertTitle>
            Storage {warnings.warningLevel === 'critical' ? 'Full' : 'Warning'}
          </AlertTitle>
          <AlertDescription>
            {warnings.warningLevel === 'critical'
              ? 'Cannot upload files - storage limit reached. Please upgrade your plan or delete files.'
              : "You're approaching your storage limit. Consider upgrading your plan."}
          </AlertDescription>
        </Alert>
      )}

      {/* Storage Status */}
      {dashboard && (
        <Card>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <HardDrive className='h-4 w-4' />
                <span className='font-medium'>Storage Status</span>
              </div>
              <Badge
                variant={
                  warnings.warningLevel === 'normal' ? 'default' : 'warning'
                }
              >
                {dashboard.usagePercentage.toFixed(1)}% used
              </Badge>
            </div>
          </CardHeader>
          <CardContent className='pt-0'>
            <Progress value={dashboard.usagePercentage} className='h-2 mb-2' />
            <div className='flex justify-between text-xs text-muted-foreground'>
              <span>{formatBytes(dashboard.storageUsedBytes)} used</span>
              <span>{formatBytes(dashboard.remainingBytes)} remaining</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Validation */}
      {validation && totalFileSize > 0 && (
        <Alert variant={validation.canUpload ? 'default' : 'destructive'}>
          {validation.canUpload ? (
            <CheckCircle2 className='h-4 w-4' />
          ) : (
            <XCircle className='h-4 w-4' />
          )}
          <AlertTitle>
            {validation.canUpload ? 'Upload Ready' : 'Cannot Upload'}
          </AlertTitle>
          <AlertDescription>
            {validation.canUpload
              ? `Selected files (${formatBytes(totalFileSize)}) can be uploaded. 
               New total: ${formatBytes(validation.newTotal)}`
              : validation.reason || 'Upload would exceed storage limit'}
          </AlertDescription>
        </Alert>
      )}

      {/* File Drop Zone */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Upload className='h-5 w-5' />
            Upload Files
          </CardTitle>
          <CardDescription>
            Drag and drop files here or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${!warnings.canUpload || uploadMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <Upload className='h-8 w-8 mx-auto mb-4 text-muted-foreground' />

            {isDragActive ? (
              <p className='text-primary'>Drop files here...</p>
            ) : (
              <div>
                <p className='font-medium'>Click to upload or drag and drop</p>
                <p className='text-sm text-muted-foreground mt-1'>
                  Maximum {maxFiles} files, up to{' '}
                  {formatBytes(dashboard?.storageLimitBytes || 0)} total
                </p>
              </div>
            )}
          </div>

          {/* File Rejections */}
          {fileRejections.length > 0 && (
            <div className='mt-4 space-y-2'>
              {fileRejections.map(({ file, errors }) => (
                <Alert key={file.name} variant='destructive'>
                  <XCircle className='h-4 w-4' />
                  <AlertTitle>{file.name}</AlertTitle>
                  <AlertDescription>
                    {errors.map(e => e.message).join(', ')}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className='mt-4 space-y-2'>
              <h4 className='font-medium'>
                Selected Files ({selectedFiles.length})
              </h4>
              {selectedFiles.map((file, index) => {
                const fileKey = `${file.name}-${Date.now()}`;
                const progress = uploadProgress[fileKey] || 0;

                return (
                  <div
                    key={index}
                    className='flex items-center justify-between p-3 border rounded-lg'
                  >
                    <div className='flex items-center gap-2'>
                      <FileIcon className='h-4 w-4' />
                      <div>
                        <p className='font-medium'>{file.name}</p>
                        <p className='text-xs text-muted-foreground'>
                          {formatBytes(file.size)}
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      {progress > 0 && progress < 100 && (
                        <div className='w-20'>
                          <Progress value={progress} className='h-1' />
                        </div>
                      )}

                      {progress === 100 ? (
                        <CheckCircle2 className='h-4 w-4 text-green-500' />
                      ) : (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => removeFile(index)}
                          disabled={uploadMutation.isPending}
                        >
                          <XCircle className='h-4 w-4' />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upload Actions */}
          {selectedFiles.length > 0 && (
            <div className='mt-4 flex gap-2'>
              <Button
                onClick={handleUpload}
                disabled={
                  !warnings.canUpload ||
                  !validation?.canUpload ||
                  uploadMutation.isPending ||
                  selectedFiles.length === 0
                }
                className='flex-1'
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className='h-4 w-4 mr-2' />
                    Upload {selectedFiles.length} File
                    {selectedFiles.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>

              <Button
                variant='outline'
                onClick={() => setSelectedFiles([])}
                disabled={uploadMutation.isPending}
              >
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
