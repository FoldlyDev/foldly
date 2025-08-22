'use client';

import React from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/shadcn/tabs';
import { UnifiedCloudTree } from '../trees/UnifiedCloudTree';
import { useCloudViewStore } from '../../stores/cloud-view-store';
import { Cloud } from 'lucide-react';

export function MobileViewSwitcher() {
  const {
    leftProvider,
    centerProvider,
    rightProvider,
    setLeftProvider,
    setCenterProvider,
    setRightProvider,
  } = useCloudViewStore();

  const providers = [
    { key: 'left', provider: leftProvider, setProvider: setLeftProvider },
    { key: 'center', provider: centerProvider, setProvider: setCenterProvider },
    { key: 'right', provider: rightProvider, setProvider: setRightProvider },
  ];

  return (
    <div className='h-full flex flex-col'>
      <Tabs defaultValue='left' className='flex-1 flex flex-col'>
        <TabsList className='grid w-full grid-cols-3'>
          {providers.map(({ key, provider }) => (
            <TabsTrigger
              key={key}
              value={key}
              className='flex items-center gap-2'
            >
              <Cloud className='w-4 h-4' />
              <span className='truncate'>
                {provider === 'google-drive'
                  ? 'Google'
                  : provider === 'onedrive'
                    ? 'OneDrive'
                    : 'Empty'}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {providers.map(({ key, provider, setProvider }) => (
          <TabsContent key={key} value={key} className='flex-1 mt-0'>
            <div className='h-full border rounded-lg bg-background'>
              <UnifiedCloudTree
                provider={provider}
                onProviderChange={setProvider}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
