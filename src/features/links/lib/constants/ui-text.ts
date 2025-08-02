/**
 * UI Text Constants
 * All user-facing text, labels, and messages for the links feature
 * Following 2025 best practices with proper typing and const assertions
 */

import { DEFAULT_BASE_LINK_TITLE } from './base-link-defaults';

/**
 * Link type display names and descriptions
 */
export const LINK_TYPE_LABELS = {
  base: {
    name: 'Base link',
    description: 'Your main file collection link',
    title: 'Base link',
  },
  topic: {
    name: 'Topic Link',
    description: 'Specific topic-based collection',
    title: 'Topic Collection',
  },
  custom: {
    name: 'Custom Link',
    description: 'Custom file collection link',
    title: 'Custom Collection',
  },
} as const;

/**
 * Form labels and placeholders
 */
export const FORM_LABELS = {
  name: 'Link Name',
  title: 'Collection Title',
  topic: 'Topic',
  description: 'Description',
  instructions: 'Instructions',
  requireEmail: 'Require Email',
  requirePassword: 'Password Protection',
  password: 'Password',
  isPublic: 'Public Access',
  maxFiles: 'Maximum Files',
  maxFileSize: 'Maximum File Size',
  allowedFileTypes: 'Allowed File Types',
  autoCreateFolders: 'Auto-Create Folders',
  expiresAt: 'Expiration Date',
  brandingEnabled: 'Custom Branding',
  brandColor: 'Brand Color',
  accentColor: 'Accent Color',
  logoUrl: 'Logo URL',
} as const;

/**
 * Button text constants
 */
export const BUTTON_TEXT = {
  create: 'Create Link',
  creating: 'Creating Link...',
  save: 'Save Changes',
  saving: 'Saving...',
  saveAndClose: 'Save & Close',
  cancel: 'Cancel',
  close: 'Close',
  delete: 'Delete',
  deleting: 'Deleting...',
  duplicate: 'Duplicate',
  share: 'Share',
  copy: 'Copy',
  copyLink: 'Copy Link',
  openExternal: 'Open in New Tab',
  settings: 'Settings',
  viewDetails: 'View Details',
  editLink: 'Edit Link',
  pauseLink: 'Pause Link',
  activateLink: 'Activate Link',
  continueToXbranding: 'Continue to Branding',
  backToInformation: 'Back to Information',
  createBaseLink: 'Create Base Link',
  createTopicLink: 'Create Topic Link',
  refresh: 'Refresh',
  retry: 'Retry',
  downloadAll: 'Download All',
  extendExpiry: 'Extend Expiry',
  viewAnalytics: 'View Analytics',
  openEmailClient: 'Open Email Client',
} as const;

/**
 * Modal and section titles
 */
export const MODAL_TITLES = {
  createLink: 'Create New Link',
  editLink: 'Edit Link',
  linkDetails: 'Link Details',
  linkSettings: 'Link Settings',
  shareLink: 'Share Link',
  deleteConfirmation: 'Delete Link',
  bulkActions: 'Bulk Actions',
  generalSettings: 'General Settings',
  brandSettings: 'Brand Settings',
  performance: 'Performance',
  currentSettings: 'Current Settings',
  recentUploads: 'Recent Uploads',
  uploadPageMessage: 'Upload Page Message',
  quickActions: 'Quick Actions',
} as const;

/**
 * Status and state messages
 */
export const STATUS_MESSAGES = {
  active: 'Active',
  paused: 'Paused',
  expired: 'Expired',
  public: 'Public',
  private: 'Private',
  loading: 'Loading...',
  creating: 'Creating...',
  updating: 'Updating...',
  deleting: 'Deleting...',
  noData: 'No data available',
  error: 'Something went wrong',
  success: 'Operation completed successfully',
} as const;

/**
 * Empty state messages
 */
export const EMPTY_STATE_MESSAGES = {
  noLinks: {
    title: 'No links yet',
    description: 'Create your first upload link to get started',
    action: 'Create Link',
  },
  noUploads: {
    title: 'No uploads yet',
    description: 'Files uploaded to this link will appear here',
    action: 'Share Link',
  },
  noResults: {
    title: 'No results found',
    description: 'Try adjusting your search or filters',
    action: 'Clear Search',
  },
  linksUnavailable: {
    title: 'Links Unavailable',
    description: 'Unable to load your links at this time',
    action: 'Try Again',
  },
  // Base link setup
  baseSetup: {
    title: 'Set Up Your Base Link',
    subtitle: 'Your personal file collection hub',
    description:
      'Your base link unlocks custom topic links and makes file sharing effortless. Collect files from clients and collaborators with ease.',
    urlPreviewLabel: 'Your Base URL Preview',
  },
} as const;

/**
 * Notification and toast messages
 */
export const NOTIFICATION_MESSAGES = {
  linkCreated: 'Link created successfully!',
  linkUpdated: 'Link updated successfully!',
  linkDeleted: 'Link deleted successfully!',
  linkCopied: 'Link copied to clipboard!',
  settingsSaved: 'Settings saved successfully!',
  brandingUpdated: 'Branding updated successfully!',
  passwordUpdated: 'Password updated successfully!',
  createLinkFailed: 'Failed to create link. Please try again.',
  updateLinkFailed: 'Failed to update link. Please try again.',
  deleteLinkFailed: 'Failed to delete link. Please try again.',
  copyLinkFailed: 'Failed to copy link. Please try again.',
  saveSettingsFailed: 'Failed to save settings. Please try again.',
  userNotAvailable: 'User information not available',
  linkNotFound: 'Link not found',
  unauthorized: 'You are not authorized to perform this action',
} as const;

