// =============================================================================
// BILLING TEST PAGE - Test Corrected Plan Detection
// =============================================================================
// 🎯 Test page to verify the corrected billing plan detection

'use client';

import { useEffect, useState } from 'react';
import { useClerkSubscription } from '@/features/billing/hooks/use-clerk-billing';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/core/shadcn/card';
import { Button } from '@/components/ui/core/shadcn/button';
import { Badge } from '@/components/ui/core/shadcn/badge';
import { Separator } from '@/components/ui/core/shadcn/separator';

interface DebugInfo {
  userId: string;
  debugInfo: any;
  quickProCheck: any;
  summary: any;
  timestamp: string;
}

export default function BillingTestPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clerkSubscription = useClerkSubscription();

  const fetchDebugInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/debug-billing');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch debug info');
      }

      setDebugInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'bg-purple-100 text-purple-800';
      case 'business':
        return 'bg-orange-100 text-orange-800';
      case 'free':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Billing Plan Detection Test</h1>
          <p className='text-muted-foreground'>
            Test the corrected plan detection logic
          </p>
        </div>
        <Button onClick={fetchDebugInfo} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Test'}
        </Button>
      </div>

      {error && (
        <Card className='border-red-200 bg-red-50'>
          <CardHeader>
            <CardTitle className='text-red-800'>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-red-700'>{error}</p>
          </CardContent>
        </Card>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Client-Side Detection */}
        <Card>
          <CardHeader>
            <CardTitle>Client-Side Detection (useClerkSubscription)</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex items-center gap-2'>
              <span className='font-medium'>Current Plan:</span>
              <Badge className={getPlanColor(clerkSubscription.currentPlan)}>
                {clerkSubscription.currentPlan}
              </Badge>
            </div>

            <div className='flex items-center gap-2'>
              <span className='font-medium'>Plan Name:</span>
              <span>{clerkSubscription.planDisplayName}</span>
            </div>

            <div className='flex items-center gap-2'>
              <span className='font-medium'>Is Pro Tier:</span>
              <Badge
                variant={clerkSubscription.isProTier ? 'default' : 'secondary'}
              >
                {clerkSubscription.isProTier ? 'Yes' : 'No'}
              </Badge>
            </div>

            <div className='flex items-center gap-2'>
              <span className='font-medium'>Is Loaded:</span>
              <Badge
                variant={clerkSubscription.isLoaded ? 'default' : 'secondary'}
              >
                {clerkSubscription.isLoaded ? 'Yes' : 'No'}
              </Badge>
            </div>

            <Separator />

            <div>
              <h4 className='font-medium mb-2'>Key Features</h4>
              <div className='grid grid-cols-2 gap-2 text-sm'>
                <div>
                  Custom Branding:{' '}
                  {clerkSubscription.hasCustomBranding ? '✅' : '❌'}
                </div>
                <div>
                  Premium Links:{' '}
                  {clerkSubscription.hasPremiumShortLinks ? '✅' : '❌'}
                </div>
                <div>
                  Password Links:{' '}
                  {clerkSubscription.hasPasswordProtectedLinks ? '✅' : '❌'}
                </div>
                <div>
                  Priority Support:{' '}
                  {clerkSubscription.hasPrioritySupport ? '✅' : '❌'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Server-Side Detection */}
        <Card>
          <CardHeader>
            <CardTitle>Server-Side Detection (Debug API)</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {debugInfo ? (
              <>
                <div className='flex items-center gap-2'>
                  <span className='font-medium'>Detected Plan:</span>
                  <Badge
                    className={getPlanColor(
                      debugInfo.debugInfo.planDetection.detectedPlan
                    )}
                  >
                    {debugInfo.debugInfo.planDetection.detectedPlan}
                  </Badge>
                </div>

                <div className='flex items-center gap-2'>
                  <span className='font-medium'>Is Pro Plan:</span>
                  <Badge
                    variant={
                      debugInfo.quickProCheck.isPro ? 'default' : 'secondary'
                    }
                  >
                    {debugInfo.quickProCheck.isPro ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <div className='flex items-center gap-2'>
                  <span className='font-medium'>Has Clerk Billing:</span>
                  <Badge
                    variant={
                      debugInfo.summary.hasClerkBilling
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {debugInfo.summary.hasClerkBilling ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <Separator />

                <div>
                  <h4 className='font-medium mb-2'>Raw Clerk Checks</h4>
                  <div className='space-y-1 text-sm'>
                    {Object.entries(debugInfo.quickProCheck.rawClerkChecks).map(
                      ([key, value]) => (
                        <div key={key} className='flex justify-between'>
                          <span>{key}:</span>
                          <span>{value ? '✅' : '❌'}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </>
            ) : loading ? (
              <div className='text-center py-4'>
                <div className='animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto'></div>
                <p className='mt-2 text-sm text-muted-foreground'>
                  Loading debug info...
                </p>
              </div>
            ) : (
              <p className='text-muted-foreground'>No debug info available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {debugInfo?.summary.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className='space-y-2'>
              {debugInfo.summary.recommendations.map(
                (rec: string, index: number) => (
                  <li key={index} className='flex items-start gap-2'>
                    <span className='text-muted-foreground'>•</span>
                    <span
                      className={
                        rec.includes('✅')
                          ? 'text-green-700'
                          : rec.includes('⚠️')
                            ? 'text-yellow-700'
                            : ''
                      }
                    >
                      {rec}
                    </span>
                  </li>
                )
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Database Plan Config */}
      {debugInfo?.databasePlanConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Database Plan Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <h4 className='font-medium'>Plan Details</h4>
                <p>Current Plan: {debugInfo.databasePlanConfig.currentPlan}</p>
                <p>Plan Name: {debugInfo.databasePlanConfig.planName}</p>
                <p>
                  Storage Limit: {debugInfo.databasePlanConfig.storageLimit}GB
                </p>
              </div>
              <div>
                <h4 className='font-medium'>Active Features</h4>
                <div className='space-y-1 text-sm'>
                  {debugInfo.databasePlanConfig.features.map(
                    (feature: string) => (
                      <div key={feature}>✅ {feature.replace(/_/g, ' ')}</div>
                    )
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className='bg-muted'>
        <CardContent className='pt-6'>
          <p className='text-sm text-muted-foreground text-center'>
            Last updated:{' '}
            {debugInfo?.timestamp
              ? new Date(debugInfo.timestamp).toLocaleString()
              : 'Not available'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
