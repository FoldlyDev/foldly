'use client';

import { useState } from 'react';
import { UserProfile } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { getCloudStorageStatus } from '@/lib/services/cloud-storage/actions/oauth-actions';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Badge } from '@/components/ui/shadcn/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import { CloudIcon, CheckCircle2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useCloudStorage } from '../hooks/use-cloud-storage';
import { formatDistanceToNow } from 'date-fns';

interface CloudProviderCardProps {
  provider: 'google-drive' | 'onedrive';
  providerName: string;
  icon: React.ReactNode;
  description: string;
  scopes: string[];
}

function CloudProviderCard({ 
  provider, 
  providerName, 
  icon,
  description,
  scopes 
}: CloudProviderCardProps) {
  const { 
    isConnected, 
    isConnecting, 
    connectionError,
    email,
    connect,
    disconnect,
    files,
  } = useCloudStorage({ provider, autoConnect: false });

  const { data: status } = useQuery({
    queryKey: ['cloud-storage', 'status'],
    queryFn: getCloudStorageStatus,
    refetchInterval: 60000,
  });

  const providerKey = provider === 'google-drive' ? 'google' : 'microsoft';
  const lastSyncedAt = status?.[providerKey]?.lastSyncedAt;

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{icon}</div>
            <div>
              <CardTitle>{providerName}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? 'Connected' : 'Not Connected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Connected as {email}</span>
              </div>
              {lastSyncedAt && (
                <div className="text-sm text-muted-foreground">
                  Last synced {formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}
                </div>
              )}
              {files.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {files.length} files available
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => connect()}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh Connection
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => disconnect()}
              >
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Required permissions:
              </div>
              <ul className="text-sm space-y-1">
                {scopes.map((scope, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="h-1 w-1 bg-muted-foreground rounded-full" />
                    <span className="text-muted-foreground">{scope}</span>
                  </li>
                ))}
              </ul>
            </div>

            {connectionError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{connectionError}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                To connect {providerName}, use the "Connect Account" section in your profile settings below.
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function CloudStorageManager() {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cloud Storage Integration</h2>
        <p className="text-muted-foreground">
          Connect your Google Drive or OneDrive to sync and manage files across platforms
        </p>
      </div>

      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="settings">OAuth Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CloudProviderCard
              provider="google-drive"
              providerName="Google Drive"
              icon="🔷"
              description="Access and sync files from Google Drive"
              scopes={[
                "View and manage files you've opened or created",
                'View metadata for files in your Drive',
                'View and download all your Drive files'
              ]}
            />
            
            <CloudProviderCard
              provider="onedrive"
              providerName="OneDrive"
              icon="☁️"
              description="Access and sync files from Microsoft OneDrive"
              scopes={[
                'Read and write access to user files',
                'Maintain access to data you have given it access to',
                'Sign you in and read your profile'
              ]}
            />
          </div>

          <Alert>
            <CloudIcon className="h-4 w-4" />
            <AlertDescription>
              Cloud storage connections are managed through OAuth 2.0 for secure access. 
              Your credentials are never stored - only secure access tokens managed by Clerk.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>OAuth Account Management</CardTitle>
              <CardDescription>
                Connect or disconnect your cloud storage accounts through your user profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowProfile(!showProfile)}>
                {showProfile ? 'Hide' : 'Show'} Profile Settings
              </Button>
              
              {showProfile && (
                <div className="mt-4 border rounded-lg p-4">
                  <UserProfile
                    additionalOAuthScopes={{
                      google: [
                        'https://www.googleapis.com/auth/drive.file',
                        'https://www.googleapis.com/auth/drive.readonly',
                      ],
                      microsoft: ['Files.ReadWrite.All', 'offline_access'],
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> When connecting accounts, make sure to grant all requested permissions 
              for full functionality. You can revoke access at any time from your account settings.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}