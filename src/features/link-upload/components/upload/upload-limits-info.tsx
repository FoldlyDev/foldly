'use client';

import { Info, Upload, FileX, Shield } from 'lucide-react';
import type { LinkWithOwner } from '../../types';

interface UploadLimitsInfoProps {
  linkData: LinkWithOwner;
}

export function UploadLimitsInfo({ linkData }: UploadLimitsInfoProps) {
  const maxFileSize = Math.min(linkData.maxFileSize, linkData.subscription.maxFileSize);
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-muted/30 border rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="space-y-3 flex-1">
          <h4 className="font-medium text-sm">Upload Limits</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {/* File Size Limit */}
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="font-medium">Max file size: </span>
                <span className="text-muted-foreground">{formatSize(maxFileSize)}</span>
              </div>
            </div>

            {/* File Count Limit */}
            <div className="flex items-center gap-2">
              <FileX className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="font-medium">Max files: </span>
                <span className="text-muted-foreground">{linkData.maxFiles} per session</span>
              </div>
            </div>

            {/* Allowed File Types */}
            {linkData.allowedFileTypes && linkData.allowedFileTypes.length > 0 && (
              <div className="sm:col-span-2 flex items-start gap-2">
                <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-medium block">Allowed types: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(linkData.allowedFileTypes as string[]).map((type) => (
                      <span 
                        key={type}
                        className="px-2 py-1 text-xs bg-muted rounded-md font-mono"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}