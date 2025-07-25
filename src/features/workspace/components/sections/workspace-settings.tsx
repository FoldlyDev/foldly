'use client';

import { useState, useEffect } from 'react';
import { useWorkspaceSettings } from '../../hooks/use-workspace-settings';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Label } from '@/components/ui/shadcn/label';
import { Edit2, Save, X } from 'lucide-react';
// import { toast } from 'sonner'; // TODO: Configure toast notifications

export function WorkspaceSettings() {
  const { workspace, isLoading, error, updateWorkspace } =
    useWorkspaceSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState('');

  // Update newName when workspace loads
  useEffect(() => {
    if (workspace) {
      setNewName(workspace.name);
    }
  }, [workspace]);

  const handleRename = async () => {
    if (!workspace || !newName.trim()) return;

    setIsSaving(true);
    try {
      const success = await updateWorkspace({
        name: newName.trim(),
      });

      if (success) {
        setIsEditing(false);
        // toast.success('Workspace name updated successfully'); // TODO: Add toast notifications
        console.log(`✅ WORKSPACE_RENAMED: ${workspace.id} | "${newName}"`);
      } else {
        console.error('Failed to rename workspace');
        // toast.error('Failed to update workspace name'); // TODO: Add toast notifications
      }
    } catch (error) {
      console.error('Workspace rename error:', error);
      // toast.error('An error occurred while updating workspace name'); // TODO: Add toast notifications
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNewName(workspace?.name || '');
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSaving) {
      handleRename();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workspace Settings</CardTitle>
          <CardDescription>Manage your workspace preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='animate-pulse'>
            <div className='h-4 bg-gray-200 rounded w-1/4 mb-2'></div>
            <div className='h-10 bg-gray-200 rounded'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workspace Settings</CardTitle>
          <CardDescription>Manage your workspace preferences</CardDescription>
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
      <Card>
        <CardHeader>
          <CardTitle>Workspace Settings</CardTitle>
          <CardDescription>Manage your workspace preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>
            Workspace not found. Please contact support if this issue persists.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Settings</CardTitle>
        <CardDescription>
          Customize your workspace name and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='workspace-name'>Workspace Name</Label>
          {isEditing ? (
            <div className='flex gap-2'>
              <Input
                id='workspace-name'
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder='Enter workspace name'
                disabled={isSaving}
                className='flex-1'
                autoFocus
              />
              <Button
                onClick={handleRename}
                disabled={isSaving || !newName.trim()}
                size='sm'
                variant='default'
              >
                <Save className='h-4 w-4' />
              </Button>
              <Button
                onClick={handleCancel}
                disabled={isSaving}
                size='sm'
                variant='outline'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          ) : (
            <div className='flex items-center justify-between p-3 border rounded-md'>
              <span className='font-medium'>{workspace.name}</span>
              <Button
                onClick={() => setIsEditing(true)}
                size='sm'
                variant='ghost'
              >
                <Edit2 className='h-4 w-4' />
              </Button>
            </div>
          )}
        </div>

        <div className='pt-4 border-t'>
          <h4 className='text-sm font-medium mb-2'>Workspace Information</h4>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
            <div>
              <Label className='text-muted-foreground'>Created</Label>
              <p>{new Date(workspace.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className='text-muted-foreground'>Last Updated</Label>
              <p>{new Date(workspace.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
