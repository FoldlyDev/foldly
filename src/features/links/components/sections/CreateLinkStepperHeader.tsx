'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Info, Palette, Sparkles } from 'lucide-react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/animate-ui/radix/dialog';
import type { LinkType } from '@/lib/supabase/types';

// Local form step type
type CreateLinkStep = 'information' | 'branding' | 'success';

interface CreateLinkStepperHeaderProps {
  currentStep: CreateLinkStep;
  linkType: LinkType;
}

/**
 * Progress indicator and header for the create link modal
 * Shows current step and progress through the form
 */
export const CreateLinkStepperHeader = ({
  currentStep,
  linkType,
}: CreateLinkStepperHeaderProps) => {
  const steps = [
    { key: 'information', label: 'Information', icon: Info },
    { key: 'branding', label: 'Branding', icon: Palette },
    { key: 'success', label: 'Success', icon: Sparkles },
  ] as const;

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);

  const getStepTitle = () => {
    switch (currentStep) {
      case 'information':
        return linkType === 'base'
          ? 'Create Your Personal Collection'
          : 'Create New Topic Link';
      case 'branding':
        return 'Customize Your Link';
      case 'success':
        return 'Link Created Successfully!';
      default:
        return 'Create Link';
    }
  };
  const getStepDescription = () => {
    switch (currentStep) {
      case 'information':
        return linkType === 'base'
          ? 'Set up your personal file collection area'
          : 'Configure your topic-specific upload link';
      case 'branding':
        return 'Add your personal touch with colors and branding';
      case 'success':
        return 'Your link is ready to share!';
      default:
        return '';
    }
  };

  return (
    <DialogHeader>
      <div className='space-y-4 pt-6'>
        {/* Progress Steps */}
        <div className='flex flex-col items-center'>
          {/* Icons and connecting lines */}
          <div className='flex items-center justify-center'>
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isUpcoming = index > currentStepIndex;

              return (
                <div key={step.key} className='flex items-center'>
                  {/* Icon container with fixed width for alignment */}
                  <div className='flex justify-center w-10'>
                    <motion.div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-400'
                      }`}
                      initial={false}
                      animate={{
                        scale: isCurrent ? 1.1 : 1,
                        backgroundColor: isCompleted
                          ? '#10b981'
                          : isCurrent
                            ? '#3b82f6'
                            : '#e5e7eb',
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      {isCompleted ? (
                        <CheckCircle className='w-5 h-5' />
                      ) : (
                        <Icon className='w-5 h-5' />
                      )}
                    </motion.div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-20 h-0.5 mx-6 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Labels below icons */}
          <div className='flex justify-center mt-2'>
            {steps.map((step, index) => {
              const isCurrent = index === currentStepIndex;

              return (
                <div key={`${step.key}-label`} className='flex items-center'>
                  {/* Label container with matching width for perfect alignment */}
                  <div className='flex justify-center w-10'>
                    <span
                      className={`text-xs whitespace-nowrap ${
                        isCurrent
                          ? 'text-blue-600 font-medium'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && <div className='w-20 mx-6' />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Title and Description */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <DialogTitle className='text-2xl font-bold text-center'>
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription className='text-center text-gray-600 mt-2'>
            {getStepDescription()}
          </DialogDescription>
        </motion.div>
      </div>
    </DialogHeader>
  );
};
