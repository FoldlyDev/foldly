// Feature Types for Foldly - Component and State Management Types
// UI component props, state management, and feature-specific types
// Following 2025 TypeScript best practices with strict type safety

import type { ReactNode, MouseEvent, ChangeEvent, DragEvent } from 'react';
import type {
  LinkType,
  BatchStatus,
  FileProcessingStatus,
  HexColor,
  EmailAddress,
  SecurityWarning,
  AnalyticsPeriod,
  SubscriptionTier,
  UploaderInfo,
  UploadRequirements,
  LinkId,
  FileId,
  FolderId,
  BatchId,
  UserId,
  DeepReadonly,
  Result,
  NonEmptyArray,
} from '../global';

import type {
  UploadLink,
  Folder,
  FileUpload,
  UploadBatch,
  FolderTree,
  DashboardOverview,
} from '../database';

// =============================================================================
// BRANDED TYPES FOR FEATURES (2025 BEST PRACTICE)
// =============================================================================

export type ComponentId = string & { readonly __brand: 'ComponentId' };
export type ModalId = string & { readonly __brand: 'ModalId' };
export type NotificationId = string & { readonly __brand: 'NotificationId' };
export type FormFieldName = string & { readonly __brand: 'FormFieldName' };
export type ValidationError = string & { readonly __brand: 'ValidationError' };

// =============================================================================
// COMPONENT CONFIGURATION CONSTANTS (2025 CONST PATTERN)
// =============================================================================

/**
 * Component size variants using const assertion
 */
export const COMPONENT_SIZE = {
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
} as const satisfies Record<string, string>;

export type ComponentSize =
  (typeof COMPONENT_SIZE)[keyof typeof COMPONENT_SIZE];

/**
 * Component style variants using const assertion
 */
export const COMPONENT_VARIANT = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  TERTIARY: 'tertiary',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const satisfies Record<string, string>;

export type ComponentVariant =
  (typeof COMPONENT_VARIANT)[keyof typeof COMPONENT_VARIANT];

/**
 * Upload flow steps using const assertion
 */
export const UPLOAD_FLOW_STEP = {
  LINK_RESOLVE: 'link_resolve',
  PASSWORD: 'password',
  UPLOADER_INFO: 'uploader_info',
  FILE_SELECTION: 'file_selection',
  UPLOAD: 'upload',
  COMPLETE: 'complete',
} as const satisfies Record<string, string>;

export type UploadFlowStep =
  (typeof UPLOAD_FLOW_STEP)[keyof typeof UPLOAD_FLOW_STEP];

/**
 * Dashboard pages using const assertion
 */
export const DASHBOARD_PAGE = {
  HOME: 'home',
  LINKS: 'links',
  FILES: 'files',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
} as const satisfies Record<string, string>;

export type DashboardPage =
  (typeof DASHBOARD_PAGE)[keyof typeof DASHBOARD_PAGE];

/**
 * File view modes using const assertion
 */
export const FILE_VIEW_MODE = {
  LIST: 'list',
  GRID: 'grid',
} as const satisfies Record<string, string>;

export type FileViewMode = (typeof FILE_VIEW_MODE)[keyof typeof FILE_VIEW_MODE];

/**
 * UI notification types using const assertion (UI-specific, different from global notifications)
 */
export const UI_NOTIFICATION_TYPE = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const satisfies Record<string, string>;

export type UINotificationType =
  (typeof UI_NOTIFICATION_TYPE)[keyof typeof UI_NOTIFICATION_TYPE];

/**
 * Theme preferences using const assertion
 */
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
} as const satisfies Record<string, string>;

export type Theme = (typeof THEME)[keyof typeof THEME];

/**
 * Chart types for analytics using const assertion
 */
export const CHART_TYPE = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  AREA: 'area',
} as const satisfies Record<string, string>;

export type ChartType = (typeof CHART_TYPE)[keyof typeof CHART_TYPE];

/**
 * Trend directions using const assertion
 */
export const TREND_DIRECTION = {
  UP: 'up',
  DOWN: 'down',
  STABLE: 'stable',
} as const satisfies Record<string, string>;

export type TrendDirection =
  (typeof TREND_DIRECTION)[keyof typeof TREND_DIRECTION];

