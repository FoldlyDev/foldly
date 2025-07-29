'use client';

import { Power, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/core/shadcn/switch';

interface LinkStatusControlsProps {
  formData: {
    isActive?: boolean;
    isPublic?: boolean;
  };
  onDataChange: (data: any) => void;
  isLoading?: boolean;
}

export function LinkStatusControls({
  formData,
  onDataChange,
  isLoading = false,
}: LinkStatusControlsProps) {
  return (
    <>
      {/* Link Status Toggle */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <Power className='h-4 w-4 text-green-600' />
            <p className='text-sm font-medium text-foreground'>Link Status</p>
          </div>
          <p className='text-xs text-muted-foreground'>
            Control whether this link is active and accepting uploads
          </p>
        </div>
        <Switch
          checked={formData.isActive || false}
          onCheckedChange={checked => onDataChange({ isActive: checked })}
          disabled={isLoading}
          className='data-[state=unchecked]:bg-muted-foreground/20 cursor-pointer'
        />
      </div>

      {/* Visibility Toggle */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            {formData.isPublic ? (
              <Eye className='h-4 w-4 text-blue-600' />
            ) : (
              <EyeOff className='h-4 w-4 text-orange-600' />
            )}
            <p className='text-sm font-medium text-foreground'>Visibility</p>
          </div>
          <p className='text-xs text-muted-foreground'>
            {formData.isPublic
              ? 'Link is public and discoverable'
              : 'Link is private - only accessible via direct URL'}
          </p>
        </div>
        <Switch
          checked={formData.isPublic || false}
          onCheckedChange={checked => onDataChange({ isPublic: checked })}
          disabled={isLoading}
          className='data-[state=unchecked]:bg-muted-foreground/20 cursor-pointer'
        />
      </div>
    </>
  );
}
