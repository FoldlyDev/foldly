'use client';

import { Mail } from 'lucide-react';
import { Switch } from '@/components/ui/shadcn/switch';

interface UploaderEmailRequirementProps {
  formData: {
    requireEmail?: boolean;
  };
  onDataChange: (data: any) => void;
  isLoading?: boolean;
}

export function UploaderEmailRequirement({
  formData,
  onDataChange,
  isLoading = false,
}: UploaderEmailRequirementProps) {
  return (
    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
      <div className='space-y-1'>
        <div className='flex items-center gap-2'>
          <Mail className='h-4 w-4 text-indigo-600' />
          <p className='text-sm font-medium text-foreground'>
            Require Email
          </p>
        </div>
        <p className='text-xs text-muted-foreground'>
          Visitors must provide their email before uploading
        </p>
      </div>
      <Switch
        checked={formData.requireEmail || false}
        onCheckedChange={checked =>
          onDataChange({ requireEmail: checked })
        }
        disabled={isLoading}
        className='data-[state=unchecked]:bg-muted-foreground/20 cursor-pointer'
      />
    </div>
  );
}