// =============================================================================
// UPLOAD FLOW TYPES (ENHANCED WITH 2025 PATTERNS)
// =============================================================================

/**
 * Upload flow state management with discriminated unions
 */
export interface UploadFlowState {
  readonly currentStep: UploadFlowStep;
  readonly linkData?: UploadLink;
  readonly requirements?: UploadRequirements;
  readonly uploaderInfo?: UploaderInfo;
  readonly selectedFiles: DeepReadonly<File[]>;
  readonly targetFolder?: Folder;
  readonly batch?: UploadBatch;
  readonly uploadProgress: DeepReadonly<Record<FileId, number>>; // fileId -> progress
  readonly errors: DeepReadonly<ValidationError[]>;
  readonly isLoading: boolean;
}

/**
 * Upload flow actions using discriminated union (2025 Best Practice)
 */
export type UploadFlowAction =
  | {
      readonly type: 'SET_LINK_DATA';
      readonly payload: {
        readonly link: UploadLink;
        readonly requirements: UploadRequirements;
      };
    }
  | {
      readonly type: 'SET_UPLOADER_INFO';
      readonly payload: UploaderInfo;
    }
  | {
      readonly type: 'ADD_FILES';
      readonly payload: DeepReadonly<File[]>;
    }
  | {
      readonly type: 'REMOVE_FILE';
      readonly payload: string; // file name
    }
  | {
      readonly type: 'SET_TARGET_FOLDER';
      readonly payload: Folder;
    }
  | {
      readonly type: 'START_UPLOAD';
      readonly payload: UploadBatch;
    }
  | {
      readonly type: 'UPDATE_PROGRESS';
      readonly payload: {
        readonly fileId: FileId;
        readonly progress: number;
      };
    }
  | {
      readonly type: 'SET_ERROR';
      readonly payload: ValidationError;
    }
  | {
      readonly type: 'CLEAR_ERRORS';
    }
  | {
      readonly type: 'RESET_FLOW';
    };

/**
 * File with preview and upload state
 */
export interface FileWithPreview extends File {
  readonly id: FileId;
  readonly preview?: string; // Data URL for images
  readonly uploadProgress?: number;
  readonly uploadStatus?: FileProcessingStatus;
  readonly error?: ValidationError;
}

/**
 * Drag and drop state with enhanced typing
 */
export interface DragDropState {
  readonly isDragActive: boolean;
  readonly isDragAccept: boolean;
  readonly isDragReject: boolean;
  readonly draggedItems?: DeepReadonly<Array<FileId | FolderId>>;
}

// =============================================================================
// DASHBOARD FEATURE TYPES (ENHANCED)
// =============================================================================

/**
 * Dashboard layout component props
 */
export interface DashboardLayoutProps {
  readonly children: ReactNode;
  readonly currentPage: DashboardPage;
  readonly user: DeepReadonly<{
    readonly id: UserId;
    readonly name: string;
    readonly email: EmailAddress;
    readonly avatarUrl?: string;
    readonly subscriptionTier: SubscriptionTier;
  }>;
}

/**
 * Link management component props
 */
export interface LinkCardProps {
  readonly link: UploadLink;
  readonly onEdit: (link: UploadLink) => void;
  readonly onDelete: (linkId: LinkId) => void;
  readonly onDuplicate: (link: UploadLink) => void;
  readonly onToggleStatus: (linkId: LinkId, isActive: boolean) => void;
  readonly showStatistics?: boolean;
  readonly isCompact?: boolean;
}

/**
 * File browser component props
 */
export interface FileBrowserProps {
  readonly files: DeepReadonly<FileUpload[]>;
  readonly folders: DeepReadonly<FolderTree[]>;
  readonly currentFolder?: Folder;
  readonly onNavigateToFolder: (folder: Folder) => void;
  readonly onSelectFiles: (fileIds: DeepReadonly<FileId[]>) => void;
  readonly onMoveFiles: (
    fileIds: DeepReadonly<FileId[]>,
    targetFolderId?: FolderId
  ) => void;
  readonly onDeleteFiles: (fileIds: DeepReadonly<FileId[]>) => void;
  readonly onCreateFolder: (name: string, parentId?: FolderId) => void;
  readonly isLoading?: boolean;
  readonly error?: ValidationError;
}

