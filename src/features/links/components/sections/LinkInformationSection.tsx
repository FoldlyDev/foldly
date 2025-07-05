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
  FolderOpen,
  HardDrive,
  FileType,
} from 'lucide-react';
import { Input } from '@/components/ui/shadcn/input';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { Switch } from '@/components/ui/shadcn/switch';
import { Button } from '@/components/ui/shadcn/button';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { Badge } from '@/components/ui/shadcn/badge';
import { Calendar as CalendarComponent } from '@/components/ui/shadcn/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/shadcn/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/shadcn/command';
import { Separator } from '@/components/ui/shadcn/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/animate-ui/radix/dropdown-menu';
import { format } from 'date-fns';
import { cn } from '@/lib/utils/utils';

// Use centralized types from the types folder
import type {
  ValidationError,
  LinkInformationFormData,
  FieldValidationErrors,
} from '../../types';

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

// Import centralized constants - Following 2025 best practices
import {
  FILE_TYPE_OPTIONS,
  FILE_SIZE_OPTIONS,
  DEFAULT_FILE_TYPES,
  DEFAULT_FILE_SIZES,
} from '../../constants';

// Transform centralized constants for local use
const fileOptions = [5, 10, 25, 50, 100];
const fileSizeOptions = FILE_SIZE_OPTIONS.map(option => ({
  value: parseInt(option.value),
  label: option.label,
}));
const fileTypeOptions = FILE_TYPE_OPTIONS;

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
                  Will be used in your URL: foldly.io/{username.toLowerCase()}
                  /[topic-name]
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
                    onChange={e => {
                      console.log(
                        '🔒 PASSWORD INPUT: Value changed to:',
                        e.target.value ? '[PASSWORD SET]' : '[PASSWORD EMPTY]'
                      );
                      onDataChange({ password: e.target.value });
                    }}
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
                  <span>{formData.maxFileSize} MB</span>
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

            {/* File Type Restrictions - Multi-Select */}
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
                      {formData.allowedFileTypes.length === 0 ? (
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
                          const isSelected =
                            option.value === 'all'
                              ? formData.allowedFileTypes.length === 0
                              : formData.allowedFileTypes.includes(
                                  option.value
                                );

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
                                    newSelection =
                                      formData.allowedFileTypes.filter(
                                        type => type !== option.value
                                      );
                                  } else {
                                    // Add to selection and remove "all" if present
                                    newSelection = [
                                      ...formData.allowedFileTypes,
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
                      {formData.allowedFileTypes.length > 0 && (
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

            {/* Auto-create Folders Toggle */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
              <div className='space-y-1'>
                <div className='flex items-center gap-2'>
                  <FolderOpen className='h-4 w-4 text-amber-600' />
                  <p className='text-sm font-medium text-foreground'>
                    Auto-organize Uploads
                  </p>
                </div>
                <p className='text-xs text-muted-foreground'>
                  Automatically organize uploads into folders by date (e.g.,
                  2024-01-15)
                </p>
              </div>
              <Switch
                checked={formData.autoCreateFolders}
                onCheckedChange={checked =>
                  onDataChange({ autoCreateFolders: checked })
                }
                disabled={isLoading}
                className='data-[state=unchecked]:bg-muted-foreground/20 cursor-pointer'
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
