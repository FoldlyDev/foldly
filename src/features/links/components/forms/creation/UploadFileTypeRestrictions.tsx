'use client';

import { FileType } from 'lucide-react';
import { Button } from '@/components/ui/core/shadcn/button';
import { Badge } from '@/components/ui/core/shadcn/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/core/shadcn/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/core/shadcn/command';
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
  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium text-foreground flex items-center gap-2'>
        <FileType className='h-4 w-4 text-purple-600' />
        Allowed File Types (Select Multiple)
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            disabled={isLoading}
            className='w-full justify-between h-auto min-h-[40px] p-3'
          >
            <div className='flex flex-wrap gap-1'>
              {!formData.allowedFileTypes ||
              formData.allowedFileTypes.length === 0 ? (
                <span className='text-muted-foreground'>
                  All file types
                </span>
              ) : formData.allowedFileTypes.length <= 3 ? (
                formData.allowedFileTypes.map(type => {
                  const option = fileTypeOptions.find(
                    opt => opt.value === type
                  );
                  return (
                    <Badge
                      key={type}
                      variant='secondary'
                      className='text-xs'
                    >
                      {option?.label?.split(' ')[0] || type}
                    </Badge>
                  );
                })
              ) : (
                <Badge variant='secondary' className='text-xs'>
                  {formData.allowedFileTypes.length} types selected
                </Badge>
              )}
            </div>
            <svg
              className='w-4 h-4 text-muted-foreground shrink-0'
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
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className='w-full min-w-[320px] p-0'
          align='start'
        >
          <Command>
            <CommandInput placeholder='Search file types...' />
            <CommandList>
              <CommandEmpty>No file types found.</CommandEmpty>
              <CommandGroup>
                {fileTypeOptions.map(option => {
                  const allowedTypes = formData.allowedFileTypes || [];
                  const isSelected =
                    option.value === 'all'
                      ? allowedTypes.length === 0
                      : allowedTypes.includes(option.value);

                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => {
                        let newSelection: string[];

                        if (option.value === 'all') {
                          // If "all" is selected, clear all other selections
                          newSelection = [];
                        } else {
                          if (isSelected) {
                            // Remove from selection
                            newSelection = allowedTypes.filter(
                              (type: string) => type !== option.value
                            );
                          } else {
                            // Add to selection and remove "all" if present
                            newSelection = [
                              ...allowedTypes,
                              option.value,
                            ];
                          }
                        }

                        onDataChange({
                          allowedFileTypes: newSelection,
                        });
                      }}
                      className='cursor-pointer'
                    >
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50'
                        )}
                      >
                        {isSelected && (
                          <svg
                            className='h-3 w-3'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            <path
                              fillRule='evenodd'
                              d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                              clipRule='evenodd'
                            />
                          </svg>
                        )}
                      </div>
                      <span>{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {formData.allowedFileTypes &&
                formData.allowedFileTypes.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() =>
                          onDataChange({ allowedFileTypes: [] })
                        }
                        className='justify-center text-center cursor-pointer'
                      >
                        Clear all
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className='text-xs text-muted-foreground'>
        Select multiple file types that visitors can upload (as per{' '}
        <a
          href='https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/multiple'
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary hover:underline'
        >
          MDN documentation
        </a>
        )
      </p>
    </div>
  );
}