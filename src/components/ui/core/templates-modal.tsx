'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  FileText,
  Users,
  Building,
  Palette,
  Calendar,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/marketing/animate-ui/radix/dialog';
import { ActionButton } from '@/components/ui/core/action-button';
import { Badge } from '@/components/ui/core/shadcn/badge';
import { cn } from '@/lib/utils/utils';

interface Template {
  id: string;
  name: string;
  description: string;
  features: string[];
  category?: string;
  icon?: React.ComponentType<{ className?: string }>;
  presets?: {
    requireEmail?: boolean;
    allowMultiple?: boolean;
    maxFileSize?: string;
    customMessage?: string;
  };
}

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
  templates?: Template[];
  className?: string;
}

const categoryIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Business: Building,
  Team: Users,
  Finance: FileText,
  Creative: Palette,
  HR: Users,
  Events: Calendar,
  Other: Sparkles,
};

const defaultTemplates: Template[] = [
  {
    id: 'client-onboarding',
    name: 'Client Onboarding',
    description:
      'Perfect for collecting initial project files from new clients',
    category: 'Business',
    features: [
      'Email required',
      'Multiple files',
      '50MB limit',
      'Custom branding',
    ],
    presets: {
      requireEmail: true,
      allowMultiple: true,
      maxFileSize: '50MB',
      customMessage:
        'Please upload your logo, brand guidelines, and initial project files.',
    },
  },
  {
    id: 'team-photos',
    name: 'Team Photos',
    description: 'Collect professional headshots from team members',
    category: 'Team',
    features: [
      'No email required',
      'Image files only',
      '25MB limit',
      'Auto-resize',
    ],
    presets: {
      requireEmail: false,
      allowMultiple: true,
      maxFileSize: '25MB',
      customMessage: 'Upload your professional headshot for the team page.',
    },
  },
  {
    id: 'invoice-collection',
    name: 'Invoice Collection',
    description: 'Secure collection of receipts and financial documents',
    category: 'Finance',
    features: [
      'Email required',
      'PDF/images only',
      '10MB limit',
      'Auto-organize',
    ],
    presets: {
      requireEmail: true,
      allowMultiple: false,
      maxFileSize: '10MB',
      customMessage:
        'Please upload your receipts and invoices for reimbursement.',
    },
  },
  {
    id: 'design-assets',
    name: 'Design Assets',
    description: 'Collect design files, mockups, and creative assets',
    category: 'Creative',
    features: [
      'Multiple files',
      'Large file support',
      '100MB limit',
      'Version control',
    ],
    presets: {
      requireEmail: true,
      allowMultiple: true,
      maxFileSize: '100MB',
      customMessage:
        'Share your design files, assets, and reference materials.',
    },
  },
  {
    id: 'portfolio-submissions',
    name: 'Portfolio Submissions',
    description: 'Collect portfolio pieces from applicants or freelancers',
    category: 'HR',
    features: [
      'Email required',
      'Multiple formats',
      '50MB limit',
      'Deadline setting',
    ],
    presets: {
      requireEmail: true,
      allowMultiple: true,
      maxFileSize: '50MB',
      customMessage:
        'Please upload your portfolio pieces and relevant work samples.',
    },
  },
  {
    id: 'event-photos',
    name: 'Event Photos',
    description: 'Collect photos from events, conferences, or gatherings',
    category: 'Events',
    features: [
      'No email required',
      'Images/videos only',
      '25MB limit',
      'Batch upload',
    ],
    presets: {
      requireEmail: false,
      allowMultiple: true,
      maxFileSize: '25MB',
      customMessage: 'Share your photos and videos from the event.',
    },
  },
];

