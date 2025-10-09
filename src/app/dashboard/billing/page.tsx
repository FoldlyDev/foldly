// =============================================================================
// BILLING CATCH-ALL PAGE - Clerk UserProfile Integration
// =============================================================================
// 🎯 Catch-all route for Clerk UserProfile component with proper routing support

import { type Metadata } from 'next';
import { Billing, BillingSkeleton } from '@/modules/billing';
import { ModuleErrorBoundary } from '@/components/core/ModuleErrorBoundary';
import { PageFadeRevealEffect } from '@/components/layout/PageFadeRevealEffect';

export const metadata: Metadata = {
  title: 'Billing & Subscription | Foldly',
  description:
    'Manage your subscription, view billing history, and update payment methods.',
};

export default function BillingPage() {
  // Auth check handled by middleware

  return (
    <ModuleErrorBoundary moduleName="billing">
      <PageFadeRevealEffect
        isLoading={false}
        loadingComponent={<BillingSkeleton />}
      >
        <Billing />
      </PageFadeRevealEffect>
    </ModuleErrorBoundary>
  );
}
