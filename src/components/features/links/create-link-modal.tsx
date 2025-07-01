'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Link2,
  Settings,
  Eye,
  Calendar,
  Mail,
  FileText,
  Globe,
  Check,
  AlertCircle,
  Upload,
  Image,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/animate-ui/radix/dialog';
import type { CreateUploadLinkInput } from '@/types';

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CreateLinkFormState {
  // Basic information
  readonly title: string;
  readonly slug: string;
  readonly description?: string;
  readonly instructions?: string;

  // Security settings
  readonly requireEmail: boolean;
  readonly requirePassword: boolean;
  readonly password?: string; // Will be hashed before sending to API
  readonly isPublic: boolean;

  // File restrictions (UI format)
  readonly allowedFileTypes: string[];
  readonly maxFileSize: string; // UI format like "50MB", will convert to bytes
  readonly expiresAt?: string; // ISO string or empty, will convert to Date

  // Organization
  readonly autoCreateFolders: boolean;
  readonly linkType: 'base' | 'custom';
}

export function CreateLinkModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateLinkModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CreateLinkFormState>({
    title: '',
    slug: '',
    description: '',
    requireEmail: false,
    requirePassword: false,
    isPublic: true,
    allowedFileTypes: [],
    maxFileSize: '50',
    password: '',
    instructions: '',
    autoCreateFolders: true,
    linkType: 'custom',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (field === 'title') {
      const slug = value
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      setFormData(prev => ({
        ...prev,
        slug,
      }));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const url = `foldly.com/yourname/${formData.slug}`;
    setGeneratedUrl(url);
    setStep(3);
    setIsSubmitting(false);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(`https://${generatedUrl}`);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const fileTypeOptions = [
    {
      id: 'images',
      label: 'Images',
      icon: Image,
      extensions: 'JPG, PNG, GIF, WebP',
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      extensions: 'PDF, DOC, DOCX, TXT',
    },
    {
      id: 'videos',
      label: 'Videos',
      icon: FileText,
      extensions: 'MP4, MOV, AVI, MKV',
    },
    {
      id: 'archives',
      label: 'Archives',
      icon: FileText,
      extensions: 'ZIP, RAR, 7Z',
    },
  ];

  const maxFileSizeOptions = [
    { value: '10', label: '10 MB' },
    { value: '25', label: '25 MB' },
    { value: '50', label: '50 MB' },
    { value: '100', label: '100 MB' },
    { value: '250', label: '250 MB' },
    { value: '500', label: '500 MB' },
  ];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto bg-white'>
        <DialogHeader className='border-b border-[var(--neutral-200)] pb-6'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-[var(--primary-subtle)] rounded-lg flex items-center justify-center'>
              <Link2 className='w-5 h-5 text-[var(--primary)]' />
            </div>
            <div>
              <DialogTitle className='text-xl font-bold text-[var(--quaternary)]'>
                {step === 3 ? 'Link Created!' : 'Create Upload Link'}
              </DialogTitle>
              <DialogDescription className='text-[var(--neutral-500)] text-sm'>
                {step === 1 && 'Basic information and settings'}
                {step === 2 && 'Advanced options'}
                {step === 3 && 'Your link is ready to share'}
              </DialogDescription>
            </div>
          </div>

          {step < 3 && (
            <div className='flex items-center justify-center pt-4'>
              <div className='flex items-center gap-4'>
                <div
                  className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  ${step >= 1 ? 'bg-[var(--primary)] text-white' : 'bg-[var(--neutral-200)] text-[var(--neutral-500)]'}
                `}
                >
                  1
                </div>
                <div
                  className={`w-12 h-0.5 ${step >= 2 ? 'bg-[var(--primary)]' : 'bg-[var(--neutral-200)]'}`}
                />
                <div
                  className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  ${step >= 2 ? 'bg-[var(--primary)] text-white' : 'bg-[var(--neutral-200)] text-[var(--neutral-500)]'}
                `}
                >
                  2
                </div>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className='pt-6'>
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className='space-y-6'
            >
              <div>
                <label className='block text-sm font-medium text-[var(--quaternary)] mb-2'>
                  Link Name *
                </label>
                <input
                  type='text'
                  value={formData.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                  placeholder='e.g., Client Onboarding Files'
                  className='w-full px-4 py-3 border border-[var(--neutral-200)] rounded-lg 
                           focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-[var(--quaternary)] mb-2'>
                  Custom URL
                </label>
                <div className='flex items-center'>
                  <span
                    className='px-3 py-3 bg-[var(--neutral-100)] text-[var(--neutral-600)] 
                                 border border-r-0 border-[var(--neutral-200)] rounded-l-lg'
                  >
                    foldly.com/yourname/
                  </span>
                  <input
                    type='text'
                    value={formData.slug}
                    onChange={e => handleInputChange('slug', e.target.value)}
                    placeholder='custom-slug'
                    className='flex-1 px-4 py-3 border border-[var(--neutral-200)] rounded-r-lg 
                             focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-[var(--quaternary)] mb-2'>
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={e =>
                    handleInputChange('description', e.target.value)
                  }
                  placeholder='Tell your clients what files you need...'
                  rows={3}
                  className='w-full px-4 py-3 border border-[var(--neutral-200)] rounded-lg 
                           focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='flex items-center justify-between p-4 bg-[var(--neutral-50)] rounded-lg'>
                  <div>
                    <div className='font-medium text-[var(--quaternary)]'>
                      Require Email
                    </div>
                    <div className='text-sm text-[var(--neutral-500)]'>
                      Get notified of uploads
                    </div>
                  </div>
                  <label className='relative inline-flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={formData.requireEmail}
                      onChange={e =>
                        handleInputChange('requireEmail', e.target.checked)
                      }
                      className='sr-only peer'
                    />
                    <div
                      className="w-11 h-6 bg-[var(--neutral-200)] peer-focus:outline-none rounded-full 
                                  peer peer-checked:after:translate-x-full peer-checked:after:border-white 
                                  after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                  after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all 
                                  peer-checked:bg-[var(--primary)]"
                    />
                  </label>
                </div>

                <div className='flex items-center justify-between p-4 bg-[var(--neutral-50)] rounded-lg'>
                  <div>
                    <div className='font-medium text-[var(--quaternary)]'>
                      Multiple Files
                    </div>
                    <div className='text-sm text-[var(--neutral-500)]'>
                      Allow multiple uploads
                    </div>
                  </div>
                  <label className='relative inline-flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={formData.isPublic}
                      onChange={e =>
                        handleInputChange('isPublic', e.target.checked)
                      }
                      className='sr-only peer'
                    />
                    <div
                      className="w-11 h-6 bg-[var(--neutral-200)] peer-focus:outline-none rounded-full 
                                  peer peer-checked:after:translate-x-full peer-checked:after:border-white 
                                  after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                  after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all 
                                  peer-checked:bg-[var(--primary)]"
                    />
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className='space-y-6'
            >
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-[var(--quaternary)] mb-2'>
                    Max File Size
                  </label>
                  <select
                    value={formData.maxFileSize}
                    onChange={e =>
                      handleInputChange('maxFileSize', e.target.value)
                    }
                    className='w-full px-4 py-3 border border-[var(--neutral-200)] rounded-lg 
                             focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'
                  >
                    {maxFileSizeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-[var(--quaternary)] mb-2'>
                    Expires (Optional)
                  </label>
                  <input
                    type='date'
                    value={formData.expiresAt}
                    onChange={e =>
                      handleInputChange('expiresAt', e.target.value)
                    }
                    className='w-full px-4 py-3 border border-[var(--neutral-200)] rounded-lg 
                             focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-[var(--quaternary)] mb-3'>
                  Allowed File Types
                </label>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {fileTypeOptions.map(type => (
                    <div
                      key={type.id}
                      className={`
                        p-3 border rounded-lg cursor-pointer transition-all
                        ${
                          formData.allowedFileTypes.includes(type.id)
                            ? 'border-[var(--primary)] bg-[var(--primary-subtle)]'
                            : 'border-[var(--neutral-200)] hover:border-[var(--neutral-300)]'
                        }
                      `}
                      onClick={() => {
                        const newTypes = formData.allowedFileTypes.includes(
                          type.id
                        )
                          ? formData.allowedFileTypes.filter(t => t !== type.id)
                          : [...formData.allowedFileTypes, type.id];
                        handleInputChange('allowedFileTypes', newTypes);
                      }}
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <type.icon className='w-4 h-4' />
                          <span className='font-medium'>{type.label}</span>
                        </div>
                        {formData.allowedFileTypes.includes(type.id) && (
                          <Check className='w-4 h-4 text-[var(--primary)]' />
                        )}
                      </div>
                      <div className='text-xs text-[var(--neutral-500)] mt-1'>
                        {type.extensions}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-[var(--quaternary)] mb-2'>
                  Custom Message (Optional)
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={e =>
                    handleInputChange('instructions', e.target.value)
                  }
                  placeholder='Add instructions for your clients...'
                  rows={3}
                  className='w-full px-4 py-3 border border-[var(--neutral-200)] rounded-lg 
                           focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none'
                />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className='text-center space-y-6'
            >
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto'>
                <Check className='w-8 h-8 text-green-600' />
              </div>

              <div>
                <h3 className='text-xl font-bold text-[var(--quaternary)] mb-2'>
                  Upload Link Created!
                </h3>
                <p className='text-[var(--neutral-600)]'>
                  Your link is ready to share with clients
                </p>
              </div>

              <div className='bg-[var(--neutral-50)] rounded-lg p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2 text-[var(--primary)] font-medium'>
                    <Globe className='w-4 h-4' />
                    {generatedUrl}
                  </div>
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={handleCopyUrl}
                      className='p-2 rounded-lg hover:bg-[var(--neutral-200)] transition-colors'
                    >
                      <Copy className='w-4 h-4 text-[var(--neutral-500)]' />
                    </button>
                    <button className='p-2 rounded-lg hover:bg-[var(--neutral-200)] transition-colors'>
                      <ExternalLink className='w-4 h-4 text-[var(--neutral-500)]' />
                    </button>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <button
                  onClick={() => {
                    onSuccess();
                    onClose();
                  }}
                  className='flex-1 px-6 py-3 bg-[var(--primary)] text-white rounded-lg 
                           hover:bg-[var(--primary)]/90 transition-colors font-medium'
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    setStep(1);
                    setFormData({
                      title: '',
                      slug: '',
                      description: '',
                      requireEmail: false,
                      requirePassword: false,
                      isPublic: true,
                      allowedFileTypes: [],
                      maxFileSize: '50',
                      password: '',
                      instructions: '',
                      autoCreateFolders: true,
                      linkType: 'custom',
                    });
                  }}
                  className='px-6 py-3 border border-[var(--neutral-200)] text-[var(--quaternary)] 
                           rounded-lg hover:bg-[var(--neutral-50)] transition-colors font-medium'
                >
                  Create Another
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {step < 3 && (
          <div className='flex items-center justify-between p-6 border-t border-[var(--neutral-200)]'>
            <button
              onClick={step === 1 ? onClose : () => setStep(1)}
              className='px-6 py-2 text-[var(--neutral-600)] hover:text-[var(--quaternary)] transition-colors'
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>

            <button
              onClick={step === 1 ? () => setStep(2) : handleSubmit}
              disabled={!formData.title || isSubmitting}
              className={`
                px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2
                ${
                  !formData.title || isSubmitting
                    ? 'bg-[var(--neutral-200)] text-[var(--neutral-500)] cursor-not-allowed'
                    : 'bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  Creating...
                </>
              ) : step === 1 ? (
                'Next'
              ) : (
                'Create Link'
              )}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
