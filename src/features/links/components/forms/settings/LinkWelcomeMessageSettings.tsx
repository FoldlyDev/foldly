'use client';

import * as React from 'react';
import { MessageSquare } from 'lucide-react';
import { HelpPopover } from '@/components/ui/core/help-popover';
import type { UseFormReturn } from 'react-hook-form';
import type { GeneralSettingsFormData } from '../../../lib/validations';

interface LinkWelcomeMessageSettingsProps {
  form: UseFormReturn<GeneralSettingsFormData>;
}

export function LinkWelcomeMessageSettings({
  form,
}: LinkWelcomeMessageSettingsProps) {
  return (
    <div className='space-y-4'>
      <h3 className='text-sm font-medium text-foreground flex items-center gap-2'>
        <MessageSquare className='w-4 h-4' />
        Welcome Message
      </h3>

      <div className='rounded-lg border border-border bg-card p-4 space-y-4'>
        <div className='space-y-3'>
          <p className='text-sm text-muted-foreground'>
            Welcome message functionality coming soon. Use the description field
            in basic settings to customize your upload page message.
          </p>
        </div>
      </div>
    </div>
  );
}