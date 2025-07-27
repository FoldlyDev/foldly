'use client';

import { usePathname } from 'next/navigation';
import { AnalyticsSkeleton } from '@/features/analytics/components/skeletons/analytics-skeleton';
import { LinksSkeleton } from '@/features/links/components/skeletons/links-skeleton';
import { FilesSkeleton } from '@/features/files/components/skeletons/files-skeleton';
import { ClerkUserProfileSkeleton } from '@/features/settings/components/skeletons';
import { WorkspaceSkeleton } from '@/features/workspace/components/skeletons/workspace-skeleton';

// Dashboard feature route mapping
const DASHBOARD_FEATURES = {
  '/dashboard/analytics': AnalyticsSkeleton,
  '/dashboard/links': LinksSkeleton,
  '/dashboard/files': FilesSkeleton,
  '/dashboard/settings': ClerkUserProfileSkeleton,
  '/dashboard/workspace': WorkspaceSkeleton,
  '/dashboard': WorkspaceSkeleton, // Default dashboard route
} as const;

type DashboardRoute = keyof typeof DASHBOARD_FEATURES;

export function DynamicDashboardSkeleton() {
  const pathname = usePathname();

  // Find the matching skeleton component
  const SkeletonComponent = DASHBOARD_FEATURES[pathname as DashboardRoute];

  // Fallback to workspace skeleton if route not found
  if (!SkeletonComponent) {
    return <WorkspaceSkeleton />;
  }

  return <SkeletonComponent />;
}

// Alternative approach using route detection
export function SmartDashboardSkeleton() {
  const pathname = usePathname();

  // Extract feature from pathname
  const getFeatureFromPath = (path: string): string => {
    const segments = path.split('/');
    return segments[2] || 'workspace'; // Default to workspace
  };

  const feature = getFeatureFromPath(pathname);

  switch (feature) {
    case 'analytics':
      return <AnalyticsSkeleton />;
    case 'links':
      return <LinksSkeleton />;
    case 'files':
      return <FilesSkeleton />;
    case 'settings':
      return <ClerkUserProfileSkeleton />;
    case 'workspace':
    default:
      return <WorkspaceSkeleton />;
  }
}

// Export the main component
export { DynamicDashboardSkeleton as default };