'use client';

import React from 'react';
import { SplitPaneManager } from './SplitPaneManager';
import { MobileViewSwitcher } from './MobileViewSwitcher';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { Button } from '@/components/ui/core/shadcn/button';
import { ArrowLeftRight, Download, Upload, Settings } from 'lucide-react';
import { useCloudViewStore } from '../../stores/cloud-view-store';
import { useCloudTransfer } from '../../hooks/useCloudTransfer';
import { CloudTransferModal } from '../transfer/CloudTransferModal';

export function CloudWorkspaceView() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { selectedFiles, leftProvider, rightProvider, centerProvider } = useCloudViewStore();
  const { startTransfer, isTransferring } = useCloudTransfer();
  const [showTransferModal, setShowTransferModal] = React.useState(false);

  const hasSelection = Object.values(selectedFiles).some(files => files.length > 0);

  const handleTransfer = () => {
    // Determine source and target providers based on selection
    const sourceProvider = Object.entries(selectedFiles).find(
      ([, files]) => files.length > 0
    )?.[0];

    if (sourceProvider) {
      setShowTransferModal(true);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Cloud Storage Manager</h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasSelection}
              onClick={handleTransfer}
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Transfer
            </Button>

            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>

            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>

            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {isDesktop ? <SplitPaneManager /> : <MobileViewSwitcher />}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <CloudTransferModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
        />
      )}
    </div>
  );
}