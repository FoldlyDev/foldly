// =============================================================================
// SUBSCRIPTION PLANS SEEDING SCRIPT
// =============================================================================
// 🎯 Populate subscription_plans table with the new simplified schema

import { db } from '../src/lib/database/connection';
import { subscriptionPlans } from '../src/lib/database/schemas';

const plans = [
  {
    planKey: 'free',
    planName: 'Free',
    planDescription: 'Perfect for getting started with file sharing',
    monthlyPriceUsd: '0.00',
    yearlyPriceUsd: '0.00',
    storageLimitGb: 50,
    highlightFeatures: [
      'File sharing',
      'Basic storage',
      'QR code generation'
    ],
    featureDescriptions: {
      'basic_sharing': 'Simple file sharing links',
      'storage_quota': '50GB storage space',
      'qr_codes': 'Generate QR codes for links'
    },
    isPopular: false,
    sortOrder: 1,
    isActive: true,
  },
  {
    planKey: 'pro',
    planName: 'Pro',
    planDescription: 'Enhanced features for power users',
    monthlyPriceUsd: '12.00',
    yearlyPriceUsd: '120.00',
    storageLimitGb: 500,
    highlightFeatures: [
      'Custom branding',
      'Password protection',
      'Premium short links',
      'Email notifications'
    ],
    featureDescriptions: {
      'custom_branding': 'Add your own logos and colors',
      'password_protection': 'Secure links with passwords',
      'premium_links': 'Custom domain short links',
      'email_notifications': 'Upload notifications via email',
      'file_previews': 'Generate file thumbnails',
      'storage_quota': '500GB storage space'
    },
    isPopular: true,
    sortOrder: 2,
    isActive: true,
  },
  {
    planKey: 'business',
    planName: 'Business',
    planDescription: 'Complete solution for teams and organizations',
    monthlyPriceUsd: '30.00',
    yearlyPriceUsd: '300.00',
    storageLimitGb: -1, // Unlimited
    highlightFeatures: [
      'Unlimited storage',
      'Priority support',
      'Advanced file restrictions',
      'Cloud integrations',
      'Team management'
    ],
    featureDescriptions: {
      'unlimited_storage': 'Unlimited file storage',
      'priority_support': '24/7 priority customer support',
      'file_restrictions': 'Advanced file type and size controls',
      'cloud_integrations': 'Connect with Google Drive, Dropbox, etc.',
      'team_management': 'Manage team members and permissions',
      'custom_branding': 'Full white-label branding',
      'password_protection': 'Secure links with passwords',
      'premium_links': 'Custom domain short links',
      'email_notifications': 'Advanced notification system'
    },
    isPopular: false,
    sortOrder: 3,
    isActive: true,
  }
];

async function seedSubscriptionPlans() {
  try {
    console.log('🌱 Seeding subscription plans...');
    
    // Clear existing plans
    await db.delete(subscriptionPlans);
    console.log('📝 Cleared existing plans');
    
    // Insert new plans
    for (const plan of plans) {
      await db.insert(subscriptionPlans).values(plan);
      console.log(`✅ Added ${plan.planName} plan`);
    }
    
    console.log('🎉 Successfully seeded subscription plans!');
    
    // Verify the data
    const result = await db.select().from(subscriptionPlans);
    console.log('📊 Plans in database:', result.length);
    
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedSubscriptionPlans()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedSubscriptionPlans };