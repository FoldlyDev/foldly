'use client';

import { Skeleton } from '@/components/ui/feedback/skeleton-loader';

export function SettingsSkeleton() {
  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header mb-8">
        <Skeleton className="h-8 sm:h-10 w-64 sm:w-80 mb-2" />
        <Skeleton className="h-5 sm:h-6 w-48 sm:w-72" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="dashboard-card">
            <div className="p-4">
              <Skeleton className="h-5 w-20 mb-4" />
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Section */}
          <div className="dashboard-card">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="dashboard-card">
            <div className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-36" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="dashboard-card">
            <div className="p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}