/**
 * Analytics dashboard component props
 */
export interface AnalyticsDashboardProps {
  readonly overview: DashboardOverview;
  readonly period: AnalyticsPeriod;
  readonly onPeriodChange: (period: AnalyticsPeriod) => void;
  readonly isLoading?: boolean;
}

// =============================================================================
// FORM AND INPUT TYPES (ENHANCED WITH 2025 PATTERNS)
// =============================================================================

/**
 * Form validation result using Result type
 */
export type FormValidationResult = Result<
  true,
  Record<FormFieldName, ValidationError>
>;

/**
 * Link creation/editing form state
 */
export interface LinkFormState {
  readonly title: string;
  readonly slug: string;
  readonly topic?: string;
  readonly description?: string;
  readonly instructions?: string;
  readonly linkType: LinkType;
  readonly requireEmail: boolean;
  readonly requirePassword: boolean;
  readonly password?: string;
  readonly confirmPassword?: string;
  readonly isPublic: boolean;
  readonly allowFolderCreation: boolean;
  readonly maxFiles: number;
  readonly maxFileSize: number; // MB for UI display
  readonly allowedFileTypes: DeepReadonly<string[]>;
  readonly expiresAt?: Date;
  readonly errors: DeepReadonly<Record<FormFieldName, ValidationError>>;
  readonly isValid: boolean;
  readonly isSubmitting: boolean;
}

/**
 * Folder creation form state
 */
export interface FolderFormState {
  readonly name: string;
  readonly description?: string;
  readonly color?: HexColor;
  readonly parentFolderId?: FolderId;
  readonly isPublic: boolean;
  readonly errors: DeepReadonly<Record<FormFieldName, ValidationError>>;
  readonly isValid: boolean;
  readonly isSubmitting: boolean;
}

/**
 * Upload info form state (for uploaders)
 */
export interface UploaderFormState {
  readonly name: string;
  readonly email?: EmailAddress;
  readonly message?: string;
  readonly batchName?: string;
  readonly errors: DeepReadonly<Record<FormFieldName, ValidationError>>;
  readonly isValid: boolean;
  readonly isSubmitting: boolean;
}

// =============================================================================
// UI COMPONENT PROPS (ENHANCED WITH STRICT TYPING)
// =============================================================================

/**
 * Enhanced modal component props
 */
export interface ModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title?: string;
  readonly children: ReactNode;
  readonly size?: ComponentSize;
  readonly showCloseButton?: boolean;
  readonly closeOnOverlayClick?: boolean;
  readonly closeOnEscapeKey?: boolean;
  readonly className?: string;
}

/**
 * Enhanced button component props
 */
export interface ButtonProps {
  readonly children: ReactNode;
  readonly variant?: ComponentVariant;
  readonly size?: ComponentSize;
  readonly isLoading?: boolean;
  readonly isDisabled?: boolean;
  readonly onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly className?: string;
  readonly startIcon?: ReactNode;
  readonly endIcon?: ReactNode;
  readonly 'aria-label'?: string;
}

/**
 * Enhanced input component props
 */
export interface InputProps {
  readonly value: string;
  readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly type?: 'text' | 'email' | 'password' | 'number' | 'url';
  readonly placeholder?: string;
  readonly label?: string;
  readonly error?: ValidationError;
  readonly isRequired?: boolean;
  readonly isDisabled?: boolean;
  readonly size?: ComponentSize;
  readonly className?: string;
  readonly startAdornment?: ReactNode;
  readonly endAdornment?: ReactNode;
  readonly 'aria-describedby'?: string;
}

/**
 * Enhanced file upload component props
 */
export interface FileUploadProps {
  readonly onFilesSelected: (files: DeepReadonly<File[]>) => void;
  readonly acceptedFileTypes?: DeepReadonly<string[]>;
  readonly maxFiles?: number;
  readonly maxFileSize?: number; // bytes
  readonly multiple?: boolean;
  readonly disabled?: boolean;
  readonly children?: ReactNode;
  readonly className?: string;
  readonly onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
  readonly onDrop?: (event: DragEvent<HTMLDivElement>) => void;
}

/**
 * Enhanced progress component props
 */
