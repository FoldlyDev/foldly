'use client';

import { motion } from 'framer-motion';
import { Eye, Crown } from 'lucide-react';
import { Switch } from '@/components/ui/core/shadcn/switch';
import { CentralizedFileUpload } from '@/components/ui/composite/centralized-file-upload';

interface LinkBrandingFormData {
  branding: {
    enabled: boolean;
    color?: string;
    image?: string;
    imagePath?: string;
    imageUrl?: string;
  };
  brandingFile?: File;
}

export interface LinkBrandingSectionProps {
  readonly linkType: 'base' | 'topic';
  readonly username: string;
  readonly linkName: string;
  readonly description: string;
  readonly formData: LinkBrandingFormData;
  readonly onDataChange: (updates: Partial<LinkBrandingFormData>) => void;
  readonly errors?: Partial<Record<keyof LinkBrandingFormData, string>>;
  readonly isLoading?: boolean;
}

export function LinkBrandingSection({
  linkName,
  description,
  formData,
  onDataChange,
  errors = {},
  isLoading = false,
}: LinkBrandingSectionProps) {
  // Ensure controlled inputs by providing default values
  const brandColor = formData.branding?.color || '#6c47ff';

  const handleFileChange = (files: File[]) => {
    const file = files[0];
    if (file) {
      // Store the file and create blob URL for preview
      const newLogoUrl = URL.createObjectURL(file);
      onDataChange({
        branding: {
          enabled: formData.branding?.enabled || false,
          ...(formData.branding?.color && { color: formData.branding.color }),
          image: newLogoUrl,
          ...(formData.branding?.imagePath && { imagePath: formData.branding.imagePath }),
          ...(formData.branding?.imageUrl && { imageUrl: formData.branding.imageUrl }),
        },
        brandingFile: file, // Pass the actual file
      });
    }
  };

  const handleFileRemove = () => {
    // Clear logo and file
    const update: Partial<LinkBrandingFormData> = {
      branding: {
        enabled: formData.branding?.enabled || false,
        ...(formData.branding?.color && { color: formData.branding.color }),
        image: '',
      },
    };
    // Remove the file by omitting it from the update
    onDataChange(update);
  };

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
            checked={formData.branding?.enabled || false}
            onCheckedChange={checked => {
              onDataChange({
                branding: {
                  enabled: checked,
                  ...(formData.branding?.color && { color: formData.branding.color }),
                  ...(formData.branding?.image && { image: formData.branding.image }),
                  ...(formData.branding?.imagePath && { imagePath: formData.branding.imagePath }),
                  ...(formData.branding?.imageUrl && { imageUrl: formData.branding.imageUrl }),
                },
              });
            }}
            disabled={isLoading}
            className='data-[state=unchecked]:bg-muted-foreground/20'
          />
        </div>

        {/* Branding Options */}
        {formData.branding?.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className='space-y-4'
          >
            {/* Single Brand Color Selection - Aligned with Database Schema */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-foreground'>
                Brand Color
              </label>
              <div className='flex items-center gap-3'>
                <input
                  type='color'
                  value={brandColor}
                  onChange={e => {
                    onDataChange({
                      branding: {
                        enabled: formData.branding?.enabled || false,
                        color: e.target.value,
                        ...(formData.branding?.image && { image: formData.branding.image }),
                        ...(formData.branding?.imagePath && { imagePath: formData.branding.imagePath }),
                        ...(formData.branding?.imageUrl && { imageUrl: formData.branding.imageUrl }),
                      },
                    });
                  }}
                  disabled={isLoading}
                  className='w-12 h-10 rounded-lg cursor-pointer disabled:cursor-not-allowed'
                />
                <input
                  type='text'
                  value={brandColor}
                  onChange={e => {
                    onDataChange({
                      branding: {
                        enabled: formData.branding?.enabled || false,
                        color: e.target.value,
                        ...(formData.branding?.image && { image: formData.branding.image }),
                        ...(formData.branding?.imagePath && { imagePath: formData.branding.imagePath }),
                        ...(formData.branding?.imageUrl && { imageUrl: formData.branding.imageUrl }),
                      },
                    });
                  }}
                  disabled={isLoading}
                  placeholder='#6c47ff'
                  className='flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed'
                />
              </div>
              {errors.branding && (
                <p className='text-sm text-destructive'>{errors.branding}</p>
              )}
              <p className='text-xs text-muted-foreground'>
                This color will be used for buttons, highlights, and branding
                elements
              </p>
            </div>

            {/* Logo Upload */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-foreground'>
                Logo (Optional)
              </label>
              <CentralizedFileUpload
                onChange={handleFileChange}
                onRemove={handleFileRemove}
                files={[]}
                multiple={false}
                maxFiles={1}
                maxFileSize={5 * 1024 * 1024} // 5MB limit for logos
                allowedFileTypes={[
                  'image/png',
                  'image/jpeg',
                  'image/jpg',
                  'image/svg+xml',
                  'image/webp',
                ]}
                uploadText='Upload Logo'
                uploadDescription='Click or drag to upload your logo (PNG, JPG, SVG, WebP)'
                showGrid={false}
                className=''
                disabled={isLoading}
                showFileType={false}
                showModifiedDate={false}
              />
              {errors.branding && (
                <p className='text-sm text-destructive'>{errors.branding}</p>
              )}
            </div>

            {/* Preview Section - Updated to use single brand color */}
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
                  background: `linear-gradient(135deg, ${brandColor}03 0%, ${brandColor}08 100%)`,
                  borderColor: `${brandColor}20`,
                }}
              >
                {/* Title with logo on the left if uploaded */}
                <div className='flex items-center gap-3 mb-4'>
                  {formData.branding?.image && (
                    <img
                      src={formData.branding.image}
                      alt='Logo'
                      className='w-6 h-6 rounded object-cover'
                    />
                  )}
                  <h3
                    className='text-xl font-semibold leading-tight'
                    style={{ color: brandColor }}
                  >
                    {linkName}
                  </h3>
                </div>

                {/* Description - gray */}
                <p className='text-gray-600 text-sm mb-8 leading-relaxed'>
                  {description || 'Your description will appear here'}
                </p>

                {/* Choose Files button - uses brand color with good contrast */}
                <button
                  className='inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 hover:scale-[1.02]'
                  style={{
                    backgroundColor: brandColor,
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
