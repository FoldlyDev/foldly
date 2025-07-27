'use client';

import { Skeleton } from '@/components/ui/feedback/skeleton-loader';

export function FilesSkeleton() {
  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <Skeleton className="h-8 sm:h-10 w-64 sm:w-80 mb-2" />
            <Skeleton className="h-5 sm:h-6 w-48 sm:w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Two Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Left Panel - File Tree */}
        <div className="lg:col-span-1">
          <div className="dashboard-card h-full">
            <div className="p-4 border-b">
              <Skeleton className="h-5 w-24 mb-3" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
            <div className="p-4 space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-2" style={{ marginLeft: `${(i % 3) * 16}px` }}>
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 flex-1 max-w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - File Grid */}
        <div className="lg:col-span-2">
          <div className="dashboard-card h-full">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-8 flex-1 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
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