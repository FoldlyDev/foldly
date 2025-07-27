// =============================================================================
// PRICING PAGE - Public Subscription Pricing
// =============================================================================
// 🎯 Public-facing pricing page for non-authenticated users and plan comparison

import React from 'react';
import { Metadata } from 'next';
import { PricingPage } from '@/features/billing/components/pricing/PricingPage';

export const metadata: Metadata = {
  title: 'Pricing Plans | Foldly',
  description: 'Choose the perfect plan for your file sharing needs. Free, Pro, and Business plans available.',
  keywords: 'pricing, plans, subscription, file sharing, storage, foldly',
};

export default function PricingRoute() {
  return <PricingPage />;
}