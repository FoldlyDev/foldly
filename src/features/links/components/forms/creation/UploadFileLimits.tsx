'use client';

import { Users, HardDrive } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/marketing/animate-ui/radix/dropdown-menu';

interface UploadFileLimitsProps {
  formData: {
    maxFiles?: number;
    maxFileSize?: number;
  };
  onDataChange: (data: any) => void;
  fileOptions: number[];
  fileSizeOptions: Array<{ value: number; label: string }>;
  defaultMaxFileSize: number;
  isLoading?: boolean;
}

export function UploadFileLimits({
  formData,
  onDataChange,
  fileOptions,
  fileSizeOptions,
  defaultMaxFileSize,
  isLoading = false,
}: UploadFileLimitsProps) {
  return (
    <>
      {/* File Limit Dropdown */}
      <div className='space-y-2'>
        <label className='text-sm font-medium text-foreground flex items-center gap-2'>
          <Users className='h-4 w-4 text-teal-600' />
          Maximum Files
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={isLoading}
            className='w-full flex items-center justify-between px-3 py-2 text-sm bg-background border border-border rounded-lg hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
          >
            <span>{formData.maxFiles || 100} files</span>
            <svg
              className='w-4 h-4 text-muted-foreground'
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
          <DropdownMenuContent className='w-full min-w-[200px]'>
            {fileOptions.map(option => (
              <DropdownMenuItem
                key={option}
                onClick={() => onDataChange({ maxFiles: option })}
                className='cursor-pointer'
              >
                {option} files
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <p className='text-xs text-muted-foreground'>
          Maximum number of files visitors can upload
        </p>
      </div>

      {/* File Size Limit Dropdown */}
      <div className='space-y-2'>
        <label className='text-sm font-medium text-foreground flex items-center gap-2'>
          <HardDrive className='h-4 w-4 text-orange-600' />
          Maximum File Size
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={isLoading}
            className='w-full flex items-center justify-between px-3 py-2 text-sm bg-background border border-border rounded-lg hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
          >
            <span>{formData.maxFileSize || defaultMaxFileSize} MB</span>
            <svg
              className='w-4 h-4 text-muted-foreground'
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
          <DropdownMenuContent className='w-full min-w-[200px]'>
            {fileSizeOptions.map(option => (
              <DropdownMenuItem
                key={option.value}
                onClick={() =>
                  onDataChange({ maxFileSize: option.value })
                }
                className='cursor-pointer'
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <p className='text-xs text-muted-foreground'>
          Maximum size per file that visitors can upload
        </p>
      </div>
    </>
  );
}