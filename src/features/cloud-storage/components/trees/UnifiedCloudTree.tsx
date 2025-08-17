'use client';

import React from 'react';
import { CloudProvider } from '@/lib/services/cloud-storage';
import { CloudProviderTree } from './CloudProviderTree';
import { Cloud, CloudOff } from 'lucide-react';
import { useProviderSync } from '../../hooks/useProviderSync';
import { Button } from '@/components/ui/shadcn/button';

interface UnifiedCloudTreeProps {
  provider: CloudProvider['id'] | null;
  onProviderChange?: (provider: CloudProvider['id'] | null) => void;
}

export function UnifiedCloudTree({
  provider,
  onProviderChange,
}: UnifiedCloudTreeProps) {
  const { isProviderConnected, connectProvider } = useProviderSync();

  if (!provider) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='text-center'>
          <Cloud className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
          <p className='text-sm text-muted-foreground mb-4'>
            Select a cloud storage provider
          </p>
          <div className='space-y-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onProviderChange?.('google-drive')}
              className='w-full'
            >
              Google Drive
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onProviderChange?.('onedrive')}
              className='w-full'
            >
              OneDrive
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isConnected = isProviderConnected(provider);

  if (!isConnected) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='text-center'>
          <CloudOff className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
          <p className='text-sm text-muted-foreground mb-4'>
            {provider === 'google-drive' ? 'Google Drive' : 'OneDrive'} is not
            connected
          </p>
          <Button
            variant='default'
            size='sm'
            onClick={() => connectProvider(provider)}
          >
            Connect {provider === 'google-drive' ? 'Google Drive' : 'OneDrive'}
          </Button>
        </div>
      </div>
    );
  }

  // Use the unified CloudProviderTree component
  return <CloudProviderTree provider={provider} />;
}
