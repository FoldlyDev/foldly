/**
 * Upload Notification Content Component - Uses Next.js navigation
 */

'use client';

import { useRouter } from 'next/navigation';
import { FileUp, FolderUp, XIcon, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface UploadNotificationContentProps {
  toastId: string | number;
  linkId: string;
  linkTitle: string;
  uploaderName: string;
  fileCount: number;
  folderCount: number;
}

export function UploadNotificationContent({
  toastId,
  linkId,
  linkTitle,
  uploaderName,
  fileCount,
  folderCount,
}: UploadNotificationContentProps) {
  const router = useRouter();
  
  // Format the message with proper grammar
  const items = [];
  if (fileCount > 0) {
    items.push(`${fileCount} ${fileCount === 1 ? 'file' : 'files'}`);
  }
  if (folderCount > 0) {
    items.push(`${folderCount} ${folderCount === 1 ? 'folder' : 'folders'}`);
  }
  
  // Create user-friendly description
  const title = `New upload to: ${linkTitle}`;
  let description = '';
  
  if (items.length > 0) {
    description = `${uploaderName} uploaded ${items.join(' and ')}`;
  } else {
    // Fallback if somehow no counts are provided
    description = `${uploaderName} uploaded content`;
  }
  
  const handleViewUploads = () => {
    // Use Next.js router for client-side navigation
    router.push(`/dashboard/files?linkId=${linkId}&highlight=true`);
    toast.dismiss(toastId);
  };
  
  return (
    <div className="bg-background text-foreground w-full rounded-lg border border-border px-4 py-3 shadow-lg sm:w-[var(--width)] animate-in slide-in-from-bottom-2">
      <div className="flex gap-3">
        <div className="flex grow gap-3">
          {/* Icon based on content type */}
          {fileCount > 0 ? (
            <FileUp
              className="mt-0.5 shrink-0 text-blue-500"
              size={18}
              aria-hidden="true"
            />
          ) : (
            <FolderUp
              className="mt-0.5 shrink-0 text-blue-500"
              size={18}
              aria-hidden="true"
            />
          )}
          
          {/* Content */}
          <div className="flex grow flex-col gap-1">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
            
            {/* Action buttons */}
            <div className="mt-2 flex items-center gap-2">
              <button
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                onClick={handleViewUploads}
              >
                View uploads
                <ExternalLink className="size-3" />
              </button>
              <span className="text-xs text-muted-foreground">·</span>
              <button
                className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
                onClick={() => toast.dismiss(toastId)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
        
        {/* Close button */}
        <button
          className="group -my-1.5 -me-2 size-8 shrink-0 p-0 rounded-md hover:bg-accent transition-colors"
          onClick={() => toast.dismiss(toastId)}
          aria-label="Dismiss notification"
        >
          <XIcon
            size={16}
            className="opacity-60 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}

/**
 * File Upload Progress Notification Content
 */
interface FileUploadProgressProps {
  toastId: string | number;
  fileName: string;
  fileSize: number;
  progress: number;
  status?: 'uploading' | 'success' | 'error';
}

export function FileUploadProgressContent({
  toastId,
  fileName,
  fileSize,
  progress,
  status = 'uploading',
}: FileUploadProgressProps) {
  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="bg-background text-foreground w-full rounded-lg border border-border px-4 py-3 shadow-lg sm:w-[var(--width)] animate-in slide-in-from-bottom-2">
      <div className="flex gap-3">
        <div className="flex grow gap-3">
          <FileUp className="mt-0.5 shrink-0 text-blue-500" size={18} aria-hidden="true" />
          
          <div className="flex grow flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Uploading {fileName}</p>
              <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <p className="text-xs text-muted-foreground">
              {formatFileSize(fileSize)} • {Math.round(progress)}% complete
            </p>
          </div>
        </div>
        
        <button
          className="group -my-1.5 -me-2 size-8 shrink-0 p-0 rounded-md hover:bg-accent transition-colors"
          onClick={() => toast.dismiss(toastId)}
          aria-label="Dismiss notification"
        >
          <XIcon size={16} className="opacity-60 transition-opacity group-hover:opacity-100" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/**
 * Batch Upload Notification Content
 */
interface BatchUploadNotificationContentProps {
  toastId: string | number;
  linkId: string;
  linkTitle: string;
  totalCount: number;
}

export function BatchUploadNotificationContent({
  toastId,
  linkId,
  linkTitle,
  totalCount,
}: BatchUploadNotificationContentProps) {
  const router = useRouter();
  
  const title = `${totalCount} new uploads to ${linkTitle}`;
  
  const handleViewAll = () => {
    router.push(`/dashboard/files?linkId=${linkId}&highlight=true`);
    toast.dismiss(toastId);
  };
  
  return (
    <div className="bg-background text-foreground w-full rounded-lg border border-border px-4 py-3 shadow-lg sm:w-[var(--width)] animate-in slide-in-from-bottom-2">
      <div className="flex gap-3">
        <div className="flex grow gap-3">
          <div className="relative">
            <FileUp className="text-blue-500" size={18} />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white">
              {totalCount}
            </span>
          </div>
          
          <div className="flex grow flex-col gap-1">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">Click to view all uploads</p>
            
            <div className="mt-2 flex items-center gap-2">
              <button
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                onClick={handleViewAll}
              >
                View all
                <ExternalLink className="size-3" />
              </button>
              <span className="text-xs text-muted-foreground">·</span>
              <button
                className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
                onClick={() => toast.dismiss(toastId)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
        
        <button
          className="group -my-1.5 -me-2 size-8 shrink-0 p-0 rounded-md hover:bg-accent transition-colors"
          onClick={() => toast.dismiss(toastId)}
          aria-label="Dismiss notification"
        >
          <XIcon
            size={16}
            className="opacity-60 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}