/**
 * Form step titles and descriptions
 */
export const FORM_STEPS = {
  information: {
    title: 'Link Information',
    description: 'Configure your link settings and upload requirements',
  },
  branding: {
    title: 'Branding & Appearance',
    description: 'Customize how your link looks to uploaders',
  },
  success: {
    title: 'Link Created!',
    description: 'Your link is ready to share',
  },
} as const;

/**
 * Metric and analytics labels
 */
export const METRICS_LABELS = {
  totalLinks: 'Total Links',
  activeLinks: 'Active Links',
  totalUploads: 'Total Uploads',
  totalViews: 'Total Views',
  uploads: 'Uploads',
  views: 'Views',
  files: 'Files',
  uniqueVisitors: 'Unique Visitors',
  conversionRate: 'Conversion Rate',
  lastActivity: 'Last Activity',
  created: 'Created',
  expires: 'Expires',
  uploadLinksCreated: 'Upload links created',
  currentlyAcceptingFiles: 'Currently accepting files',
  filesCollected: 'Files collected',
  linkPageVisits: 'Link page visits',
  smallFilesOnly: 'Small files only',
  standardDocuments: 'Standard documents',
  imagesAndDocs: 'Images and docs',
  highResImages: 'High-res images',
  largePresentations: 'Large presentations',
  videoClips: 'Video clips',
  largeVideoFiles: 'Large video files',
  veryLargeFiles: 'Very large files',
  maximumSize: 'Maximum size',
} as const;

/**
 * Accessibility labels and descriptions
 */
export const ACCESSIBILITY_LABELS = {
  linkStatusIndicator: 'Link status indicator',
  linkTypeIcon: 'Link type icon',
  linkVisibilityIndicator: 'Link visibility indicator',
  copyToClipboard: 'Copy to clipboard',
  openInNewTab: 'Open in new tab',
  shareViaEmail: 'Share via email',
  shareOnSocialMedia: 'Share on social media',
  downloadFile: 'Download file',
  deleteLink: 'Delete link',
  editLink: 'Edit link',
  pauseLink: 'Pause link',
  activateLink: 'Activate link',
  toggleSelection: 'Toggle selection',
  selectAll: 'Select all',
  clearSelection: 'Clear selection',
  sortBy: 'Sort by',
  filterBy: 'Filter by',
  switchView: 'Switch view',
  closeModal: 'Close modal',
  goBack: 'Go back',
  goNext: 'Go next',
} as const;

/**
 * Help text and tooltips
 */
export const HELP_TEXT = {
  requireEmail: 'Require uploaders to provide their email address',
  requirePassword: 'Protect your link with a password',
  publicAccess: 'Anyone with the link can access it',
  privateAccess: 'Only authorized users can access this link',
  autoCreateFolders: 'Automatically organize uploads by date',
  maxFiles: 'Maximum number of files that can be uploaded',
  maxFileSize: 'Maximum size for individual files',
  allowedFileTypes: 'Restrict uploads to specific file types',
  expirationDate: 'Link will stop accepting uploads after this date',
  brandingEnabled: 'Customize the appearance of your upload page',
  brandColor: 'Primary color for your branding',
  accentColor: 'Secondary color for accents and highlights',
  logoUrl: 'Custom logo to display on your upload page',
  customMessage: 'Welcome message shown to uploaders',
  description: "Brief description of what files you're collecting",
  instructions: 'Detailed instructions for uploaders',
} as const;

/**
 * Error messages for validation
 */
export const ERROR_MESSAGES = {
  required: 'This field is required',
  invalidEmail: 'Please enter a valid email address',
  invalidUrl: 'Please enter a valid URL',
  invalidColor: 'Please enter a valid hex color',
  passwordTooShort: 'Password must be at least 6 characters',
  passwordTooLong: 'Password must be less than 50 characters',
  nameTooShort: 'Name must be at least 1 character',
  nameTooLong: 'Name must be less than 100 characters',
  descriptionTooLong: 'Description must be less than 500 characters',
  topicInvalid:
    'Topic can only contain letters, numbers, hyphens, underscores, and spaces',
  slugInvalid:
    'URL can only contain letters, numbers, hyphens, and underscores',
  fileSizeInvalid: 'File size must be between 1KB and 1GB',
  fileCountInvalid: 'File count must be between 1 and 1000',
  slugTaken: 'This URL is already taken',
  linkExpired: 'Link has expired',
  linkInactive: 'Link is inactive',
  fileTypeNotAllowed: 'File type not allowed',
  fileTooLarge: 'File is too large',
  tooManyFiles: 'Too many files',
  emptyFile: 'File is empty',
  uploadFailed: 'Upload failed',
  networkError: 'Network error, please try again',
  serverError: 'Server error, please try again later',
  unauthorized: 'You are not authorized to perform this action',
  forbidden: 'Access denied',
  notFound: 'Resource not found',
  conflict: 'Conflict with existing data',
  rateLimited: 'Too many requests, please slow down',
  maintenanceMode: 'Service is temporarily unavailable',
} as const;

/**
 * Placeholder text for form fields
 */
export const PLACEHOLDER_TEXT = {
  linkName: DEFAULT_BASE_LINK_TITLE,
  topic: 'project-files',
  description: 'Upload your files here...',
  instructions: 'Please upload your files in the correct format...',
  password: 'Enter a secure password',
  customMessage: 'Welcome! Please upload your files below.',
  logoUrl: 'https://example.com/logo.png',
  brandColor: '#3B82F6',
  accentColor: '#10B981',
  search: 'Search links...',
  email: 'Enter your email address',
  fileName: 'document.pdf',
  folderName: 'My Folder',
  untitled: 'Untitled',
} as const;
