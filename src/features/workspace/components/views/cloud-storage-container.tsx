'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GoogleDriveSection } from '../sections/google-drive-section';
import { OneDriveSection } from '../sections/onedrive-section';
import { Button } from '@/components/ui/shadcn/button';
import { FaGoogle } from 'react-icons/fa';
import { GrOnedrive } from 'react-icons/gr';

interface CloudStorageContainerProps {
  className?: string;
}

export function CloudStorageContainer({ className }: CloudStorageContainerProps) {
  // Panel expansion state
  const [expandedPanels, setExpandedPanels] = useState<{
    googleDrive: boolean;
    oneDrive: boolean;
  }>({
    googleDrive: false,
    oneDrive: false,
  });

  const togglePanel = (panel: 'googleDrive' | 'oneDrive') => {
    setExpandedPanels(prev => ({
      ...prev,
      [panel]: !prev[panel]
    }));
  };

  // Dynamic width based on expanded panels
  const containerWidth = expandedPanels.googleDrive || expandedPanels.oneDrive ? 'w-96' : 'w-auto';

  return (
    <div className={`flex flex-col gap-4 h-full ${containerWidth} ${className || ''}`}>
      {/* Collapsed buttons - shown when no panels are expanded */}
      {!expandedPanels.googleDrive && !expandedPanels.oneDrive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className='flex flex-col gap-2 items-center justify-center h-full'
        >
          <Button
            variant="outline"
            className="h-14 w-14 transition-all hover:scale-105 foldly-glass-light dark:foldly-glass"
            onClick={() => togglePanel('googleDrive')}
            title="Expand Google Drive"
          >
            <FaGoogle className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            className="h-14 w-14 transition-all hover:scale-105 foldly-glass-light dark:foldly-glass"
            onClick={() => togglePanel('oneDrive')}
            title="Expand OneDrive"
          >
            <GrOnedrive className="h-6 w-6" />
          </Button>
        </motion.div>
      )}

      {/* Expanded panels container */}
      {(expandedPanels.googleDrive || expandedPanels.oneDrive) && (
        <div className="flex flex-col gap-4 h-full">
          {/* Google Drive - Always on top when expanded */}
          {expandedPanels.googleDrive ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={expandedPanels.oneDrive ? 'flex-1 min-h-0' : 'h-full'}
            >
              <GoogleDriveSection onCollapse={() => togglePanel('googleDrive')} />
            </motion.div>
          ) : (
            <div className='flex items-center justify-center py-2'>
              <Button
                variant="outline"
                className="h-14 w-14 transition-all hover:scale-105"
                onClick={() => togglePanel('googleDrive')}
                title="Expand Google Drive"
              >
                <FaGoogle className="h-6 w-6" />
              </Button>
            </div>
          )}

          {/* OneDrive - Always below Google Drive when expanded */}
          {expandedPanels.oneDrive ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={expandedPanels.googleDrive ? 'flex-1 min-h-0' : 'h-full'}
            >
              <OneDriveSection onCollapse={() => togglePanel('oneDrive')} />
            </motion.div>
          ) : (
            <div className='flex items-center justify-center py-2'>
              <Button
                variant="outline"
                className="h-14 w-14 transition-all hover:scale-105"
                onClick={() => togglePanel('oneDrive')}
                title="Expand OneDrive"
              >
                <GrOnedrive className="h-6 w-6" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}