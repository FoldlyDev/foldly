// =============================================================================
// SUBSCRIPTION PLANS SERVICE - Database Operations for Plan Management
// =============================================================================
// 🎯 Service layer for subscription plans with Drizzle ORM integration

import { eq, asc } from 'drizzle-orm';
import { db } from '@/lib/database/connection';
import {
  subscriptionPlans,
  type SubscriptionPlan,
} from '@/lib/database/schemas';

// =============================================================================
// TYPES
// =============================================================================

// Use the Drizzle-generated type instead of duplicating it
// export type SubscriptionPlan = imported from @/lib/database/schemas

export interface CreatePlanInput {
  planKey: string;
  planName: string;
  planDescription?: string;
  monthlyPriceUsd: string;
  yearlyPriceUsd?: string;
  storageLimitGb: number;
  // UI metadata
  highlightFeatures?: string[];
  featureDescriptions?: Record<string, string>;
  isPopular?: boolean;
  // Metadata
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdatePlanInput extends Partial<CreatePlanInput> {
  planKey: string;
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class SubscriptionPlansService {
  /**
   * Get all active subscription plans
   */
  static async getActivePlans(): Promise<SubscriptionPlan[]> {
    try {
      const plans = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true))
        .orderBy(asc(subscriptionPlans.sortOrder));

      // Return empty array if no plans found instead of throwing
      return plans || [];
    } catch (error) {
      console.error('Error fetching active plans:', error);
      // Return default free plan as fallback
      return [
        {
          id: 0,
          planKey: 'free',
          planName: 'Free',
          planDescription: 'Basic plan with essential features',
          monthlyPriceUsd: '0.00',
          yearlyPriceUsd: '0.00',
          storageLimitGb: 50,
          highlightFeatures: ['File sharing', 'Basic storage'],
          featureDescriptions: {
            'File sharing': 'Share files with others',
            'Basic storage': '50GB of storage space',
          },
          isPopular: false,
          isActive: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    }
  }

  /**
   * Get all subscription plans (including inactive)
   */
  static async getAllPlans(): Promise<SubscriptionPlan[]> {
    try {
      return await db
        .select()
        .from(subscriptionPlans)
        .orderBy(asc(subscriptionPlans.sortOrder));
    } catch (error) {
      console.error('Error fetching all plans:', error);
      throw new Error('Failed to fetch subscription plans');
    }
  }

  /**
   * Get a specific plan by key
   */
  static async getPlanByKey(planKey: string): Promise<SubscriptionPlan | null> {
    try {
      const result = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.planKey, planKey))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error(`Error fetching plan ${planKey}:`, error);

      // Return fallback plan data for known plan types
      if (planKey === 'free') {
        return {
          id: 0,
          planKey: 'free',
          planName: 'Free',
          planDescription: 'Basic plan with essential features',
          monthlyPriceUsd: '0.00',
          yearlyPriceUsd: '0.00',
          storageLimitGb: 50,
          highlightFeatures: ['File sharing', 'Basic storage'],
          featureDescriptions: {
            'File sharing': 'Share files with others',
            'Basic storage': '50GB of storage space',
          },
          isPopular: false,
          isActive: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      return null;
    }
  }

  /**
   * Get plans available for MVP
   */
  static async getMvpPlans(): Promise<SubscriptionPlan[]> {
    try {
      return await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true))
        .orderBy(asc(subscriptionPlans.sortOrder));
    } catch (error) {
      console.error('Error fetching MVP plans:', error);
      throw new Error('Failed to fetch MVP subscription plans');
    }
  }

  /**
   * Create a new subscription plan
   */
  static async createPlan(input: CreatePlanInput): Promise<SubscriptionPlan> {
    try {
      const result = await db
        .insert(subscriptionPlans)
        .values({
          ...input,
          monthlyPriceUsd: input.monthlyPriceUsd || '0.00',
          yearlyPriceUsd: input.yearlyPriceUsd || '0.00',
          isActive: input.isActive ?? true,
          sortOrder: input.sortOrder ?? 0,
        })
        .returning();

      if (!result[0]) {
        throw new Error('Failed to create subscription plan');
      }
      return result[0];
    } catch (error) {
      console.error('Error creating plan:', error);
      throw new Error('Failed to create subscription plan');
    }
  }

