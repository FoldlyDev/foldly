'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs';
import { Button } from '@/components/ui/shadcn/button';
import { CloudStorageConnector } from '@/features/cloud-storage/components/cloud-storage-connector';
import { useCloudStorage } from '@/features/cloud-storage/hooks/use-cloud-storage';
import { Cloud, FolderOpen, Upload, Download, RefreshCw } from 'lucide-react';
import { ContentLoader } from '@/components/feedback';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import { formatFileSize } from '@/features/cloud-storage/lib/utils';

export function CloudStorageSection() {
  const [activeProvider, setActiveProvider] = useState<'google-drive' | 'onedrive'>('google-drive');

  const googleDrive = useCloudStorage({ provider: 'google-drive', autoConnect: true });
  const oneDrive = useCloudStorage({ provider: 'onedrive', autoConnect: true });

  const activeStorage = activeProvider === 'google-drive' ? googleDrive : oneDrive;

  // Fetch files when provider is connected and selected
  useEffect(() => {
    if (activeStorage.isConnected && !activeStorage.isLoadingFiles && activeStorage.files.length === 0) {
      activeStorage.listFiles();
    }
  }, [activeProvider, activeStorage.isConnected]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            <CardTitle>Cloud Storage</CardTitle>
          </div>
          {activeStorage.isConnected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => activeStorage.listFiles()}
              disabled={activeStorage.isLoadingFiles}
            >
              <RefreshCw className={`h-4 w-4 ${activeStorage.isLoadingFiles ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
        <CardDescription>
          Connect and manage your cloud storage providers
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeProvider} onValueChange={(v: string) => setActiveProvider(v as 'google-drive' | 'onedrive')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="google-drive" className="flex items-center gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.71 3.5L1.15 15l3.43 6h11.55l3.43-6L13 3.5z"/>
              </svg>
              Google Drive
            </TabsTrigger>
            <TabsTrigger value="onedrive" className="flex items-center gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.5 9.5l5 5h-14l5-5 2-3 2 3z"/>
              </svg>
              OneDrive
            </TabsTrigger>
          </TabsList>

          <TabsContent value="google-drive" className="mt-4">
            <CloudStorageProviderContent
              provider="google-drive"
              storage={googleDrive}
            />
          </TabsContent>

          <TabsContent value="onedrive" className="mt-4">
            <CloudStorageProviderContent
              provider="onedrive"
              storage={oneDrive}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function CloudStorageProviderContent({
  provider,
  storage
}: {
  provider: 'google-drive' | 'onedrive';
  storage: ReturnType<typeof useCloudStorage>;
}) {
  if (!storage.isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Connect your {provider === 'google-drive' ? 'Google Drive' : 'OneDrive'} account to access your files
          </p>
        </div>
        <CloudStorageConnector provider={provider} variant="default" />
      </div>
    );
  }

  if (storage.filesError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {storage.filesError || 'Failed to load files. Please try reconnecting your account.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (storage.isLoadingFiles) {
    return <ContentLoader className="h-48" />;
  }

  if (!storage.files || storage.files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FolderOpen className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">No files found in your {provider === 'google-drive' ? 'Google Drive' : 'OneDrive'}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => storage.listFiles()}
        >
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{storage.files.length} files</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      <div className="border rounded-lg divide-y">
        {storage.files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file.isFolder ? 'Folder' : formatFileSize(file.size || 0)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => storage.downloadFile(file.id)}
              disabled={file.isFolder}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}