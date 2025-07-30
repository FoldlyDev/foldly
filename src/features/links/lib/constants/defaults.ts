/**
 * Default Values Constants
 * Default values for forms, components, and configurations
 * Following 2025 best practices with proper typing and const assertions
 */

import type { HexColor } from '@/types';

/**
 * Form default values
 */
export const FORM_DEFAULTS = {
  // Link creation defaults
  linkType: 'custom' as const,
  isPublic: true,
  requireEmail: false,
  requirePassword: false,
  password: '',
  autoCreateFolders: false,
  allowFolderCreation: true,

  // File upload defaults
  maxFiles: 100,
  maxFileSize: 5, // MB (Supabase deployment limit)
  allowedFileTypes: [] as string[],

  // Branding defaults
  brandingEnabled: false,
  brandColor: '#3B82F6' as HexColor,
  accentColor: '#10B981' as HexColor,
  logoUrl: '',

  // Text defaults
  title: '',
  topic: '',
  description: '',
  instructions: '',
  customMessage: '',
  welcomeMessage: '',
  customCss: '',
} as const;

/**
 * Component default props
 */
export const COMPONENT_DEFAULTS = {
  // Status indicator
  statusIndicator: {
    status: 'active' as const,
    size: 'sm' as const,
  },

  // Link type icon
  linkTypeIcon: {
    size: 'md' as const,
    isBaseLink: false,
  },

  // Visibility indicator
  visibilityIndicator: {
    size: 'sm' as const,
    isPublic: true,
  },

  // Loading states
  loading: {
    skeleton: {
      container: 'p-4 bg-gray-100 rounded-lg animate-pulse',
      primaryLine: 'h-4 bg-gray-300 rounded mb-2',
      secondaryLine: 'h-4 bg-gray-300 rounded w-2/3',
    },
  },

  // Pagination
  pagination: {
    currentPage: 1,
    pageSize: 20,
    maxPages: 10,
  },

  // Search
  search: {
    debounceMs: 300,
    minQueryLength: 2,
    maxResults: 50,
  },

  // Animation delays
  animation: {
    staggerDelay: 0.1,
    fadeInDuration: 0.3,
    hoverDuration: 0.2,
  },
} as const;

/**
 * Link data defaults
 */
export const LINK_DEFAULTS = {
  // Basic link properties
  status: 'active' as const,
  uploads: 0,
  views: 0,
  isPublic: true,
  requireEmail: false,
  requirePassword: false,
  maxFiles: 100,
  maxFileSize: 100 * 1024 * 1024, // 100MB in bytes
  allowedFileTypes: [] as readonly string[],
  autoCreateFolders: false,

  // Branding
  brandingEnabled: false,
  brandColor: '#3B82F6' as HexColor,
  accentColor: '#10B981' as HexColor,
  logoUrl: '',

  // Timestamps
  lastActivity: new Date().toISOString(),
  createdAt: new Date().toLocaleDateString(),

  // Settings
  settings: {
    allowMultiple: true,
    maxFileSize: '100MB',
    customMessage: '',
  },
} as const;

/**
 * Modal default configurations
 */
export const MODAL_DEFAULTS = {
  // Modal state
  isOpen: false,
  isLoading: false,
  error: null as string | null,

  // Modal data
  modalData: {
    linkData: undefined,
    linkId: undefined,
    linkType: undefined,
    selectedLinkIds: [] as string[],
    bulkAction: undefined,
  },

  // Branding context
  brandingContext: null as 'creation' | 'settings' | null,
  brandingFormData: {
    brandingEnabled: false,
    brandColor: '',
    accentColor: '',
    logoUrl: '',
  },
} as const;

/**
 * Store default states
 */
export const STORE_DEFAULTS = {
  // Links data store
  linksData: {
    links: [] as const,
    isLoading: false,
    error: null as string | null,
    lastFetch: null as Date | null,
  },

  // Links UI store
  linksUI: {
    viewMode: 'grid' as const,
    sortBy: 'createdAt' as const,
    sortDirection: 'desc' as const,
    searchQuery: '',
    filterStatus: 'all' as const,
    filterType: 'all' as const,
    isMultiSelectMode: false,
    selectedLinkIds: new Set<string>(),
    currentPage: 1,
    itemsPerPage: 20,
  },

  // Form store
  createLinkForm: {
    currentStep: 'information' as const,
    isValid: false,
    isSubmitting: false,
    createdLinkId: null as string | null,
    generatedUrl: null as string | null,
    fieldErrors: {} as Record<string, string>,
    generalError: null as string | null,
  },
} as const;

/**
 * API and service defaults
 */
export const API_DEFAULTS = {
  // Request timeouts
  timeout: {
    default: 30000, // 30 seconds
    upload: 300000, // 5 minutes
    download: 600000, // 10 minutes
  },

  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000, // 1 second
    backoff: 2, // exponential backoff multiplier
  },

  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
    defaultOffset: 0,
  },

  // Headers
  headers: {
    contentType: 'application/json',
    accept: 'application/json',
  },
} as const;

/**
 * Validation defaults
 */
export const VALIDATION_DEFAULTS = {
  // String lengths
  minLength: {
    name: 1,
    title: 1,
    topic: 1,
    password: 6,
    slug: 3,
  },

  maxLength: {
    name: 100,
    title: 200,
    topic: 50,
    description: 500,
    password: 50,
    slug: 30,
    instructions: 1000,
    customMessage: 500,
  },

  // Numeric limits
  limits: {
    minFiles: 1,
    maxFiles: 1000,
    minFileSize: 1024, // 1KB
    maxFileSize: 1000 * 1024 * 1024, // 1GB
    maxFilesPerUpload: 100,
  },

  // Pattern requirements
  patterns: {
    slug: /^[a-zA-Z0-9\-_]+$/,
    topic: /^[a-zA-Z0-9\-_\s]+$/,
    hexColor: /^#([0-9A-F]{3}){1,2}$/i,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  },
} as const;

/**
 * Theme and styling defaults
 */
export const THEME_DEFAULTS = {
  // Color palette
  colors: {
    primary: '#3B82F6',
    secondary: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Border radius
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },

  // Typography
  typography: {
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
} as const;

/**
 * Feature flags and experimental defaults
 */
export const FEATURE_DEFAULTS = {
  // Experimental features
  experimental: {
    advancedAnalytics: false,
    aiPoweredSuggestions: false,
    collaborativeEditing: false,
    realTimeUpdates: false,
  },

  // Performance optimizations
  performance: {
    virtualizedLists: true,
    lazyLoading: true,
    imageOptimization: true,
    caching: true,
  },

  // User preferences
  preferences: {
    defaultView: 'grid' as const,
    defaultSort: 'createdAt' as const,
    autoSave: true,
    notifications: true,
  },
} as const;
