'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/shadcn/badge';
import { Input } from '@/components/ui/aceternityui/input';
import { Button } from '@/components/ui/shadcn/button';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const handleAddEmail = () => {
    // TODO: Add validation logic
    if (inputValue.trim()) {
      onChange?.([...value, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    onChange?.(value.filter((email) => email !== emailToRemove));
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
      <div className="flex gap-2">
        <Input
          type="email"
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleAddEmail}
          disabled={disabled || !inputValue.trim()}
          size="icon"
          variant="secondary"
        >
          <Plus className="size-4" />
        </Button>
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
