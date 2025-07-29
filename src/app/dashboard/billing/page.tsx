// =============================================================================
// BILLING CATCH-ALL PAGE - Clerk UserProfile Integration
// =============================================================================
// 🎯 Catch-all route for Clerk UserProfile component with proper routing support

import React from 'react';
import { type Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { BillingContainer } from '@/features/billing';

export const metadata: Metadata = {
  title: 'Billing & Subscription | Foldly',
  description:
    'Manage your subscription, view billing history, and update payment methods.',
};

export default async function BillingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Pass the route parameters to the client component
  return <BillingContainer />;
}
