// =============================================================================
// BILLING CATCH-ALL PAGE - Clerk UserProfile Integration
// =============================================================================
// 🎯 Catch-all route for Clerk UserProfile component with proper routing support

import React from 'react';
import { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { BillingPageClient } from '@/features/billing/components/views/BillingPageClient';

export const metadata: Metadata = {
  title: 'Billing & Subscription | Foldly',
  description: 'Manage your subscription, view billing history, and update payment methods.',
};

interface BillingCatchAllPageProps {
  params: {
    rest?: string[];
  };
}

export default async function BillingCatchAllPage({ params }: BillingCatchAllPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Pass the route parameters to the client component
  return <BillingPageClient params={params} />;
}