  /**
   * Update an existing subscription plan
   */
  static async updatePlan(
    input: UpdatePlanInput
  ): Promise<SubscriptionPlan | null> {
    try {
      const { planKey, ...updateData } = input;

      const result = await db
        .update(subscriptionPlans)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlans.planKey, planKey))
        .returning();

      return result[0] || null;
    } catch (error) {
      console.error(`Error updating plan ${input.planKey}:`, error);
      throw new Error(`Failed to update plan: ${input.planKey}`);
    }
  }

  /**
   * Delete a subscription plan
   */
  static async deletePlan(planKey: string): Promise<boolean> {
    try {
      const result = await db
        .delete(subscriptionPlans)
        .where(eq(subscriptionPlans.planKey, planKey))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting plan ${planKey}:`, error);
      throw new Error(`Failed to delete plan: ${planKey}`);
    }
  }

  /**
   * Toggle plan active status
   */
  static async togglePlanStatus(
    planKey: string,
    isActive: boolean
  ): Promise<SubscriptionPlan | null> {
    try {
      const result = await db
        .update(subscriptionPlans)
        .set({
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlans.planKey, planKey))
        .returning();

      return result[0] || null;
    } catch (error) {
      console.error(`Error toggling plan status ${planKey}:`, error);
      throw new Error(`Failed to toggle plan status: ${planKey}`);
    }
  }

  /**
   * Get plan UI metadata (simplified approach)
   */
  static async getPlanUIMetadata(planKey: string): Promise<{
    highlightFeatures: string[];
    featureDescriptions: Record<string, string>;
  } | null> {
    try {
      const plan = await this.getPlanByKey(planKey);
      if (!plan) return null;

      return {
        highlightFeatures: (plan.highlightFeatures as string[]) || [],
        featureDescriptions:
          (plan.featureDescriptions as Record<string, string>) || {},
      };
    } catch (error) {
      console.error(`Error fetching UI metadata for plan ${planKey}:`, error);
      return null;
    }
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get default plan configurations for seeding
 */
export function getDefaultPlanConfigurations(): CreatePlanInput[] {
  return [
    {
      planKey: 'free',
      planName: 'Free',
      planDescription:
        'Perfect for getting started! Get 50GB of generous storage space to explore Foldly\'s powerful file sharing features.',
      monthlyPriceUsd: '0.00',
      yearlyPriceUsd: '0.00',
      storageLimitGb: 50,
      highlightFeatures: [
        '50GB generous storage space',
        'Personalized custom username',
        'Unlimited file sharing links',
        'Email notifications for activities',
        'Beautiful file preview thumbnails',
        'OneDrive & Google Drive integrations',
      ],
      featureDescriptions: {
        'storage_limits': 'Get 50GB of secure cloud storage to keep all your important files organized and accessible',
        'custom_username': 'Create your unique username for personalized profile links and professional branding',
        'unlimited_links': 'Share files freely with unlimited link creation - no restrictions on how many you can make',
        'cloud_integrations': 'Seamlessly connect with OneDrive and Google Drive for effortless file sharing across platforms',
        'email_notifications': 'Stay informed with instant email alerts whenever files are uploaded or shared through your links',
        'file_preview_thumbnails': 'See beautiful thumbnail previews of your images, documents, and files at a glance',
      },
      isPopular: false,
      isActive: true,
      sortOrder: 1,
    },
    {
      planKey: 'pro',
      planName: 'Pro',
      planDescription: 'Level up your file sharing game! Everything from Free plus massive storage upgrade, premium features, and custom branding.',
      monthlyPriceUsd: '12.00',
      yearlyPriceUsd: '120.00',
      storageLimitGb: 500,
      highlightFeatures: [
        '500GB massive storage upgrade',
        'Advanced custom branding & banners',
        'Premium short links (5 chars or less)',
        'Password-protected secure links',
        'Smart file restrictions & controls',
        'QR code generation for mobile sharing',
        'Everything from Free plan included',
      ],
      featureDescriptions: {
        'storage_limits': 'Upgrade to 500GB of premium storage space - perfect for growing businesses and power users',
        'custom_branding': 'Make it yours with custom banners, colors, and remove Foldly branding for a professional look',
        'custom_username': 'Create your unique username for personalized profile links and professional branding',
        'unlimited_links': 'Share files freely with unlimited link creation - no restrictions on how many you can make',
        'file_restrictions': 'Take control with custom file size limits and type restrictions for each sharing link',
        'cloud_integrations': 'Seamlessly connect with OneDrive and Google Drive for effortless file sharing across platforms',
        'qr_code_generation': 'Generate QR codes instantly for your links, making mobile sharing quick and effortless',
        'email_notifications': 'Stay informed with instant email alerts whenever files are uploaded or shared through your links',
        'premium_short_links': 'Get memorable premium short links with 5 characters or less for easy sharing and marketing',
        'file_preview_thumbnails': 'See beautiful thumbnail previews of your images, documents, and files at a glance',
        'password_protected_links': 'Secure your sensitive files with password protection - only authorized users can access',
      },
      isPopular: true,
      isActive: true,
      sortOrder: 2,
    },
    {
      planKey: 'business',
      planName: 'Business',
      planDescription: 'Built for teams that mean business! Everything Pro offers plus massive storage, priority support and advanced features.',
      monthlyPriceUsd: '30.00',
      yearlyPriceUsd: '300.00',
      storageLimitGb: 2048, // 2TB
      highlightFeatures: [
        '2TB enterprise-grade storage',
        'Dedicated priority support team',
        'Everything from Pro plan included',
      ],
      featureDescriptions: {
        'storage_limits': 'Enterprise-scale 2TB storage capacity for teams and organizations with extensive file sharing needs',
        'custom_branding': 'Make it yours with custom banners, colors, and remove Foldly branding for a professional look',
        'custom_username': 'Create your unique username for personalized profile links and professional branding',
        'unlimited_links': 'Share files freely with unlimited link creation - no restrictions on how many you can make',
        'priority_support': 'Get fast-track customer support with dedicated assistance and guaranteed faster response times',
        'file_restrictions': 'Take control with custom file size limits and type restrictions for each sharing link',
        'cloud_integrations': 'Seamlessly connect with OneDrive and Google Drive for effortless file sharing across platforms',
        'qr_code_generation': 'Generate QR codes instantly for your links, making mobile sharing quick and effortless',
        'email_notifications': 'Stay informed with instant email alerts whenever files are uploaded or shared through your links',
        'premium_short_links': 'Get memorable premium short links with 5 characters or less for easy sharing and marketing',
        'file_preview_thumbnails': 'See beautiful thumbnail previews of your images, documents, and files at a glance',
        'password_protected_links': 'Secure your sensitive files with password protection - only authorized users can access',
      },
      isPopular: false,
      isActive: true,
      sortOrder: 3,
    },
  ];
}

/**
 * Seed the database with default plans
 */
export async function seedSubscriptionPlans(): Promise<void> {
  try {
    const defaultPlans = getDefaultPlanConfigurations();

    for (const planConfig of defaultPlans) {
      // Check if plan already exists
      const existingPlan = await SubscriptionPlansService.getPlanByKey(
        planConfig.planKey
      );

      if (!existingPlan) {
        await SubscriptionPlansService.createPlan(planConfig);
        console.log(`✅ Created plan: ${planConfig.planName}`);
      } else {
        console.log(`⏭️  Plan already exists: ${planConfig.planName}`);
      }
    }

    console.log('✅ Subscription plans seeding completed');
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    throw error;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default SubscriptionPlansService;
