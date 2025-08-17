'use client';

import * as React from 'react';
import { ActionButton } from './action-button';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

interface CopyButtonProps {
  value: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  children?: React.ReactNode;
  successDuration?: number;
  onCopy?: (value: string) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  showText?: boolean;
  iconOnly?: boolean;
}

export function CopyButton({
  value,
  className,
  size = 'icon',
  variant = 'ghost',
  children,
  successDuration = 2000,
  onCopy,
  onError,
  disabled = false,
  showText = false,
  iconOnly = true,
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (disabled || isLoading || !value) return;

    setIsLoading(true);

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopy?.(value);

      setTimeout(() => {
        setCopied(false);
      }, successDuration);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to copy');
      onError?.(err);
      console.error('Failed to copy to clipboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const content = React.useMemo(() => {
    if (copied) {
      return (
        <>
          <Check className='w-4 h-4 text-[var(--success-green)]' />
          {showText && (
            <span className='text-[var(--success-green)]'>Copied!</span>
          )}
        </>
      );
    }

    if (children) {
      return children;
    }

    return (
      <>
        <Copy className='w-4 h-4' />
        {showText && <span>Copy</span>}
      </>
    );
  }, [copied, children, showText]);

  return (
    <ActionButton
      onClick={handleCopy}
      disabled={disabled || isLoading}
      size={size}
      variant={variant}
      motionType='subtle'
      loading={isLoading}
      className={cn(
        'transition-colors duration-200',
        copied && 'text-[var(--success-green)]',
        className
      )}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
      aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {content}
    </ActionButton>
  );
}

// Simpler inline copy component for minimal use cases
interface InlineCopyProps {
  value: string;
  className?: string;
  iconClassName?: string;
}

export function InlineCopy({
  value,
  className,
  iconClassName,
}: InlineCopyProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center justify-center p-1 rounded-md transition-colors',
        'hover:bg-[var(--neutral-100)] text-[var(--neutral-500)] hover:text-[var(--quaternary)]',
        className
      )}
      title={copied ? 'Copied!' : 'Copy'}
    >
      {copied ? (
        <Check
          className={cn('w-3 h-3 text-[var(--success-green)]', iconClassName)}
        />
      ) : (
        <Copy className={cn('w-3 h-3', iconClassName)} />
      )}
    </button>
  );
}
