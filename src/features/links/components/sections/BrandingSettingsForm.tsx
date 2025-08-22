'use client';

import { motion } from 'framer-motion';
import { Eye, Crown } from 'lucide-react';
import { Switch } from '@/components/ui/shadcn/switch';
import { CentralizedFileUpload } from '@/components/composite/centralized-file-upload';
import type { LinkWithStats } from '@/lib/database/types';
import type { UseFormReturn } from 'react-hook-form';
import type { GeneralSettingsFormData } from '../../lib/validations';
import { useCallback, useState } from 'react';
import { useEventBus, NotificationEventType } from '@/features/notifications/hooks/use-event-bus';

export interface BrandingSettingsFormProps {
  form: UseFormReturn<GeneralSettingsFormData>;
  link: LinkWithStats;
}

export function BrandingSettingsForm({
  form,
  link,
}: BrandingSettingsFormProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;
  const { emit } = useEventBus();

  const watchedValues = watch();
  const brandColor = watchedValues.branding?.color || '#6c47ff';
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (file) {
        setPendingFile(file);

        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload immediately using API route (like workspace uploads)
        setIsUploading(true);
        try {
          // Create FormData for upload
          const formData = new FormData();
          formData.append('file', file);
          formData.append('linkId', link.id);
          formData.append(
            'enabled',
            String(watchedValues.branding?.enabled || false)
          );
          if (watchedValues.branding?.color) {
            formData.append('color', watchedValues.branding.color);
          }

          // Upload to API route
          const response = await fetch('/api/links/branding/upload', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();

          if (result.success) {
            emit(NotificationEventType.LINK_UPDATE_SUCCESS, {
              linkId: link.id,
              linkTitle: `${link.title} - Branding image uploaded`,
            });
            // Update form with the new image URL from storage
            setValue(
              'branding',
              {
                enabled: watchedValues.branding?.enabled || false,
                color: watchedValues.branding?.color,
                imageUrl: result.data?.imageUrl,
                imagePath: result.data?.imagePath,
              },
              {
                shouldDirty: false,
                shouldValidate: true,
              }
            );
            setPendingFile(null);
          } else {
            emit(NotificationEventType.LINK_UPDATE_ERROR, {
              linkId: link.id,
              linkTitle: link.title,
              error: result.error || 'Failed to upload branding image',
            });
            setPendingFile(null);
            setPreviewUrl(null);
          }
        } catch (error) {
          console.error('Failed to upload branding image:', error);
          emit(NotificationEventType.LINK_UPDATE_ERROR, {
            linkId: link.id,
            linkTitle: link.title,
            error: 'Failed to upload branding image',
          });
          setPendingFile(null);
          setPreviewUrl(null);
        } finally {
          setIsUploading(false);
        }
      }
    },
    [link.id, setValue, watchedValues.branding, emit]
  );

  const handleFileRemove = useCallback(async () => {
    setIsUploading(true);
    try {
      // Use DELETE method on the same API route
      const response = await fetch(
        `/api/links/branding/upload?linkId=${link.id}`,
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();

      if (result.success) {
        emit(NotificationEventType.LINK_UPDATE_SUCCESS, {
          linkId: link.id,
          linkTitle: `${link.title} - Branding image removed`,
        });
        setValue(
          'branding',
          {
            enabled: watchedValues.branding?.enabled || false,
            color: watchedValues.branding?.color,
            imageUrl: undefined,
            imagePath: undefined,
          },
          {
            shouldDirty: false,
            shouldValidate: true,
          }
        );
        setPreviewUrl(null);
        setPendingFile(null);
      } else {
        emit(NotificationEventType.LINK_UPDATE_ERROR, {
          linkId: link.id,
          linkTitle: link.title,
          error: result.error || 'Failed to remove branding image',
        });
      }
    } catch (error) {
      console.error('Failed to remove branding image:', error);
      emit(NotificationEventType.LINK_UPDATE_ERROR, {
        linkId: link.id,
        linkTitle: link.title,
        error: 'Failed to remove branding image',
      });
    } finally {
      setIsUploading(false);
    }
  }, [link.id, link.title, setValue, watchedValues.branding, emit]);

  return (
    <div className='space-y-6'>
      {/* Branding Toggle */}
      <div className='space-y-4'>
        <div className='rounded-lg border border-border bg-card p-4 space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-primary/10 rounded-lg'>
                <Crown className='w-4 h-4 text-primary' />
              </div>
              <div>
                <h3 className='form-label'>Enable Custom Branding</h3>
                <p className='form-helper'>
                  Add your own colors and logo to personalize your collection
                  page
                </p>
              </div>
            </div>
            <Switch
              checked={watchedValues.branding?.enabled || false}
              onCheckedChange={checked =>
                setValue(
                  'branding',
                  {
                    enabled: checked,
                    color: watchedValues.branding?.color,
                    imagePath: watchedValues.branding?.imagePath,
                    imageUrl: watchedValues.branding?.imageUrl,
                  },
                  {
                    shouldDirty: true,
                    shouldValidate: true,
                  }
                )
              }
              className='data-[state=unchecked]:bg-muted-foreground/20'
            />
          </div>
        </div>

        {/* Branding Options */}
        {watchedValues.branding?.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className='space-y-4'
          >
            {/* Brand Color Selection */}
            <div className='rounded-lg border border-border bg-card p-4 space-y-4'>
              <div className='space-y-2'>
                <label className='form-label'>Brand Color</label>
                <div className='flex items-center gap-3'>
                  <input
                    type='color'
                    value={brandColor}
                    onChange={e =>
                      setValue(
                        'branding',
                        {
                          enabled: watchedValues.branding?.enabled || false,
                          color: e.target.value,
                          imagePath: watchedValues.branding?.imagePath,
                          imageUrl: watchedValues.branding?.imageUrl,
                        },
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        }
                      )
                    }
                    className='w-12 h-10 rounded-lg cursor-pointer border border-border'
                  />
                  <input
                    type='text'
                    value={brandColor}
                    onChange={e =>
                      setValue(
                        'branding',
                        {
                          enabled: watchedValues.branding?.enabled || false,
                          color: e.target.value,
                          imagePath: watchedValues.branding?.imagePath,
                          imageUrl: watchedValues.branding?.imageUrl,
                        },
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        }
                      )
                    }
                    placeholder='#6c47ff'
                    className='form-input flex-1'
                  />
                </div>
                {errors.branding && (
                  <p className='text-sm text-destructive'>
                    Invalid branding configuration
                  </p>
                )}
                <p className='form-helper text-xs'>
                  This color will be used for buttons, link card borders, and
                  branding elements
                </p>
              </div>
            </div>

            {/* Logo Upload */}
            <div className='rounded-lg border border-border bg-card p-4 space-y-4'>
              <div className='space-y-2'>
                <label className='form-label'>Logo (Optional)</label>

                {/* Current Logo Display */}
                {watchedValues.branding?.imageUrl && !pendingFile && (
                  <div className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg mb-3'>
                    <img
                      src={watchedValues.branding.imageUrl}
                      alt='Current logo'
                      className='w-10 h-10 rounded object-cover'
                    />
                    <div className='flex-1'>
                      <p className='text-sm font-medium text-foreground'>
                        Current logo
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Click below to replace
                      </p>
                    </div>
                  </div>
                )}

                <CentralizedFileUpload
                  onChange={handleFileChange}
                  onRemove={handleFileRemove}
                  files={pendingFile ? [pendingFile] : []}
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
                  disabled={isUploading}
                  showFileType={false}
                  showModifiedDate={false}
                />
                <p className='form-helper text-xs'>
                  Your logo will appear on link cards and the collection page
                </p>
              </div>
            </div>

            {/* Brand Preview Section */}
            <div className='rounded-lg border border-border bg-card p-4 space-y-4'>
              <div className='flex items-center gap-2 mb-3'>
                <Eye className='w-4 h-4 text-muted-foreground' />
                <span className='form-label'>Preview</span>
              </div>

              {/* Collection Page Preview */}
              <div className='space-y-2'>
                <p className='text-xs text-muted-foreground'>
                  Collection Page Preview
                </p>
                <div
                  className='p-6 rounded-xl border border-border/50'
                  style={{
                    background: `linear-gradient(135deg, ${brandColor}03 0%, ${brandColor}08 100%)`,
                    borderColor: `${brandColor}20`,
                  }}
                >
                  {/* Title with logo */}
                  <div className='flex items-center gap-3 mb-4'>
                    {(previewUrl || watchedValues.branding?.imageUrl) && (
                      <img
                        src={
                          previewUrl || watchedValues.branding?.imageUrl || ''
                        }
                        alt='Logo'
                        className='w-6 h-6 rounded object-cover'
                      />
                    )}
                    <h3
                      className='text-xl font-semibold leading-tight'
                      style={{ color: brandColor }}
                    >
                      {link.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className='text-muted-foreground text-sm mb-8 leading-relaxed'>
                    {watchedValues.description ||
                      link.description ||
                      'Your description will appear here'}
                  </p>

                  {/* Upload button */}
                  <button
                    className='inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 hover:scale-[1.02] disabled:cursor-not-allowed'
                    style={{
                      backgroundColor: brandColor,
                    }}
                    disabled
                  >
                    Choose Files
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
