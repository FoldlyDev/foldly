'use client';

import * as React from 'react';
import { FolderPlus } from 'lucide-react';
import { Checkbox } from '@/components/ui/core/shadcn/checkbox';
import { HelpPopover } from '@/components/ui/core/help-popover';
import type { UseFormReturn } from 'react-hook-form';
import type { GeneralSettingsFormData } from '../../../lib/validations';

interface FileOrganizationSectionProps {
  form: UseFormReturn<GeneralSettingsFormData>;
}

export function FileOrganizationSection({
  form,
}: FileOrganizationSectionProps) {
  return (
    <div className='space-y-4'>
      <h3 className='text-sm font-medium text-foreground flex items-center gap-2'>
        <FolderPlus className='w-4 h-4' />
        File Organization
      </h3>

      <div className='rounded-lg border border-border bg-card p-4 space-y-4'>
        <div className='space-y-3'>
          <p className='text-sm text-muted-foreground'>
            File organization features are coming soon. Files will be
            automatically organized by upload date.
          </p>
        </div>
      </div>
    </div>
  );
}