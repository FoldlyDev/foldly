// Analytics Types for Foldly - Data Visualization and Metrics
// Feature-specific types for analytics and reporting functionality
// Following 2025 TypeScript best practices with strict type safety

import type { HexColor, DeepReadonly, ValidationError } from '@/types';

// Re-export database types
export type { DashboardOverview, LinkAccessLog, AccessAnalytics } from './database';

// =============================================================================
// ANALYTICS CONSTANTS
// =============================================================================

/**
 * Access log types for audit trail and analytics
 */
export const ACCESS_TYPE = {
  VIEW: 'view',
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  SHARE: 'share',
  DELETE: 'delete',
} as const satisfies Record<string, string>;

export type AccessType = (typeof ACCESS_TYPE)[keyof typeof ACCESS_TYPE];

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
// ANALYTICS DATA TYPES
// =============================================================================

/**
 * Usage statistics aggregation
 */
export interface UsageStats {
  readonly totalUploads: number;
  readonly totalFiles: number;
  readonly totalSize: number; // bytes
  readonly uniqueUploaders: number;
  readonly averageFilesPerUpload: number;
  readonly mostActiveLink?: string;
  readonly popularFileTypes: Record<string, number>;
}

/**
 * Analytics time period selector
 */
export type AnalyticsPeriod = '24h' | '7d' | '30d' | '90d' | '1y' | 'all';

/**
 * Time-series data point for charts (consolidated from global AnalyticsDataPoint)
 */
export interface ChartDataPoint {
  readonly x: string | number | Date;
  readonly y: number;
  readonly label?: string;
  readonly color?: HexColor;
  readonly timestamp?: Date; // For time-series compatibility
  readonly value?: number; // For backwards compatibility
}

// =============================================================================
// ANALYTICS COMPONENT PROPS
// =============================================================================

/**
 * Analytics dashboard component props
 */
export interface AnalyticsDashboardProps {
  readonly overview: DashboardOverview;
  readonly period: AnalyticsPeriod;
  readonly onPeriodChange: (period: AnalyticsPeriod) => void;
  readonly isLoading?: boolean;
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
// ANALYTICS UTILITIES
// =============================================================================

/**
 * Chart configuration options
 */
export interface ChartConfig {
  readonly type: ChartType;
  readonly showLegend?: boolean;
  readonly showGrid?: boolean;
  readonly animate?: boolean;
  readonly colors?: readonly HexColor[];
  readonly height?: number;
  readonly responsive?: boolean;
}

/**
 * Time range selector for analytics
 */
export interface TimeRange {
  readonly start: Date;
  readonly end: Date;
  readonly period: AnalyticsPeriod;
}

/**
 * Analytics filter options
 */
export interface AnalyticsFilter {
  readonly timeRange: TimeRange;
  readonly linkIds?: readonly string[];
  readonly fileTypes?: readonly string[];
  readonly uploaderEmails?: readonly string[];
}

// =============================================================================
// TYPE GUARDS FOR ANALYTICS
// =============================================================================

/**
 * Type guard for access types
 */
export const isValidAccessType = (type: unknown): type is AccessType => {
  return (
    typeof type === 'string' &&
    Object.values(ACCESS_TYPE).includes(type as AccessType)
  );
};

/**
 * Type guard for chart types
 */
export const isValidChartType = (type: unknown): type is ChartType => {
  return (
    typeof type === 'string' &&
    Object.values(CHART_TYPE).includes(type as ChartType)
  );
};

/**
 * Type guard for trend directions
 */
export const isValidTrendDirection = (
  direction: unknown
): direction is TrendDirection => {
  return (
    typeof direction === 'string' &&
    Object.values(TREND_DIRECTION).includes(direction as TrendDirection)
  );
};

/**
 * Type guard for analytics periods
 */
export const isValidAnalyticsPeriod = (
  period: unknown
): period is AnalyticsPeriod => {
  const validPeriods: AnalyticsPeriod[] = [
    '24h',
    '7d',
    '30d',
    '90d',
    '1y',
    'all',
  ];
  return (
    typeof period === 'string' &&
    validPeriods.includes(period as AnalyticsPeriod)
  );
};

// =============================================================================
// EXPORT ALL ANALYTICS TYPES
// =============================================================================

export * from './database';
export type * from './index';
