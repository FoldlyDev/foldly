'use client';

import * as React from 'react';
import { Input } from '@/components/ui/aceternityui/input';
import { Label } from '@/components/ui/aceternityui/label';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface ColorPickerInputProps {
  value?: string;
  onChange?: (color: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ColorPickerInput({
  value = '#6c47ff',
  onChange,
  label,
  placeholder = '#000000',
  className,
  disabled = false,
}: ColorPickerInputProps) {
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let hexValue = e.target.value;

    // Ensure it starts with #
    if (!hexValue.startsWith('#')) {
      hexValue = `#${hexValue}`;
    }

    onChange?.(hexValue);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-sm font-medium">{label}</Label>
      )}

      <div className="flex items-center gap-3">
        {/* Native color picker */}
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={handleColorChange}
            disabled={disabled}
            className={cn(
              'size-10 rounded-md border border-input cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
              'bg-background'
            )}
          />
        </div>

        {/* Hex input */}
        <Input
          type="text"
          value={value}
          onChange={handleHexInput}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 font-mono text-sm"
          maxLength={7}
        />

        {/* Color preview with label */}
        <div className="flex items-center gap-2">
          <div
            className="size-8 rounded-md border border-input"
            style={{ backgroundColor: value }}
            aria-label="Color preview"
          />
        </div>
      </div>
    </div>
  );
}
