'use client';

import React, { useRef, useState, useEffect } from 'react';
import { UnifiedCloudTree } from '../trees/UnifiedCloudTree';
import { useCloudViewStore } from '../../stores/cloud-view-store';
import { cn } from '@/lib/utils';

export function SplitPaneManager() {
  const {
    leftProvider,
    centerProvider,
    rightProvider,
    setLeftProvider,
    setCenterProvider,
    setRightProvider,
    splitSizes,
    setSplitSizes,
    activePane,
    setActivePane,
  } = useCloudViewStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'left' | 'right' | null>(null);

  const handleMouseDown = (divider: 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(divider);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const x = e.clientX - containerRef.current.offsetLeft;
      const percentage = (x / containerWidth) * 100;

      if (isDragging === 'left') {
        // Adjusting left divider
        const newLeft = Math.max(20, Math.min(40, percentage));
        const newCenter = splitSizes[1] + (splitSizes[0] - newLeft);
        const newRight = splitSizes[2];
        setSplitSizes([newLeft, newCenter, newRight]);
      } else {
        // Adjusting right divider
        const rightStart = splitSizes[0] + splitSizes[1];
        const newRightStart = Math.max(60, Math.min(80, percentage));
        const newCenter = newRightStart - splitSizes[0];
        const newRight = 100 - newRightStart;
        setSplitSizes([splitSizes[0], newCenter, newRight]);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, splitSizes, setSplitSizes]);

  return (
    <div ref={containerRef} className="flex h-full relative">
      {/* Left Pane */}
      <div
        className={cn(
          'border-r bg-background transition-colors',
          activePane === 'left' && 'ring-2 ring-primary ring-inset'
        )}
        style={{ width: `${splitSizes[0]}%` }}
        onClick={() => setActivePane('left')}
      >
        <div className="h-full flex flex-col">
          <div className="border-b p-3">
            <h3 className="text-sm font-medium">
              {leftProvider === 'google-drive' ? 'Google Drive' : 
               leftProvider === 'onedrive' ? 'OneDrive' : 'Select Provider'}
            </h3>
          </div>
          <div className="flex-1 overflow-hidden">
            <UnifiedCloudTree
              provider={leftProvider}
              onProviderChange={setLeftProvider}
            />
          </div>
        </div>
      </div>

      {/* Left Divider */}
      <div
        className={cn(
          'w-1 cursor-col-resize hover:bg-primary/20 transition-colors',
          isDragging === 'left' && 'bg-primary/30'
        )}
        onMouseDown={handleMouseDown('left')}
      />

      {/* Center Pane */}
      <div
        className={cn(
          'bg-background transition-colors',
          activePane === 'center' && 'ring-2 ring-primary ring-inset'
        )}
        style={{ width: `${splitSizes[1]}%` }}
        onClick={() => setActivePane('center')}
      >
        <div className="h-full flex flex-col">
          <div className="border-b p-3">
            <h3 className="text-sm font-medium">
              {centerProvider === 'google-drive' ? 'Google Drive' : 
               centerProvider === 'onedrive' ? 'OneDrive' : 'Select Provider'}
            </h3>
          </div>
          <div className="flex-1 overflow-hidden">
            <UnifiedCloudTree
              provider={centerProvider}
              onProviderChange={setCenterProvider}
            />
          </div>
        </div>
      </div>

      {/* Right Divider */}
      <div
        className={cn(
          'w-1 cursor-col-resize hover:bg-primary/20 transition-colors',
          isDragging === 'right' && 'bg-primary/30'
        )}
        onMouseDown={handleMouseDown('right')}
      />

      {/* Right Pane */}
      <div
        className={cn(
          'border-l bg-background transition-colors',
          activePane === 'right' && 'ring-2 ring-primary ring-inset'
        )}
        style={{ width: `${splitSizes[2]}%` }}
        onClick={() => setActivePane('right')}
      >
        <div className="h-full flex flex-col">
          <div className="border-b p-3">
            <h3 className="text-sm font-medium">
              {rightProvider === 'google-drive' ? 'Google Drive' : 
               rightProvider === 'onedrive' ? 'OneDrive' : 'Select Provider'}
            </h3>
          </div>
          <div className="flex-1 overflow-hidden">
            <UnifiedCloudTree
              provider={rightProvider}
              onProviderChange={setRightProvider}
            />
          </div>
        </div>
      </div>
    </div>
  );
}