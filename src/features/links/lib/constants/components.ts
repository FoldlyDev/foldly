/**
 * Component Configuration Constants
 * Size mappings, CSS classes, and component-specific configurations
 * Following 2025 best practices with proper typing and const assertions
 */

/**
 * Component size configurations
 */
export const COMPONENT_SIZES = {
  linkTypeIcon: {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4' },
    md: { container: 'w-10 h-10', icon: 'w-5 h-5' },
    lg: { container: 'w-12 h-12', icon: 'w-6 h-6' },
  },
  statusIndicator: {
    sm: { classes: 'px-2 py-1 text-xs', dot: 'w-2 h-2' },
    md: { classes: 'px-3 py-1.5 text-sm', dot: 'w-2.5 h-2.5' },
  },
} as const;

/**
 * Animation and motion configurations
 */
export const ANIMATION_CONFIG = {
  cardEntry: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -20 },
    stagger: 0.1,
  },
  cardHover: {
    hover: { y: -4 },
    transition: { duration: 0.2 },
  },
  buttonPress: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
  },
  iconBounce: {
    whileHover: { scale: [1, 1.1, 1] },
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
  modal: {
    backdrop: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    content: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
  },
  stepTransition: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    duration: 0.3,
  },
} as const;

/**
 * Layout and spacing constants
 */
export const LAYOUT_CONFIG = {
  container: {
    maxWidth: 'max-w-7xl',
    padding: 'px-4 sm:px-6 lg:px-8',
    margin: 'mx-auto',
  },
  modal: {
    maxWidth: {
      sm: 'max-w-md',
      md: 'max-w-2xl',
      lg: 'max-w-4xl',
      xl: 'max-w-5xl',
    },
    height: 'max-h-[90vh]',
    overflow: 'overflow-y-auto',
  },
  card: {
    spacing: 'space-y-4',
    padding: 'p-4 sm:p-6',
    rounded: 'rounded-lg sm:rounded-xl',
    shadow: 'shadow-sm hover:shadow-lg',
  },
  grid: {
    responsive: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    gap: 'gap-4 sm:gap-6',
  },
} as const;

/**
 * Form control configurations
 */
export const FORM_CONFIG = {
  input: {
    base: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    error: 'border-red-300 focus:ring-red-500',
    disabled: 'bg-gray-100 cursor-not-allowed opacity-50',
  },
  label: {
    base: 'block text-sm font-medium text-gray-700 mb-1',
    required: 'after:content-["*"] after:text-red-500 after:ml-1',
  },
  errorMessage: 'text-sm text-red-600 mt-1',
  helpText: 'text-sm text-gray-500 mt-1',
  fieldGroup: 'space-y-4',
  buttonGroup: 'flex items-center gap-3 pt-6',
} as const;

/**
 * Status and state styling
 */
export const STATUS_STYLING = {
  active: {
    badge: 'bg-green-100 text-green-800 border-green-200',
    dot: 'bg-green-600',
    ring: 'ring-green-200',
  },
  paused: {
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    dot: 'bg-yellow-600',
    ring: 'ring-yellow-200',
  },
  expired: {
    badge: 'bg-red-100 text-red-800 border-red-200',
    dot: 'bg-red-600',
    ring: 'ring-red-200',
  },
  loading: {
    badge: 'bg-gray-100 text-gray-600 border-gray-200',
    dot: 'bg-gray-400',
    ring: 'ring-gray-200',
  },
} as const;

/**
 * Link type styling configurations
 */
export const LINK_TYPE_STYLING = {
  base: {
    container:
      'bg-gradient-to-br from-purple-100 to-blue-100 border-2 border-purple-200',
    icon: 'text-purple-600',
    card: 'border-l-4 border-l-purple-400 shadow-sm',
    ring: 'ring-purple-400',
  },
  topic: {
    container: 'bg-blue-100',
    icon: 'text-blue-600',
    card: 'border border-gray-200 hover:border-gray-300',
    ring: 'ring-blue-400',
  },
  custom: {
    container: 'bg-green-100',
    icon: 'text-green-600',
    card: 'border border-gray-200 hover:border-gray-300',
    ring: 'ring-green-400',
  },
} as const;


/**
 * Loading and skeleton configurations
 */
export const LOADING_CONFIG = {
  skeleton: {
    base: 'animate-pulse bg-gray-200 rounded',
    text: 'h-4 bg-gray-300 rounded mb-2',
    title: 'h-6 bg-gray-300 rounded mb-3',
    card: 'p-4 bg-gray-100 rounded-lg',
    button: 'h-10 bg-gray-300 rounded-lg',
  },
  spinner: {
    base: 'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  },
  overlay:
    'absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center',
} as const;

/**
 * Interactive element configurations
 */
export const INTERACTIVE_CONFIG = {
  button: {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline:
      'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  },
  link: {
    base: 'text-blue-600 hover:text-blue-800 underline',
    subtle: 'text-gray-600 hover:text-gray-800 hover:underline',
  },
  toggle: {
    base: 'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    enabled: 'bg-blue-600',
    disabled: 'bg-gray-200',
    thumb: 'inline-block h-4 w-4 transform rounded-full bg-white transition',
  },
} as const;

/**
 * Card and container styling
 */
export const CARD_STYLING = {
  base: 'bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200',
  elevated:
    'bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300',
  interactive: 'group cursor-pointer hover:bg-gray-50',
  selected: 'ring-2 ring-blue-400 ring-opacity-50',
  padding: {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  },
  spacing: {
    sm: 'space-y-2',
    md: 'space-y-3',
    lg: 'space-y-4',
  },
} as const;

/**
 * Typography and text styling
 */
export const TEXT_STYLING = {
  heading: {
    xl: 'text-2xl font-bold text-gray-900',
    lg: 'text-xl font-semibold text-gray-900',
    md: 'text-lg font-medium text-gray-900',
    sm: 'text-base font-medium text-gray-900',
  },
  body: {
    lg: 'text-base text-gray-700',
    md: 'text-sm text-gray-600',
    sm: 'text-xs text-gray-500',
  },
  muted: 'text-gray-500',
  accent: 'text-blue-600',
  error: 'text-red-600',
  success: 'text-green-600',
  warning: 'text-yellow-600',
} as const;

/**
 * Z-index layering
 */
export const Z_INDEX = {
  dropdown: 'z-10',
  modal: 'z-50',
  tooltip: 'z-60',
  overlay: 'z-40',
  notification: 'z-70',
} as const;