export function TemplatesModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplatesModalProps) {
  const templates: Template[] = [
    {
      id: 'basic-collection',
      name: 'Basic File Collection',
      description: 'Simple file upload link with basic settings',
      category: 'Popular',
      icon: FileText,
      features: ['Basic upload', 'Email collection', 'File preview'],
      presets: {
        requireEmail: true,
        allowMultiple: true,
        maxFileSize: '25MB',
      },
    },
    {
      id: 'team-submission',
      name: 'Team Project Submission',
      description: 'Collect team project files with member identification',
      category: 'Business',
      icon: Users,
      features: [
        'Team member tracking',
        'Project categorization',
        'Deadline management',
      ],
      presets: {
        requireEmail: true,
        allowMultiple: false,
        maxFileSize: '100MB',
        customMessage: 'Please submit your team project files.',
      },
    },
    {
      id: 'client-portfolio',
      name: 'Client Portfolio Review',
      description: 'Professional portfolio collection for client feedback',
      category: 'Creative',
      icon: Palette,
      features: [
        'Portfolio organization',
        'Client feedback',
        'High-quality uploads',
      ],
      presets: {
        requireEmail: true,
        allowMultiple: true,
        maxFileSize: '250MB',
      },
    },
    {
      id: 'event-media',
      name: 'Event Media Collection',
      description: 'Gather photos and videos from events',
      category: 'Events',
      icon: Calendar,
      features: [
        'Event organization',
        'Media categorization',
        'Large file support',
      ],
      presets: {
        requireEmail: false,
        allowMultiple: true,
        maxFileSize: '500MB',
      },
    },
    {
      id: 'corporate-docs',
      name: 'Corporate Documents',
      description: 'Secure document collection for business processes',
      category: 'Business',
      icon: Building,
      features: ['Security focused', 'Document verification', 'Access control'],
      presets: {
        requireEmail: true,
        allowMultiple: false,
        maxFileSize: '50MB',
      },
    },
    {
      id: 'creative-assets',
      name: 'Creative Asset Collection',
      description: 'Collect design files, assets, and creative materials',
      category: 'Creative',
      icon: Sparkles,
      features: ['Asset organization', 'Version control', 'Creative workflow'],
      presets: {
        requireEmail: true,
        allowMultiple: true,
        maxFileSize: '500MB',
      },
    },
  ];

  const categories = ['All', 'Popular', 'Business', 'Creative', 'Events'];
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const filteredTemplates = templates.filter(
    template =>
      selectedCategory === 'All' || template.category === selectedCategory
  );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto bg-white'>
        <DialogHeader className='border-b border-[var(--neutral-200)] pb-6'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-[var(--primary-subtle)] rounded-lg flex items-center justify-center'>
              <Sparkles className='w-5 h-5 text-[var(--primary)]' />
            </div>
            <div>
              <DialogTitle className='text-xl font-bold text-[var(--quaternary)]'>
                Choose Template
              </DialogTitle>
              <DialogDescription className='text-[var(--neutral-500)] text-sm'>
                Select a pre-configured template to get started quickly
              </DialogDescription>
            </div>
          </div>

          {/* Category Filter */}
          <div className='pt-4'>
            <div className='flex flex-wrap gap-2'>
              {categories.map(category => (
                <ActionButton
                  key={category}
                  variant={
                    selectedCategory === category ? 'default' : 'outline'
                  }
                  size='sm'
                  onClick={() => setSelectedCategory(category)}
                  className='text-sm'
                >
                  {category}
                </ActionButton>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Templates Grid */}
        <div className='pt-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {filteredTemplates.map(template => {
              const IconComponent = template.icon || FileText;
              return (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className='border border-[var(--neutral-200)] rounded-xl p-4 hover:border-[var(--primary)] transition-all cursor-pointer group'
                  onClick={() => {
                    onSelectTemplate(template);
                    onClose();
                  }}
                >
                  <div className='flex items-start gap-3 mb-3'>
                    <div className='w-10 h-10 bg-[var(--primary-subtle)] rounded-lg flex items-center justify-center flex-shrink-0'>
                      <IconComponent className='w-5 h-5 text-[var(--primary)]' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <h3 className='font-semibold text-[var(--quaternary)] group-hover:text-[var(--primary)] transition-colors'>
                          {template.name}
                        </h3>
                        {template.category && (
                          <Badge
                            variant='secondary'
                            className='text-xs bg-[var(--neutral-100)] text-[var(--neutral-600)]'
                          >
                            {template.category}
                          </Badge>
                        )}
                      </div>
                      <p className='text-sm text-[var(--neutral-600)] mb-3'>
                        {template.description}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className='space-y-2'>
                    <div className='flex flex-wrap gap-1'>
                      {template.features.slice(0, 3).map(feature => (
                        <span
                          key={feature}
                          className='inline-flex items-center px-2 py-1 rounded-md text-xs bg-[var(--neutral-50)] text-[var(--neutral-600)]'
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* Presets Preview */}
                    {template.presets && (
                      <div className='text-xs text-[var(--neutral-500)] space-y-1'>
                        <div className='flex items-center gap-4'>
                          <span>
                            Email:{' '}
                            {template.presets.requireEmail
                              ? 'Required'
                              : 'Optional'}
                          </span>
                          <span>Max Size: {template.presets.maxFileSize}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className='pt-6 border-t border-[var(--neutral-100)] bg-[var(--neutral-50)] -mx-6 -mb-6 px-6 py-4'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-[var(--neutral-600)]'>
              {filteredTemplates.length} template
              {filteredTemplates.length !== 1 ? 's' : ''} available
            </p>
            <ActionButton variant='outline' onClick={onClose} className='px-6'>
              Cancel
            </ActionButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { Template, TemplatesModalProps };
