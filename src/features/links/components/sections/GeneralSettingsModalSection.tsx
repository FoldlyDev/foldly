'use client';

import * as React from 'react';

import type { LinkWithStats } from '@/lib/supabase/types';
import type { UseFormReturn } from 'react-hook-form';
import type { GeneralSettingsFormData } from '../../lib/validations';

// Sub-components
import {
  BasicInformationSection,
  VisibilitySecuritySection,
  WelcomeMessageSection,
  ExpirationDateSection,
  UploadLimitsSection,
  FileOrganizationSection,
} from './modal-settings-sections';

interface GeneralSettingsModalSectionProps {
  link: LinkWithStats;
  form: UseFormReturn<GeneralSettingsFormData>;
}

export function GeneralSettingsModalSection({
  link,
  form,
}: GeneralSettingsModalSectionProps) {
  const isBaseLink = link.linkType === 'base';

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
      {/* Left Column - Basic Info & Visibility */}
      <div className='space-y-6'>
        <BasicInformationSection form={form} link={link} />
        <VisibilitySecuritySection form={form} />
        {!isBaseLink && link.isActive && (
          <ExpirationDateSection link={link} form={form} />
        )}
      </div>

      {/* Right Column - Upload Limits & File Management */}
      <div className='space-y-6'>
        <UploadLimitsSection form={form} />
        <FileOrganizationSection form={form} />
      </div>
    </div>
  );
}
