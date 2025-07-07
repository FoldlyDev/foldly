'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { GradientButton } from '@/components/ui';

interface CreateLinkFormButtonsProps {
  canGoNext: boolean;
  canGoPrevious: boolean;
  isSubmitting: boolean;
  onNext: () => void;
  onPrevious: () => void;
  nextLabel?: string;
  previousLabel?: string;
  showPrevious?: boolean;
}

/**
 * Navigation buttons for the create link form
 * Provides consistent button styling and behavior across steps
 */
export const CreateLinkFormButtons = ({
  canGoNext,
  canGoPrevious,
  isSubmitting,
  onNext,
  onPrevious,
  nextLabel = 'Next',
  previousLabel = 'Previous',
  showPrevious = true,
}: CreateLinkFormButtonsProps) => {
  return (
    <div className='flex justify-between items-center pt-6 border-t'>
      {/* Previous Button */}
      {showPrevious ? (
        <GradientButton
          onClick={onPrevious}
          disabled={!canGoPrevious || isSubmitting}
          variant='secondary'
          className='flex items-center gap-2'
        >
          <ArrowLeft className='w-4 h-4' />
          {previousLabel}
        </GradientButton>
      ) : (
        <div /> // Spacer
      )}

      {/* Next Button */}
      <GradientButton
        onClick={onNext}
        disabled={!canGoNext || isSubmitting}
        className='flex items-center gap-2'
      >
        {isSubmitting ? nextLabel : nextLabel}
        {!isSubmitting && <ArrowRight className='w-4 h-4' />}
      </GradientButton>
    </div>
  );
};