export interface ProgressProps {
  readonly value: number; // 0-100
  readonly max?: number;
  readonly size?: ComponentSize;
  readonly variant?: ComponentVariant;
  readonly showLabel?: boolean;
  readonly label?: string;
  readonly className?: string;
  readonly 'aria-label'?: string;
}

// =============================================================================
// APPLICATION STATE MANAGEMENT (ENHANCED)
// =============================================================================

/**
 * Main application state structure
 */
export interface AppState {
  readonly user: UserState;
  readonly links: LinksState;
  readonly files: FilesState;
  readonly folders: FoldersState;
  readonly upload: UploadFlowState;
  readonly ui: UIState;
}

/**
 * User state section
 */
export interface UserState {
  readonly isAuthenticated: boolean;
  readonly profile?: DeepReadonly<{
    readonly id: UserId;
    readonly email: EmailAddress;
    readonly firstName?: string;
    readonly lastName?: string;
    readonly avatarUrl?: string;
    readonly subscriptionTier: SubscriptionTier;
  }>;
  readonly loading: boolean;
  readonly error?: ValidationError;
}

/**
 * Links state with enhanced filtering and sorting
 */
export interface LinksState {
  readonly items: DeepReadonly<UploadLink[]>;
  readonly selectedItems: DeepReadonly<LinkId[]>;
  readonly filter: DeepReadonly<{
    readonly search: string;
    readonly linkType?: LinkType;
    readonly isActive?: boolean;
  }>;
  readonly sort: DeepReadonly<{
    readonly field: 'createdAt' | 'title' | 'totalUploads' | 'lastUploadAt';
    readonly direction: 'asc' | 'desc';
  }>;
  readonly pagination: DeepReadonly<{
    readonly page: number;
    readonly pageSize: number;
    readonly totalItems: number;
  }>;
  readonly loading: boolean;
  readonly error?: ValidationError;
}

/**
 * Files state with enhanced filtering and sorting
 */
export interface FilesState {
  readonly items: DeepReadonly<FileUpload[]>;
  readonly selectedItems: DeepReadonly<FileId[]>;
  readonly viewMode: FileViewMode;
  readonly filter: DeepReadonly<{
    readonly search: string;
    readonly fileType?: string;
    readonly folderId?: FolderId;
    readonly batchId?: BatchId;
  }>;
  readonly sort: DeepReadonly<{
    readonly field: 'createdAt' | 'fileName' | 'fileSize' | 'downloadCount';
    readonly direction: 'asc' | 'desc';
  }>;
  readonly pagination: DeepReadonly<{
    readonly page: number;
    readonly pageSize: number;
    readonly totalItems: number;
  }>;
  readonly loading: boolean;
  readonly error?: ValidationError;
}

/**
 * Folders state management
 */
export interface FoldersState {
  readonly items: DeepReadonly<FolderTree[]>;
  readonly currentFolder?: Folder;
  readonly loading: boolean;
  readonly error?: ValidationError;
}

/**
 * UI state management
 */
export interface UIState {
  readonly theme: Theme;
  readonly sidebarCollapsed: boolean;
  readonly modals: DeepReadonly<Record<ModalId, boolean>>;
  readonly notifications: DeepReadonly<ToastNotification[]>;
}

// =============================================================================
// EVENT HANDLERS (ENHANCED WITH PROPER TYPING)
// =============================================================================

/**
 * File operation event handlers
 */
export interface FileEventHandlers {
  readonly onFileSelect: (files: DeepReadonly<File[]>) => void;
  readonly onFileRemove: (fileId: FileId) => void;
  readonly onFileMove: (fileId: FileId, targetFolderId?: FolderId) => void;
  readonly onFileDelete: (fileId: FileId) => void;
  readonly onFileDownload: (fileId: FileId) => void;
  readonly onFileRename: (fileId: FileId, newName: string) => void;
}

/**
 * Folder operation event handlers
 */
export interface FolderEventHandlers {
  readonly onFolderCreate: (name: string, parentId?: FolderId) => void;
  readonly onFolderUpdate: (
    folderId: FolderId,
    updates: Partial<Folder>
  ) => void;
  readonly onFolderDelete: (folderId: FolderId) => void;
  readonly onFolderMove: (
    folderId: FolderId,
    targetParentId?: FolderId
  ) => void;
  readonly onFolderNavigate: (folderId: FolderId) => void;
}

