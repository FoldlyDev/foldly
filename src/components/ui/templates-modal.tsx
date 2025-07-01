'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Button } from '@/components/ui/shadcn/button';
import { Badge } from '@/components/ui/shadcn/badge';
import { cn } from '@/lib/utils/utils';

interface Template {
  id: string;
  name: string;
  description: string;
  features: string[];
  category?: string;
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
  templates = defaultTemplates,
  className,
}: TemplatesModalProps) {
  const handleTemplateSelect = (template: Template) => {
    onSelectTemplate(template);
    onClose();
  };

  const categories = React.useMemo(() => {
    const cats = templates.reduce(
      (acc, template) => {
        const category = template.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(template);
        return acc;
      },
      {} as Record<string, Template[]>
    );

    return Object.entries(cats).sort(([a], [b]) => a.localeCompare(b));
  }, [templates]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn('max-w-4xl max-h-[80vh] overflow-hidden', className)}
      >
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold text-[var(--quaternary)]'>
            Link Templates
          </DialogTitle>
        </DialogHeader>

        <div className='overflow-y-auto flex-1 pr-2'>
          {categories.map(([category, categoryTemplates]) => (
            <div key={category} className='mb-8'>
              <h3 className='text-lg font-semibold text-[var(--quaternary)] mb-4 flex items-center gap-2'>
                {category}
                <Badge variant='secondary' className='text-xs'>
                  {categoryTemplates.length}
                </Badge>
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {categoryTemplates.map(template => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className='border border-[var(--neutral-200)] rounded-xl p-4 hover:border-[var(--primary)] hover:shadow-lg transition-all cursor-pointer group'
                    onClick={() => handleTemplateSelect(template)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <h4 className='font-semibold text-[var(--quaternary)] mb-2 group-hover:text-[var(--primary)] transition-colors'>
                      {template.name}
                    </h4>
                    <p className='text-[var(--neutral-600)] text-sm mb-3 line-clamp-2'>
                      {template.description}
                    </p>
                    <div className='flex flex-wrap gap-1'>
                      {template.features.map((feature, index) => (
                        <Badge
                          key={index}
                          variant='secondary'
                          className='text-xs bg-[var(--neutral-100)] text-[var(--neutral-600)] hover:bg-[var(--primary-subtle)] hover:text-[var(--primary)] transition-colors'
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer with action */}
        <div className='flex items-center justify-between pt-4 border-t border-[var(--neutral-200)]'>
          <p className='text-sm text-[var(--neutral-500)]'>
            Select a template to quickly set up your upload link
          </p>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { Template, TemplatesModalProps };
