'use client';

import { FileType, Check } from 'lucide-react';
import { Badge } from '@/components/ui/shadcn/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/animate-ui/radix/dropdown-menu';
import { cn } from '@/lib/utils/utils';

interface UploadFileTypeRestrictionsProps {
  formData: {
    allowedFileTypes?: string[];
  };
  onDataChange: (data: any) => void;
  fileTypeOptions: readonly { value: string; label: string }[];
  isLoading?: boolean;
}

export function UploadFileTypeRestrictions({
  formData,
  onDataChange,
  fileTypeOptions,
  isLoading = false,
}: UploadFileTypeRestrictionsProps) {
  const allowedTypes = formData.allowedFileTypes || [];

  const handleToggleFileType = (value: string) => {
    let newSelection: string[];

    if (value === 'all') {
      // If "all" is selected, clear all other selections
      newSelection = [];
    } else {
      const isSelected = allowedTypes.includes(value);
      if (isSelected) {
        // Remove from selection
        newSelection = allowedTypes.filter(type => type !== value);
      } else {
        // Add to selection
        newSelection = [...allowedTypes, value];
      }
    }

    onDataChange({ allowedFileTypes: newSelection });
  };

  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium text-foreground flex items-center gap-2'>
        <FileType className='h-4 w-4 text-purple-600' />
        Allowed File Types
      </label>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={isLoading}
          className='w-full flex items-center justify-between px-3 py-2 text-sm bg-background border border-border rounded-lg hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[40px] h-auto'
        >
          <div className='flex flex-wrap gap-1'>
            {allowedTypes.length === 0 ? (
              <span className='text-muted-foreground'>All file types</span>
            ) : allowedTypes.length <= 3 ? (
              allowedTypes.map(type => {
                const option = fileTypeOptions.find(opt => opt.value === type);
                return (
                  <Badge key={type} variant='secondary' className='text-xs'>
                    {option?.label?.split(' ')[0] || type}
                  </Badge>
                );
              })
            ) : (
              <Badge variant='secondary' className='text-xs'>
                {allowedTypes.length} types selected
              </Badge>
            )}
          </div>
          <svg
            className='w-4 h-4 text-muted-foreground shrink-0 ml-2'
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
        <DropdownMenuContent
          align='end'
          className='w-full min-w-[280px] max-h-[300px] overflow-y-auto'
        >
          {fileTypeOptions.map(option => {
            const isSelected =
              option.value === 'all'
                ? allowedTypes.length === 0
                : allowedTypes.includes(option.value);

            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleToggleFileType(option.value)}
                className='cursor-pointer'
              >
                <div className='flex items-center justify-between w-full'>
                  <span className='flex-1'>{option.label}</span>
                  {isSelected && (
                    <Check className='w-4 h-4 text-primary ml-2' />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}

          {allowedTypes.length > 0 && (
            <>
              <div className='h-px bg-border my-1' />
              <DropdownMenuItem
                onClick={() => onDataChange({ allowedFileTypes: [] })}
                className='cursor-pointer text-center justify-center text-muted-foreground'
              >
                Clear all
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <p className='text-xs text-muted-foreground'>
        Select file types that visitors can upload
      </p>
    </div>
  );
}
