'use client';

import { motion } from 'framer-motion';
import {
  Globe,
  MessageSquare,
  Users,
  Mail,
  Hash,
  Lock,
  Eye,
  EyeOff,
  Power,
  Calendar,
  CalendarIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/shadcn/input';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { Switch } from '@/components/ui/shadcn/switch';
import { Button } from '@/components/ui/shadcn/button';
import { Calendar as CalendarComponent } from '@/components/ui/shadcn/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/shadcn/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/animate-ui/radix/dropdown-menu';
import { format } from 'date-fns';
import { cn } from '@/lib/utils/utils';

// Import types from the correct locations
import type { ValidationError } from '@/components/ui/types';

// Simplified interface that extends what's needed from existing types
export interface LinkInformationFormData {
  readonly name: string; // Collection name for base link OR topic for topic link
  readonly description: string; // Description/Welcome message
  readonly requireEmail: boolean;
  readonly maxFiles: number;
  readonly isPublic: boolean; // Public/Private visibility
  readonly requirePassword: boolean; // Password protection toggle
  readonly password?: string; // Password if required
  readonly isActive: boolean; // Link active/inactive status
  readonly expiresAt?: Date; // Optional expiration date
}

interface LinkInformationSectionProps {
  readonly linkType: 'base' | 'topic';
  readonly username: string;
  readonly formData: LinkInformationFormData;
  readonly onDataChange: (data: Partial<LinkInformationFormData>) => void;
  readonly errors?: Partial<
    Record<keyof LinkInformationFormData, ValidationError>
  >;
  readonly isLoading?: boolean;
}

const FILE_SIZE_OPTIONS = [
  { value: 25, label: '25 files' },
  { value: 50, label: '50 files' },
  { value: 100, label: '100 files' },
  { value: 250, label: '250 files' },
  { value: 500, label: '500 files' },
] as const;

const fileOptions = [5, 10, 25, 50, 100];

export function LinkInformationSection({
  linkType,
  username,
  formData,
  onDataChange,
  errors,
  isLoading = false,
}: LinkInformationSectionProps) {
  const displayUrl =
    linkType === 'base'
      ? `foldly.io/${username}`
      : `foldly.io/${username}/${formData.name || '[topic-name]'}`;

  return (
    <div className='space-y-6'>
      {/* URL Preview Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className='relative'
      >
        <div className='rounded-lg border border-border bg-muted/30 p-4 sm:p-6'>
          <div className='flex flex-col sm:flex-row sm:items-center gap-3'>
            <div className='flex items-center gap-2 text-muted-foreground'>
              <Globe className='h-4 w-4 shrink-0' />
              <span className='text-sm font-medium'>Link Preview</span>
            </div>
            <div className='flex-1 min-w-0'>
              <div className='font-mono text-sm sm:text-base text-primary bg-background px-3 py-2 rounded border truncate'>
                {displayUrl}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Form Fields */}
      <div className='space-y-4 sm:space-y-6'>
        {/* Collection Name / Topic Field - Only for topic links */}
        {linkType === 'topic' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className='p-4 bg-card rounded-lg border border-border space-y-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-primary/10 rounded-lg'>
                  <Hash className='w-4 h-4 text-primary' />
                </div>
                <div>
                  <h3 className='font-medium text-foreground'>Topic Name</h3>
                  <p className='text-sm text-muted-foreground'>
                    Choose a name for your topic collection
                  </p>
                </div>
              </div>

              <div className='space-y-2'>
                <input
                  type='text'
                  value={formData.name}
                  onChange={e => onDataChange({ name: e.target.value })}
                  placeholder='e.g., resumes, portfolios, feedback'
                  disabled={isLoading}
                  className='w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed'
                />
                {errors?.name && (
                  <p className='text-sm text-destructive'>{errors.name}</p>
                )}
                <p className='text-xs text-muted-foreground'>
                  Will be used in your URL: foldly.io/{username}/[topic-name]
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Description Field */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className='p-4 bg-card rounded-lg border border-border space-y-4'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-blue-100 rounded-lg'>
                <MessageSquare className='w-4 h-4 text-blue-600' />
              </div>
              <div>
                <h3 className='font-medium text-foreground'>
                  Description / Custom Message
                </h3>
                <p className='text-sm text-muted-foreground'>
                  {linkType === 'base'
                    ? 'Add a welcome message for visitors to your collection'
                    : "Tell people what files you're looking for"}
                </p>
              </div>
            </div>

            <div className='space-y-2'>
              <textarea
                value={formData.description}
                onChange={e => onDataChange({ description: e.target.value })}
                placeholder={
                  linkType === 'base'
                    ? 'Share files with me easily...'
                    : 'What files are you looking for?'
                }
                disabled={isLoading}
                rows={3}
                className='w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed resize-none'
              />
              {errors?.description && (
                <p className='text-sm text-destructive'>{errors.description}</p>
              )}
              <p className='text-xs text-muted-foreground'>
                This will be displayed on your collection page (optional)
              </p>
            </div>
          </div>
        </motion.div>

        {/* Settings Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='space-y-4'
        >
          <h3 className='text-sm font-medium text-foreground'>Settings</h3>

          <div className='rounded-lg border border-border bg-card p-4 space-y-4'>
            {/* Expiry Date Field - Only for topic links */}
            {linkType === 'topic' && (
              <div className='space-y-2'>
                <label className='text-sm font-medium text-foreground flex items-center gap-2'>
                  <Calendar className='h-4 w-4 text-amber-600' />
                  Expiry Date (Optional)
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      disabled={isLoading}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.expiresAt && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className='w-4 h-4 mr-2' />
                      {formData.expiresAt ? (
                        format(formData.expiresAt, 'MMM d, yyyy')
                      ) : (
                        <span>Pick expiry date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0'>
                    <CalendarComponent
                      mode='single'
                      selected={formData.expiresAt}
                      onSelect={date => {
                        if (date) {
                          onDataChange({ expiresAt: date });
                        } else {
                          // Handle clearing the date by omitting the property
                          const { expiresAt: _, ...rest } = formData;
                          onDataChange(rest);
                        }
                      }}
                      disabled={date => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0); // Reset time to start of day
                        return date < today;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors?.expiresAt && (
                  <p className='text-sm text-destructive'>{errors.expiresAt}</p>
                )}
                <p className='text-xs text-muted-foreground'>
                  Link will stop accepting uploads after this date
                </p>
              </div>
            )}

            {/* Link Status Toggle */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
              <div className='space-y-1'>
                <div className='flex items-center gap-2'>
                  <Power className='h-4 w-4 text-green-600' />
                  <p className='text-sm font-medium text-foreground'>
                    Link Status
                  </p>
                </div>
                <p className='text-xs text-muted-foreground'>
                  Control whether this link is active and accepting uploads
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={checked => onDataChange({ isActive: checked })}
                disabled={isLoading}
                className='data-[state=unchecked]:bg-muted-foreground/20 cursor-pointer'
              />
            </div>

            {/* Visibility Toggle */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
              <div className='space-y-1'>
                <div className='flex items-center gap-2'>
                  {formData.isPublic ? (
                    <Eye className='h-4 w-4 text-blue-600' />
                  ) : (
                    <EyeOff className='h-4 w-4 text-orange-600' />
                  )}
                  <p className='text-sm font-medium text-foreground'>
                    Visibility
                  </p>
                </div>
                <p className='text-xs text-muted-foreground'>
                  {formData.isPublic
                    ? 'Link is public and discoverable'
                    : 'Link is private - only accessible via direct URL'}
                </p>
              </div>
              <Switch
                checked={formData.isPublic}
                onCheckedChange={checked => onDataChange({ isPublic: checked })}
                disabled={isLoading}
                className='data-[state=unchecked]:bg-muted-foreground/20 cursor-pointer'
              />
            </div>

            {/* Password Protection Toggle */}
            <div className='space-y-3'>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <Lock className='h-4 w-4 text-purple-600' />
                    <p className='text-sm font-medium text-foreground'>
                      Password Protection
                    </p>
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Require a password to access this link
                  </p>
                </div>
                <Switch
                  checked={formData.requirePassword}
                  onCheckedChange={checked =>
                    onDataChange({ requirePassword: checked })
                  }
                  disabled={isLoading}
                  className='data-[state=unchecked]:bg-muted-foreground/20 cursor-pointer'
                />
              </div>

              {/* Password Input - Shown when password protection is enabled */}
              {formData.requirePassword && (
                <div className='space-y-2 pl-6'>
                  <input
                    type='password'
                    value={formData.password || ''}
                    onChange={e => onDataChange({ password: e.target.value })}
                    placeholder='Enter password'
                    disabled={isLoading}
                    className='w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed'
                  />
                  <p className='text-xs text-muted-foreground'>
                    Visitors will need this password to access your link
                  </p>
                </div>
              )}
            </div>

            {/* Email Requirement Toggle */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
              <div className='space-y-1'>
                <div className='flex items-center gap-2'>
                  <Mail className='h-4 w-4 text-indigo-600' />
                  <p className='text-sm font-medium text-foreground'>
                    Require Email
                  </p>
                </div>
                <p className='text-xs text-muted-foreground'>
                  Visitors must provide their email before uploading
                </p>
              </div>
              <Switch
                checked={formData.requireEmail}
                onCheckedChange={checked =>
                  onDataChange({ requireEmail: checked })
                }
                disabled={isLoading}
                className='data-[state=unchecked]:bg-muted-foreground/20 cursor-pointer'
              />
            </div>

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
                  <span>{formData.maxFiles} files</span>
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
          </div>
        </motion.div>
      </div>
    </div>
  );
}