/**
 * Link operation event handlers
 */
export interface LinkEventHandlers {
  readonly onLinkCreate: (linkData: Partial<UploadLink>) => void;
  readonly onLinkUpdate: (linkId: LinkId, updates: Partial<UploadLink>) => void;
  readonly onLinkDelete: (linkId: LinkId) => void;
  readonly onLinkDuplicate: (linkId: LinkId) => void;
  readonly onLinkToggle: (linkId: LinkId, isActive: boolean) => void;
}

// =============================================================================
// NOTIFICATION SYSTEM (ENHANCED)
// =============================================================================

/**
 * Toast notification with enhanced typing
 */
export interface ToastNotification {
  readonly id: NotificationId;
  readonly type: UINotificationType;
  readonly title: string;
  readonly message?: string;
  readonly duration?: number; // auto-dismiss time in ms
  readonly isClosable?: boolean;
  readonly actions?: DeepReadonly<
    Array<{
      readonly label: string;
      readonly onClick: () => void;
    }>
  >;
  readonly timestamp: Date;
}

/**
 * Security warning display props
 */
export interface SecurityWarningProps {
  readonly warnings: DeepReadonly<SecurityWarning[]>;
  readonly onAccept: () => void;
  readonly onReject: () => void;
  readonly showDetails?: boolean;
}

// =============================================================================
// ANALYTICS AND CHARTS (ENHANCED)
// =============================================================================

/**
 * Chart data point with enhanced typing
 */
export interface ChartDataPoint {
  readonly x: string | number | Date;
  readonly y: number;
  readonly label?: string;
  readonly color?: HexColor;
}

/**
 * Analytics widget component props
 */
export interface AnalyticsWidgetProps {
  readonly title: string;
  readonly data: DeepReadonly<ChartDataPoint[]>;
  readonly type: ChartType;
  readonly period: AnalyticsPeriod;
  readonly isLoading?: boolean;
  readonly error?: ValidationError;
  readonly className?: string;
}

/**
 * Usage metrics display with trend information
 */
export interface UsageMetricsDisplay {
  readonly current: number;
  readonly limit?: number;
  readonly percentage: number;
  readonly label: string;
  readonly unit: string;
  readonly trend?: TrendDirection;
  readonly trendPercentage?: number;
}

// =============================================================================
// TYPE GUARDS FOR RUNTIME VALIDATION (2025 BEST PRACTICE)
// =============================================================================

/**
 * Type guard for component sizes
 */
export const isValidComponentSize = (size: unknown): size is ComponentSize => {
  return (
    typeof size === 'string' &&
    Object.values(COMPONENT_SIZE).includes(size as ComponentSize)
  );
};

/**
 * Type guard for component variants
 */
export const isValidComponentVariant = (
  variant: unknown
): variant is ComponentVariant => {
  return (
    typeof variant === 'string' &&
    Object.values(COMPONENT_VARIANT).includes(variant as ComponentVariant)
  );
};

/**
 * Type guard for upload flow steps
 */
export const isValidUploadFlowStep = (
  step: unknown
): step is UploadFlowStep => {
  return (
    typeof step === 'string' &&
    Object.values(UPLOAD_FLOW_STEP).includes(step as UploadFlowStep)
  );
};

/**
 * Type guard for dashboard pages
 */
export const isValidDashboardPage = (page: unknown): page is DashboardPage => {
  return (
    typeof page === 'string' &&
    Object.values(DASHBOARD_PAGE).includes(page as DashboardPage)
  );
};

/**
 * Type guard for UI notification types
 */
export const isValidUINotificationType = (
  type: unknown
): type is UINotificationType => {
  return (
    typeof type === 'string' &&
    Object.values(UI_NOTIFICATION_TYPE).includes(type as UINotificationType)
  );
};

/**
 * Result type for feature operations (2025 Best Practice)
 */
export type FeatureResult<T> = Result<T, ValidationError>;

/**
 * Utility type for form field validation
 */
export type FormFieldValidation<T extends Record<string, unknown>> = {
  readonly [K in keyof T]: FeatureResult<T[K]>;
};

// =============================================================================
// EXPORT ALL FEATURE TYPES
// =============================================================================

export type * from './index';
