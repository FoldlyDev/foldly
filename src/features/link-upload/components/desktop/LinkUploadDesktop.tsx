'use client';

import { Card } from '@/components/ui/core/shadcn/card';
import { UploadDropzone } from '../shared/UploadDropzone';
import { UploadProgress } from '../shared/UploadProgress';
import { StorageIndicator } from '../shared/StorageIndicator';
import { PublicFileTree } from '../tree/PublicFileTree';
import { LinkHeader } from '../shared/LinkHeader';
import { useUploadStore } from '../../stores/upload-store';
import type { LinkWithOwner } from '../../types';

interface LinkUploadDesktopProps {
  linkData: LinkWithOwner;
}

export function LinkUploadDesktop({ linkData }: LinkUploadDesktopProps) {
  const { currentBatch, isUploading } = useUploadStore();

  return (
    <div className="min-h-screen bg-background">
      <LinkHeader link={linkData} />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">
                Upload Files to {linkData.title}
              </h2>
              
              {linkData.description && (
                <p className="text-muted-foreground mb-6">
                  {linkData.description}
                </p>
              )}

              <UploadDropzone
                link={linkData}
                disabled={isUploading}
              />
            </Card>

            {currentBatch && (
              <Card className="p-6">
                <UploadProgress batch={currentBatch} />
              </Card>
            )}

            {linkData.is_public && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Previously Uploaded Files
                </h3>
                <PublicFileTree linkId={linkData.id} />
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Storage Status</h3>
              <StorageIndicator
                used={linkData.owner.storage_used}
                limit={linkData.subscription.storageLimit}
              />
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Upload Limits</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max file size</span>
                  <span className="font-medium">
                    {Math.min(
                      linkData.max_file_size / (1024 * 1024),
                      linkData.subscription.maxFileSize / (1024 * 1024)
                    )} MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max files</span>
                  <span className="font-medium">{linkData.max_files}</span>
                </div>
                {linkData.allowed_file_types && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Allowed types</span>
                    <span className="font-medium">
                      {(linkData.allowed_file_types as string[]).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {linkData.expires_at && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-2">Link Expiry</h3>
                <p className="text-sm text-muted-foreground">
                  This link will expire on{' '}
                  {new Date(linkData.expires_at).toLocaleDateString()}
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}