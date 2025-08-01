'use client';

import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/core/shadcn/progress';
import { cn } from '@/lib/utils';
import { formatBytes } from '../../lib/utils/format';
import type { UploadBatch } from '../../types';

interface UploadProgressProps {
  batch: UploadBatch;
  compact?: boolean;
}

export function UploadProgress({ batch, compact }: UploadProgressProps) {
  const overallProgress = batch.totalSize > 0 
    ? (batch.processedSize / batch.totalSize) * 100 
    : 0;

  const completedFiles = batch.files.filter(f => f.status === 'completed').length;
  const failedFiles = batch.files.filter(f => f.status === 'failed').length;

  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className={cn('font-medium', compact ? 'text-sm' : 'text-base')}>
            Upload Progress
          </h3>
          <span className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
            {completedFiles} of {batch.files.length} files
          </span>
        </div>
        
        <Progress value={overallProgress} className="h-2" />
        
        <div className="flex justify-between mt-1">
          <span className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
            {formatBytes(batch.processedSize)} / {formatBytes(batch.totalSize)}
          </span>
          <span className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
            {Math.round(overallProgress)}%
          </span>
        </div>
      </div>

      {!compact && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {batch.files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 rounded-md bg-muted/50"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {file.status === 'completed' && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {file.status === 'failed' && (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  {(file.status === 'uploading' || file.status === 'processing') && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                  {file.status === 'pending' && (
                    <div className="h-4 w-4 rounded-full bg-muted-foreground/20" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.file.name}</p>
                  {file.error && (
                    <p className="text-xs text-destructive">{file.error}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {file.status === 'uploading' && (
                  <span className="text-xs text-muted-foreground">
                    {file.progress}%
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatBytes(file.file.size)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {batch.status === 'completed' && (
        <div className={cn(
          'p-3 rounded-md bg-green-500/10 text-green-700 dark:text-green-400',
          compact ? 'text-xs' : 'text-sm'
        )}>
          All files uploaded successfully!
        </div>
      )}

      {batch.status === 'failed' && failedFiles > 0 && (
        <div className={cn(
          'p-3 rounded-md bg-destructive/10 text-destructive',
          compact ? 'text-xs' : 'text-sm'
        )}>
          {failedFiles} file{failedFiles > 1 ? 's' : ''} failed to upload
        </div>
      )}
    </div>
  );
}