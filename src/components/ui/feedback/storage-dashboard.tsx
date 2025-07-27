// =============================================================================
// STORAGE DASHBOARD COMPONENT - Real-time Storage Tracking Display
// =============================================================================
// 🎯 Displays real-time storage usage using the new storage tracking service

'use client';

import React from 'react';
import { useStorageDashboard, useStorageBreakdown, useStorageWarnings } from '@/lib/hooks/use-storage-tracking';
import { useUser } from '@clerk/nextjs';
import { formatBytes } from '@/lib/services/storage';
import { Progress } from '@/components/ui/core/shadcn/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/core/shadcn/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/core/shadcn/alert';
import { Badge } from '@/components/ui/core/shadcn/badge';
import { AlertTriangle, HardDrive, FileText, Shield, CheckCircle2 } from 'lucide-react';

interface StorageDashboardProps {
  className?: string;
  planKey?: string;
  showBreakdown?: boolean;
  compact?: boolean;
}

export const StorageDashboard: React.FC<StorageDashboardProps> = ({
  className = '',
  planKey = 'free',
  showBreakdown = true,
  compact = false,
}) => {
  const { user } = useUser();
  const { data: storageInfo, isLoading, error } = useStorageDashboard(planKey);
  const { data: breakdown } = useStorageBreakdown();
  const warnings = useStorageWarnings(planKey);

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Please sign in to view storage information.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load storage information. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!storageInfo) {
    return null;
  }

  const getWarningColor = () => {
    switch (warnings.warningLevel) {
      case 'critical': return 'destructive';
      case 'warning': return 'warning';
      default: return 'default';
    }
  };

  const getProgressColor = () => {
    if (storageInfo.usagePercentage > 95) return 'bg-red-500';
    if (storageInfo.usagePercentage > 80) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Storage</span>
            </div>
            <Badge variant={getWarningColor()}>
              {storageInfo.usagePercentage.toFixed(1)}%
            </Badge>
          </div>
          <Progress 
            value={storageInfo.usagePercentage} 
            className="h-2 mb-2"
          />
          <p className="text-xs text-muted-foreground">
            {formatBytes(storageInfo.storageUsedBytes)} of {formatBytes(storageInfo.storageLimitBytes)} used
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Warning Alert */}
      {warnings.warningLevel !== 'normal' && (
        <Alert variant={warnings.warningLevel === 'critical' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {warnings.warningLevel === 'critical' ? 'Storage Full' : 'Storage Warning'}
          </AlertTitle>
          <AlertDescription>
            {warnings.warningLevel === 'critical' 
              ? 'Your storage is full. Please delete some files or upgrade your plan to continue uploading.'
              : 'You\'re approaching your storage limit. Consider upgrading your plan or removing unused files.'
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Main Storage Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Usage
          </CardTitle>
          <CardDescription>
            Real-time storage tracking for your {planKey} plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Usage Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                {formatBytes(storageInfo.storageUsedBytes)} used
              </span>
              <span className="text-sm text-muted-foreground">
                {formatBytes(storageInfo.storageLimitBytes)} total
              </span>
            </div>
            <Progress 
              value={storageInfo.usagePercentage} 
              className="h-3"
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-muted-foreground">
                {storageInfo.usagePercentage.toFixed(1)}% used
              </span>
              <span className="text-xs text-muted-foreground">
                {formatBytes(storageInfo.remainingBytes)} remaining
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{storageInfo.filesCount}</p>
                <p className="text-xs text-muted-foreground">Files stored</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium capitalize">{storageInfo.planKey}</p>
                <p className="text-xs text-muted-foreground">Plan type</p>
              </div>
            </div>
          </div>

          {/* Health Status */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm">
              Storage tracking is active and synchronized
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Storage Breakdown */}
      {showBreakdown && breakdown && Object.keys(breakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Storage Breakdown</CardTitle>
            <CardDescription>
              File types and their storage usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(breakdown)
                .sort(([,a], [,b]) => b.totalSize - a.totalSize)
                .slice(0, 5)
                .map(([mimeType, data]) => (
                  <div key={mimeType} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm">
                        {mimeType.split('/')[1]?.toUpperCase() || mimeType}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {data.count} files
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatBytes(data.totalSize)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {data.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};