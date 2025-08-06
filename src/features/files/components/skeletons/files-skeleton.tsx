'use client';

import { Skeleton } from '@/components/ui/feedback/skeleton-loader';

export function FilesSkeleton() {
  return (
    <div className="files-layout min-h-screen overflow-hidden">
      <div className="files-container">
        {/* Desktop: Two Panel Layout Skeleton */}
        <div className="hidden md:flex h-full gap-4">
          {/* Left Panel - Links List */}
          <div className="w-80 flex-shrink-0 rounded-lg border bg-card">
            {/* Header */}
            <div className="p-4 border-b">
              <Skeleton className="h-6 w-32 mb-3" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            
            {/* Links List */}
            <div className="p-2 space-y-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-3 rounded-md">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-1" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Files Grid */}
          <div className="flex-1 rounded-lg border bg-card">
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-7 w-48" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
              
              {/* Toolbar */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 flex-1 max-w-md rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>
            </div>

            {/* Files Grid */}
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...Array(18)].map((_, i) => (
                  <div key={i} className="group">
                    <div className="aspect-square rounded-lg overflow-hidden mb-2">
                      <Skeleton className="w-full h-full" />
                    </div>
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile: Single Panel Skeleton */}
        <div className="h-full md:hidden">
          {/* Mobile Header */}
          <div className="bg-card border-b p-4">
            <Skeleton className="h-6 w-32 mb-2" />
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
          
          {/* Mobile Tabs */}
          <div className="flex border-b bg-card">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-10 w-1/2" />
          </div>
          
          {/* Mobile Content */}
          <div className="flex-1 bg-card overflow-hidden">
            <div className="p-4 space-y-3">
              {/* Link items skeleton */}
              {[...Array(8)].map((_, i) => (
                <div key={i} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-1" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
