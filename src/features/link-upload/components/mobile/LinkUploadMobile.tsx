'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/core/shadcn/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/core/shadcn/tabs';
import { UploadDropzone } from '../shared/UploadDropzone';
import { UploadProgress } from '../shared/UploadProgress';
import { StorageIndicator } from '../shared/StorageIndicator';
import { PublicFileTree } from '../tree/PublicFileTree';
import { LinkHeader } from '../shared/LinkHeader';
import { useUploadStore } from '../../stores/upload-store';
import type { LinkWithOwner } from '../../types';

interface LinkUploadMobileProps {
  linkData: LinkWithOwner;
}

export function LinkUploadMobile({ linkData }: LinkUploadMobileProps) {
  const { currentBatch, isUploading } = useUploadStore();
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <div className="min-h-screen bg-background">
      <LinkHeader link={linkData} />
      
      <div className="container mx-auto px-4 py-6 max-w-md">
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-3">
            {linkData.title}
          </h2>
          
          {linkData.description && (
            <p className="text-sm text-muted-foreground mb-4">
              {linkData.description}
            </p>
          )}

          <div className="mb-4">
            <StorageIndicator
              used={linkData.owner.storage_used}
              limit={linkData.subscription.storageLimit}
              compact
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              {linkData.is_public && (
                <TabsTrigger value="files">Files</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="upload" className="mt-4 space-y-4">
              <UploadDropzone
                link={linkData}
                disabled={isUploading}
                compact
              />

              {currentBatch && (
                <div className="mt-4">
                  <UploadProgress batch={currentBatch} compact />
                </div>
              )}

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Upload Limits</h4>
                <div className="space-y-2 text-xs">
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
                </div>
              </div>
            </TabsContent>

            {linkData.is_public && (
              <TabsContent value="files" className="mt-4">
                <PublicFileTree linkId={linkData.id} compact />
              </TabsContent>
            )}
          </Tabs>
        </Card>
      </div>
    </div>
  );
}