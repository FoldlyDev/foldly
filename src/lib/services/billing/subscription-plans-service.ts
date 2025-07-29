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
        'Perfect for personal use with essential file sharing features',
      monthlyPriceUsd: '0.00',
      yearlyPriceUsd: '0.00',
      storageLimitGb: 50,
      highlightFeatures: [
        'File sharing',
        'Basic storage',
        'Email notifications',
        'QR code generation',
      ],
      featureDescriptions: {
        'File sharing': 'Share files with others easily',
        'Basic storage': '50GB of storage space',
        'Email notifications': 'Get notified about file activities',
        'QR code generation': 'Generate QR codes for easy sharing',
      },
      isPopular: false,
      isActive: true,
      sortOrder: 1,
    },
    {
      planKey: 'pro',
      planName: 'Pro',
      planDescription: 'Advanced features for professionals and small teams',
      monthlyPriceUsd: '9.99',
      yearlyPriceUsd: '99.99',
      storageLimitGb: 500,
      highlightFeatures: [
        'Custom branding',
        'Password protection',
        'Premium short links',
        'File restrictions',
        'Priority support',
      ],
      featureDescriptions: {
        'Custom branding': 'Add your logo and brand colors',
        'Password protection': 'Secure your uploads with passwords',
        'Premium short links': 'Create custom short URLs',
        'File restrictions': 'Control file types and sizes',
        'Priority support': 'Get faster support responses',
      },
      isPopular: true,
      isActive: true,
      sortOrder: 2,
    },
    {
      planKey: 'business',
      planName: 'Business',
      planDescription: 'Enterprise-grade features for teams and organizations',
      monthlyPriceUsd: '29.99',
      yearlyPriceUsd: '299.99',
      storageLimitGb: -1, // -1 represents unlimited
      highlightFeatures: [
        'Unlimited storage',
        'Advanced analytics',
        'Team management',
        'API access',
        'Dedicated support',
      ],
      featureDescriptions: {
        'Unlimited storage': 'No storage limits for your team',
        'Advanced analytics': 'Detailed insights and reporting',
        'Team management': 'Manage team members and permissions',
        'API access': 'Integrate with your existing systems',
        'Dedicated support': '24/7 dedicated support channel',
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
