'use client';

import * as React from 'react';

import type { LinkWithStats } from '@/lib/database/types';
import type { UseFormReturn } from 'react-hook-form';
import type { GeneralSettingsFormData } from '../../lib/validations';

// Sub-components
import {
  LinkIdentitySettings,
  LinkAccessSettings,
  LinkWelcomeMessageSettings,
  LinkExpirationSettings,
  UploadRestrictionsSettings,
  FileOrganizationSection,
} from '../forms/settings';

interface LinkSettingsFormProps {
  link: LinkWithStats;
  form: UseFormReturn<GeneralSettingsFormData>;
}

export function LinkSettingsForm({
  link,
  form,
}: LinkSettingsFormProps) {
  const isBaseLink = link.linkType === 'base';

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
      {/* Left Column - Basic Info & Visibility */}
      <div className='space-y-6'>
        <LinkIdentitySettings form={form} link={link} />
        <LinkAccessSettings form={form} />
        {!isBaseLink && link.isActive && (
          <LinkExpirationSettings link={link} form={form} />
        )}
      </div>

      {/* Right Column - Upload Limits & File Management */}
      <div className='space-y-6'>
        <UploadRestrictionsSettings form={form} />
        <FileOrganizationSection form={form} />
      </div>
    </div>
  );
}
