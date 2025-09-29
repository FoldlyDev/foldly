import React from 'react';
import { Skeleton } from '@/components/feedback/skeleton-loader';

export function FilesHeaderSkeleton() {
  return (
    <div className='files-header-content'>
      <div className='files-header-text'>
        <Skeleton className='h-8 sm:h-10 w-32 sm:w-40 mb-2' />
        <Skeleton className='h-5 sm:h-6 w-64 sm:w-80' />
      </div>
    </div>
  );
}

export function FilesSkeleton() {
  return (
    <div className="dashboard-container files-layout bg-background">
      {/* Files Header Skeleton */}
      <div className="files-header">
        <FilesHeaderSkeleton />
      </div>

      <div className="files-desktop-container">
        {/* Left Panel Skeleton */}
        <div className="files-left-panel">
          <div className="links-panel-container">
            <div className="links-panel-header">
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            
            <div className="links-panel-content">
              {/* Accordion Sections Skeleton */}
              {[1, 2, 3].map((section) => (
                <div key={section} className="link-section mb-4">
                  <div className="link-section-header">
                    <Skeleton className="h-5 w-32" />
                  </div>
                  {section === 1 && (
                    <div className="link-section-items">
                      {[1, 2].map((item) => (
                        <div key={item} className="link-item">
                          <Skeleton className="h-4 w-full" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel Skeleton */}
        <div className="files-right-panel">
          <div className="workspace-panel-container">
            <div className="workspace-panel-header">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            
            <div className="workspace-panel-content">
              {/* File Tree Skeleton */}
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>

            <div className="workspace-drop-zone">
              <div className="workspace-drop-area">
                <Skeleton className="h-8 w-8 mx-auto mb-2" />
                <Skeleton className="h-4 w-36 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}