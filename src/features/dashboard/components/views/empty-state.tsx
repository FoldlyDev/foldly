'use client';

import { motion } from 'framer-motion';
import { GradientButton } from '@/components/ui';
import {
  Upload,
  FileText,
  Link2,
  Sparkles,
  ArrowRight,
  Zap,
  Target,
} from 'lucide-react';

interface EmptyStateProps {
  type: 'links' | 'files' | 'dashboard';
  onCreateLink?: () => void;
  onLearnMore?: () => void;
}

interface FeatureItem {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
}

interface BaseContentType {
  icon: React.ComponentType<any>;
  title: string;
  subtitle: string;
  description: string;
  primaryAction: string;
  secondaryAction: string;
  illustration: string;
}

interface DashboardContentType extends BaseContentType {
  features: FeatureItem[];
}

type ContentType = BaseContentType | DashboardContentType;

export function EmptyState({
  type,
  onCreateLink = () => {},
  onLearnMore = () => {},
}: EmptyStateProps) {
  const content: Record<'dashboard' | 'links' | 'files', ContentType> = {
    dashboard: {
      icon: Link2,
      title: 'Welcome to Foldly',
      subtitle: 'Zero-friction file collection made simple',
      description:
        'Create your personalized upload link (foldly.com/yourname) and start collecting files from clients, colleagues, and collaborators—no signups required for uploaders.',
      primaryAction: 'Create Your Base Link',
      secondaryAction: 'View Setup Guide',
      illustration: '🚀',
      features: [
        {
          icon: Link2,
          title: 'Base Link: /yourname',
          description:
            'Your main collection endpoint—perfect for general file requests',
        },
        {
          icon: Target,
          title: 'Custom Topic Links',
          description:
            'Project-specific links like /yourname/project for organized collections',
        },
        {
          icon: Zap,
          title: 'Zero-Friction Uploads',
          description:
            'Uploaders only need to provide their name—no accounts or logins',
        },
      ],
    } as DashboardContentType,
    links: {
      icon: Link2,
      title: 'No upload links yet',
      subtitle: 'Create your first collection link',
      description:
        'Upload links make it easy for others to send you files without needing an account or login.',
      primaryAction: 'Create Upload Link',
      secondaryAction: 'Learn More',
      illustration: '📎',
    } as BaseContentType,
    files: {
      icon: FileText,
      title: 'No files collected yet',
      subtitle: 'Your files will appear here',
      description:
        "Once someone uploads files through your links, they'll be organized and accessible here.",
      primaryAction: 'Create Upload Link',
      secondaryAction: 'View Links',
      illustration: '📁',
    } as BaseContentType,
  };

  const currentContent = content[type];
  const IconComponent = currentContent.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className='flex flex-col items-center justify-center py-16 px-8 text-center'
    >
      {/* Floating Illustration */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, duration: 0.6, type: 'spring', bounce: 0.4 }}
        className='mb-8'
      >
        <div className='relative'>
          {/* Background Glow */}
          <div
            className='absolute inset-0 bg-gradient-to-br from-[var(--primary)]/20 via-transparent to-[var(--secondary)]/20 
                        rounded-full blur-3xl scale-150'
          />

          {/* Main Icon Container */}
          <div
            className='relative bg-gradient-to-br from-[var(--primary-subtle)] to-white 
                        rounded-3xl p-8 border border-[var(--neutral-200)] shadow-lg'
          >
            <IconComponent className='w-16 h-16 text-[var(--primary)] mx-auto' />

            {/* Sparkle Effects */}
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              }}
              className='absolute -top-2 -right-2'
            >
              <Sparkles className='w-6 h-6 text-[var(--secondary)]' />
            </motion.div>

            <motion.div
              animate={{
                rotate: -360,
                scale: [1, 1.2, 1],
              }}
              transition={{
                rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
                scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
              }}
              className='absolute -bottom-1 -left-1'
            >
              <div className='w-3 h-3 bg-[var(--tertiary)] rounded-full opacity-60' />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className='max-w-2xl mx-auto mb-8'
      >
        <h2 className='text-3xl font-bold text-[var(--quaternary)] mb-3'>
          {currentContent.title}
        </h2>

        <p className='text-lg text-[var(--neutral-600)] mb-4 font-medium'>
          {currentContent.subtitle}
        </p>

        <p className='text-[var(--neutral-500)] leading-relaxed max-w-lg mx-auto'>
          {currentContent.description}
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className='flex flex-col sm:flex-row gap-4 items-center mb-12'
      >
        <GradientButton
          variant='primary'
          size='lg'
          onClick={onCreateLink}
          className='group shadow-brand'
        >
          {currentContent.primaryAction}
          <ArrowRight className='w-5 h-5 ml-2 transition-transform group-hover:translate-x-1' />
        </GradientButton>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLearnMore}
          className='px-6 py-3 text-[var(--neutral-600)] hover:text-[var(--quaternary)] 
                   font-medium transition-colors duration-200 rounded-xl
                   hover:bg-[var(--neutral-50)]'
        >
          {currentContent.secondaryAction}
        </motion.button>
      </motion.div>

      {/* Feature Highlights (enhanced for dashboard) */}
      {type === 'dashboard' && 'features' in currentContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto'
        >
          {currentContent.features.map(
            (feature: FeatureItem, index: number) => {
              const FeatureIcon = feature.icon;

              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.1, duration: 0.6 }}
                  className='text-center group'
                >
                  <div
                    className='inline-flex items-center justify-center w-14 h-14 rounded-2xl 
                              bg-gradient-to-br from-[var(--neutral-100)] to-[var(--neutral-50)]
                              text-[var(--neutral-600)] mb-4 group-hover:scale-110 transition-transform duration-300'
                  >
                    <FeatureIcon className='w-7 h-7' />
                  </div>

                  <h3 className='font-semibold text-[var(--quaternary)] mb-2 text-sm'>
                    {feature.title}
                  </h3>

                  <p className='text-[var(--neutral-500)] text-xs leading-relaxed max-w-xs mx-auto'>
                    {feature.description}
                  </p>
                </motion.div>
              );
            }
          )}
        </motion.div>
      )}

      {/* Value Proposition Banner */}
      {type === 'dashboard' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className='mt-12 p-6 bg-gradient-to-r from-[var(--primary-subtle)] to-[var(--secondary-subtle)]
                     rounded-2xl border border-[var(--neutral-200)] max-w-2xl mx-auto'
        >
          <div className='flex items-center justify-center gap-3 mb-3'>
            <Zap className='w-5 h-5 text-[var(--primary)]' />
            <span className='font-semibold text-[var(--quaternary)] text-sm'>
              Why Foldly Works
            </span>
          </div>
          <p className='text-[var(--neutral-600)] text-sm leading-relaxed'>
            Unlike traditional file sharing that requires uploaders to create
            accounts, Foldly eliminates friction with personalized links that
            anyone can use instantly.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
