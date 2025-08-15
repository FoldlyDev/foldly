'use client';

import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/core/shadcn/button';

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
    <div className='modal-footer flex justify-between items-center'>
      {/* Previous Button */}
      {showPrevious ? (
        <Button
          onClick={onPrevious}
          disabled={!canGoPrevious || isSubmitting}
          variant='outline'
          className='flex items-center gap-2'
        >
          <ArrowLeft className='w-4 h-4' />
          {previousLabel}
        </Button>
      ) : (
        <div /> // Spacer
      )}

      {/* Next Button */}
      <Button
        onClick={onNext}
        disabled={!canGoNext || isSubmitting}
        className='flex items-center gap-2'
      >
        {isSubmitting ? (
          <>
            <Loader2 className='w-4 h-4 animate-spin' />
            {nextLabel}
          </>
        ) : (
          <>
            {nextLabel}
            <ArrowRight className='w-4 h-4' />
          </>
        )}
      </Button>
    </div>
  );
};
