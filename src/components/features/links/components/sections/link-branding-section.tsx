'use client';

import { motion } from 'framer-motion';
import { Eye, Upload, Crown } from 'lucide-react';
import { Switch } from '@/components/ui/shadcn/switch';
import { FileUpload } from '@/components/ui/file-upload';
import { Card } from '@/components/ui/shadcn/card';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/shadcn/avatar';

// Use existing types from @/types
import type { HexColor, ValidationError } from '@/types';

export interface LinkBrandingFormData {
  readonly brandingEnabled: boolean;
  readonly brandColor: HexColor;
  readonly accentColor: HexColor;
  readonly logoFile: File | null;
}

export interface LinkBrandingSectionProps {
  readonly linkType: 'base' | 'topic';
  readonly username: string;
  readonly linkName: string;
  readonly description: string;
  readonly formData: LinkBrandingFormData;
  readonly onDataChange: (data: Partial<LinkBrandingFormData>) => void;
  readonly errors?: Partial<
    Record<keyof LinkBrandingFormData, ValidationError>
  >;
  readonly isLoading?: boolean;
}

export function LinkBrandingSection({
  linkType,
  username,
  linkName,
  description,
  formData,
  onDataChange,
  errors = {},
  isLoading = false,
}: LinkBrandingSectionProps) {
  const handleFileChange = (files: File[]) => {
    const file = files[0] || null;
    onDataChange({ logoFile: file });
  };

  // Helper to get logo preview URL
  const logoUrl = formData.logoFile
    ? URL.createObjectURL(formData.logoFile)
    : undefined;

  return (
    <div className='space-y-6'>
      {/* Branding Toggle */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between p-4 bg-card rounded-lg border border-border'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-primary/10 rounded-lg'>
              <Crown className='w-4 h-4 text-primary' />
            </div>
            <div>
              <h3 className='font-medium text-foreground'>
                Enable Custom Branding
              </h3>
              <p className='text-sm text-muted-foreground'>
                Add your own colors and styling to the collection page
              </p>
            </div>
          </div>
          <Switch
            checked={formData.brandingEnabled}
            onCheckedChange={checked =>
              onDataChange({ brandingEnabled: checked })
            }
            disabled={isLoading}
            className='data-[state=unchecked]:bg-muted-foreground/20'
          />
        </div>

        {/* Branding Options */}
        {formData.brandingEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className='space-y-4'
          >
            {/* Color Selection */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-foreground'>
                  Brand Color
                </label>
                <div className='flex items-center gap-3'>
                  <input
                    type='color'
                    value={formData.brandColor}
                    onChange={e =>
                      onDataChange({ brandColor: e.target.value as HexColor })
                    }
                    disabled={isLoading}
                    className='w-12 h-10 rounded-lg cursor-pointer disabled:cursor-not-allowed'
                  />
                  <input
                    type='text'
                    value={formData.brandColor}
                    onChange={e =>
                      onDataChange({ brandColor: e.target.value as HexColor })
                    }
                    disabled={isLoading}
                    placeholder='#6c47ff'
                    className='flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed'
                  />
                </div>
                {errors.brandColor && (
                  <p className='text-sm text-destructive'>
                    {errors.brandColor}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-foreground'>
                  Accent Color
                </label>
                <div className='flex items-center gap-3'>
                  <input
                    type='color'
                    value={formData.accentColor}
                    onChange={e =>
                      onDataChange({ accentColor: e.target.value as HexColor })
                    }
                    disabled={isLoading}
                    className='w-12 h-10 rounded-lg cursor-pointer disabled:cursor-not-allowed'
                  />
                  <input
                    type='text'
                    value={formData.accentColor}
                    onChange={e =>
                      onDataChange({ accentColor: e.target.value as HexColor })
                    }
                    disabled={isLoading}
                    placeholder='#4ade80'
                    className='flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed'
                  />
                </div>
                {errors.accentColor && (
                  <p className='text-sm text-destructive'>
                    {errors.accentColor}
                  </p>
                )}
              </div>
            </div>

            {/* Logo Upload */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-foreground'>
                Logo (Optional)
              </label>
              <FileUpload
                onChange={handleFileChange}
                files={formData.logoFile ? [formData.logoFile] : []}
              />
              {errors.logoFile && (
                <p className='text-sm text-destructive'>{errors.logoFile}</p>
              )}
            </div>

            {/* Preview Section - moved to bottom and only shown when branding is enabled */}
            <div className='space-y-3 pt-2'>
              <div className='flex items-center gap-2'>
                <Eye className='w-4 h-4 text-muted-foreground' />
                <span className='text-sm font-medium text-foreground'>
                  Preview
                </span>
              </div>
              <div
                className='w-full p-6 rounded-xl border border-gray-200/50 bg-gradient-to-br from-white to-gray-50/30'
                style={{
                  background: `linear-gradient(135deg, ${formData.brandColor}03 0%, ${formData.brandColor}08 100%)`,
                  borderColor: `${formData.brandColor}20`,
                }}
              >
                {/* Title with logo on the left if uploaded */}
                <div className='flex items-center gap-3 mb-4'>
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt='Logo'
                      className='w-6 h-6 rounded object-cover'
                    />
                  )}
                  <h3
                    className='text-xl font-semibold leading-tight'
                    style={{ color: formData.brandColor }}
                  >
                    {linkName}
                  </h3>
                </div>

                {/* Description - gray */}
                <p className='text-gray-600 text-sm mb-8 leading-relaxed'>
                  {description || 'Your description will appear here'}
                </p>

                {/* Choose Files button - compact, not full width */}
                <button
                  className='inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 hover:scale-[1.02]'
                  style={{
                    backgroundColor: formData.accentColor,
                  }}
                >
                  Choose Files
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
