'use client';

import { useState } from 'react';
import { FileType, Check, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/animate-ui/radix/dropdown-menu';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';

// Common file types for easy selection
export const FILE_TYPE_OPTIONS = [
  { value: '*', label: 'All Files', icon: '📄' },
  { value: 'image/*', label: 'Images', icon: '🖼️' },
  { value: 'video/*', label: 'Videos', icon: '🎬' },
  { value: 'audio/*', label: 'Audio', icon: '🎵' },
  { value: 'application/pdf', label: 'PDF Documents', icon: '📋' },
  {
    value:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    label: 'Word Documents',
    icon: '📝',
  },
  {
    value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    label: 'Excel Spreadsheets',
    icon: '📊',
  },
  {
    value:
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    label: 'PowerPoint Presentations',
    icon: '📈',
  },
  { value: 'text/*', label: 'Text Files', icon: '📃' },
  { value: 'application/zip', label: 'ZIP Archives', icon: '🗜️' },
] as const;

interface FileTypeSelectorProps {
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  disabled?: boolean;
  className?: string;
  maxSelections?: number;
}

export function FileTypeSelector({
  selectedTypes,
  onTypesChange,
  disabled = false,
  className = '',
  maxSelections,
}: FileTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Handle selection logic
  const handleTypeToggle = (type: string) => {
    if (type === '*') {
      // If "All Files" is selected, clear other selections
      onTypesChange(['*']);
      return;
    }

    let newTypes = [...selectedTypes];

    // Remove "All Files" if selecting specific types
    if (newTypes.includes('*')) {
      newTypes = newTypes.filter(t => t !== '*');
    }

    if (newTypes.includes(type)) {
      // Remove if already selected
      newTypes = newTypes.filter(t => t !== type);
      // If no types left, default to "All Files"
      if (newTypes.length === 0) {
        newTypes = ['*'];
      }
    } else {
      // Add if not selected and under limit
      if (!maxSelections || newTypes.length < maxSelections) {
        newTypes.push(type);
      }
    }

    onTypesChange(newTypes);
  };

  // Get display text for selected types
  const getDisplayText = () => {
    if (selectedTypes.includes('*')) {
      return 'All file types';
    }

    if (selectedTypes.length === 0) {
      return 'Select file types';
    }

    if (selectedTypes.length === 1) {
      const option = FILE_TYPE_OPTIONS.find(
        opt => opt.value === selectedTypes[0]
      );
      return option ? option.label : selectedTypes[0];
    }

    return `${selectedTypes.length} file types selected`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger
          disabled={disabled}
          className='w-full flex items-center justify-between px-3 py-2 text-sm bg-background border border-border rounded-lg hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
        >
          <div className='flex items-center gap-2'>
            <FileType className='h-4 w-4 text-purple-600' />
            <span>{getDisplayText()}</span>
          </div>
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 9l-7 7-7-7'
            />
          </svg>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-full min-w-[280px] max-h-80 overflow-y-auto'>
          {FILE_TYPE_OPTIONS.map(option => {
            const isSelected = selectedTypes.includes(option.value);
            const isAllFiles = option.value === '*';
            const isDisabled =
              disabled ||
              (maxSelections &&
                !isSelected &&
                !selectedTypes.includes('*') &&
                selectedTypes.length >= maxSelections);

            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => !isDisabled && handleTypeToggle(option.value)}
                className={`cursor-pointer flex items-center justify-between p-3 ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                } ${isSelected ? 'bg-accent' : ''}`}
              >
                <div className='flex items-center gap-3'>
                  <span className='text-lg'>{option.icon}</span>
                  <div>
                    <div className='text-sm font-medium'>{option.label}</div>
                    {isAllFiles && (
                      <div className='text-xs text-muted-foreground'>
                        Accept any file type
                      </div>
                    )}
                  </div>
                </div>
                {isSelected && <Check className='h-4 w-4 text-primary' />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Selected Types Display */}
      {selectedTypes.length > 0 && !selectedTypes.includes('*') && (
        <div className='flex flex-wrap gap-2'>
          {selectedTypes.map(type => {
            const option = FILE_TYPE_OPTIONS.find(opt => opt.value === type);
            return (
              <Badge
                key={type}
                variant='secondary'
                className='flex items-center gap-1 px-2 py-1'
              >
                <span>{option?.icon || '📄'}</span>
                <span className='text-xs'>{option?.label || type}</span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handleTypeToggle(type)}
                  className='h-auto p-0 ml-1 hover:bg-transparent'
                  disabled={disabled}
                >
                  <X className='h-3 w-3' />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Helper text */}
      <p className='text-xs text-muted-foreground'>
        {selectedTypes.includes('*')
          ? 'Visitors can upload any file type'
          : selectedTypes.length === 0
            ? 'Select which file types visitors can upload'
            : `Only ${selectedTypes.length} file type${selectedTypes.length > 1 ? 's' : ''} allowed`}
        {maxSelections && !selectedTypes.includes('*') && (
          <span className='ml-1'>(max {maxSelections} selections)</span>
        )}
      </p>
    </div>
  );
}
