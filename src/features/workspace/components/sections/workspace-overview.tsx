'use client';

import { useState } from 'react';
import { useWorkspaceSettings } from '../../hooks/use-workspace-settings';
import type { WorkspaceWithStats } from '@/lib/supabase/types';
import type {
  WorkspaceOverviewProps,
  WorkspaceStatsData,
} from '../../types/workspace-ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Badge } from '@/components/ui/shadcn/badge';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Folder, Link2, Calendar, User } from 'lucide-react';

export function WorkspaceOverview({ className }: WorkspaceOverviewProps) {
  const { workspace, isLoading, error } = useWorkspaceSettings();

  // Mock stats for now - in a real implementation, these would come from actual data
  const [stats] = useState<WorkspaceStatsData>({
    totalLinks: 0, // TODO: Get from links service when integrated
    totalFolders: 0, // TODO: Get from folders service when integrated
    totalFiles: 0, // TODO: Get from files service when integrated
    storageUsed: 0, // TODO: Get from workspace service when integrated
    storageLimit: 2147483648, // 2GB default
    lastActivity: null, // TODO: Get from activity service when integrated
    recentActivity: 'Just created',
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Workspace Overview</CardTitle>
          <CardDescription>Your workspace at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <Skeleton className='h-4 w-3/4' />
            <div className='grid grid-cols-2 gap-4'>
              <Skeleton className='h-16' />
              <Skeleton className='h-16' />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Workspace Overview</CardTitle>
          <CardDescription>Your workspace at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-red-600'>Error: {error}</p>
          <p className='text-sm text-muted-foreground mt-2'>
            Please contact support if this issue persists.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!workspace) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Workspace Overview</CardTitle>
          <CardDescription>Your workspace at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>
            No workspace found. Please contact support.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <User className='h-5 w-5' />
          {workspace.name}
        </CardTitle>
        <CardDescription>
          Created on {new Date(workspace.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* Workspace Stats */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='flex items-center space-x-2 p-3 border rounded-lg'>
              <Link2 className='h-4 w-4 text-blue-500' />
              <div>
                <p className='text-sm font-medium'>Links</p>
                <p className='text-2xl font-bold'>{stats.totalLinks}</p>
              </div>
            </div>
            <div className='flex items-center space-x-2 p-3 border rounded-lg'>
              <Folder className='h-4 w-4 text-yellow-500' />
              <div>
                <p className='text-sm font-medium'>Folders</p>
                <p className='text-2xl font-bold'>{stats.totalFolders}</p>
              </div>
            </div>

            <div className='flex items-center space-x-2 p-3 border rounded-lg'>
              <Calendar className='h-4 w-4 text-green-500' />
              <div>
                <p className='text-sm font-medium'>Status</p>
                <Badge variant='secondary'>{stats.recentActivity}</Badge>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className='pt-4 border-t'>
            <h4 className='text-sm font-medium mb-3'>Quick Actions</h4>
            <div className='flex flex-wrap gap-2'>
              <Badge
                variant='outline'
                className='cursor-pointer hover:bg-accent'
              >
                Create Link
              </Badge>
              <Badge
                variant='outline'
                className='cursor-pointer hover:bg-accent'
              >
                New Folder
              </Badge>
              <Badge
                variant='outline'
                className='cursor-pointer hover:bg-accent'
              >
                View Analytics
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
