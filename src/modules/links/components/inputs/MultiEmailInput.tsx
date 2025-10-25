'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/shadcn/badge';
import { Input } from '@/components/ui/aceternityui/input';
import { Button } from '@/components/ui/shadcn/button';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isValidEmail, isDuplicateEmail, normalizeEmail } from '@/lib/utils/validation-helpers';

// =============================================================================
// TYPES
// =============================================================================

export interface MultiEmailInputProps {
  value?: string[];
  onChange?: (emails: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function MultiEmailInput({
  value = [],
  onChange,
  placeholder = 'Enter email address...',
  className,
  disabled = false,
}: MultiEmailInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [error, setError] = React.useState<string>('');

  const handleAddEmail = () => {
    const email = inputValue.trim();

    // Clear previous error
    setError('');

    // Check if email is empty
    if (!email) {
      return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address (e.g., user@example.com)');
      return;
    }

    // Check for duplicates (case-insensitive)
    if (isDuplicateEmail(email, value)) {
      setError('This email has already been added');
      return;
    }

    // Add normalized email to list
    onChange?.([...value, normalizeEmail(email)]);
    setInputValue('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    onChange?.(value.filter((email) => email !== emailToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Badge Section - Display added emails */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((email) => (
            <Badge
              key={email}
              variant="secondary"
              className="pl-3 pr-1 py-1 text-sm"
            >
              <span className="mr-1">{email}</span>
              <button
                type="button"
                onClick={() => handleRemoveEmail(email)}
                disabled={disabled}
                className="ml-1 rounded-sm hover:bg-muted-foreground/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Remove ${email}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input Section - Add new email */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            type="email"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn('flex-1', error && 'border-destructive focus-visible:ring-destructive')}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'email-error' : undefined}
          />
          <Button
            type="button"
            onClick={handleAddEmail}
            disabled={disabled || !inputValue.trim()}
            size="icon"
            variant="secondary"
            aria-label="Add email"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {/* Error message */}
        {error && (
          <p id="email-error" className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Email count indicator */}
      {value.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {value.length} {value.length === 1 ? 'email' : 'emails'} added
        </p>
      )}
    </div>
  );
}
