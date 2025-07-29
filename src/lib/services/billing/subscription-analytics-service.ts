// =============================================================================
// SUBSCRIPTION ANALYTICS SERVICE - Clerk Integration with Database Analytics
// =============================================================================
// 🎯 Service for tracking subscription changes and analytics via Clerk webhooks

import { eq, desc, sql, count } from 'drizzle-orm';
import { db } from '@/lib/database/connection';
import { subscriptionAnalytics } from '@/lib/database/schemas';
import type { DatabaseResult } from '@/lib/database/types';

// =============================================================================
// TYPES
// =============================================================================

export interface SubscriptionAnalyticsData {
  id: string;
  userId: string;
  eventType: string;
  fromPlan: string | null;
  toPlan: string | null;
  source: string;
  metadata: Record<string, any>;
  occurredAt: Date;
  createdAt: Date;
}

export interface SubscriptionMetrics {
  totalEvents: number;
  upgradeEvents: number;
  downgradeEvents: number;
  cancelEvents: number;
  reactivateEvents: number;
  planDistribution: Array<{ plan: string; count: number }>;
  conversionRate: number;
  churnRate: number;
}

export interface UserSubscriptionHistory {
  userId: string;
  events: SubscriptionAnalyticsData[];
  currentPlan: string;
  subscriptionStartDate: Date | null;
  totalPlanChanges: number;
  hasEverUpgraded: boolean;
  hasEverCanceled: boolean;
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class SubscriptionAnalyticsService {
  /**
   * Record a subscription event from Clerk webhook
   */
  static async recordSubscriptionEvent(data: {
    userId: string;
    eventType: string;
    fromPlan: string | null;
    toPlan: string | null;
    source: string;
    metadata: Record<string, any>;
    occurredAt: Date;
  }): Promise<DatabaseResult<SubscriptionAnalyticsData>> {
    try {
      if (!data.userId) {
        return {
          success: false,
          error: 'User ID is required for subscription analytics',
        };
      }

      const result = await db
        .insert(subscriptionAnalytics)
        .values({
          userId: data.userId,
          eventType: data.eventType,
          fromPlan: data.fromPlan,
          toPlan: data.toPlan,
          source: data.source,
          metadata: data.metadata,
          occurredAt: data.occurredAt,
        })
        .returning();

      const event = result[0];
      if (!event) {
        return {
          success: false,
          error: 'Failed to insert subscription analytics event',
        };
      }

      console.log(
        `📊 SUBSCRIPTION_ANALYTICS: Recorded ${data.eventType} event for user ${data.userId}`,
        {
          eventType: data.eventType,
          fromPlan: data.fromPlan,
          toPlan: data.toPlan,
          source: data.source,
          occurredAt: data.occurredAt.toISOString(),
        }
      );

      return {
        success: true,
        data: {
          id: event.id,
          userId: event.userId,
          eventType: event.eventType,
          fromPlan: event.fromPlan,
          toPlan: event.toPlan,
          source: event.source,
          metadata: event.metadata as Record<string, any>,
          occurredAt: event.occurredAt,
          createdAt: event.createdAt,
        },
      };
    } catch (error) {
      console.error('Error recording subscription event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get subscription history for a specific user
   */
  static async getUserSubscriptionHistory(
    userId: string
  ): Promise<DatabaseResult<UserSubscriptionHistory>> {
    try {
      const events = await db
        .select()
        .from(subscriptionAnalytics)
        .where(eq(subscriptionAnalytics.userId, userId))
        .orderBy(desc(subscriptionAnalytics.occurredAt));

      const eventData: SubscriptionAnalyticsData[] = events.map(event => ({
        id: event.id,
        userId: event.userId,
        eventType: event.eventType,
        fromPlan: event.fromPlan,
        toPlan: event.toPlan,
        source: event.source,
        metadata: event.metadata as Record<string, any>,
        occurredAt: event.occurredAt,
        createdAt: event.createdAt,
      }));

      // Analyze the history
      const currentPlan = eventData[0]?.toPlan || 'free';
      const subscriptionStartDate =
        eventData.length > 0
          ? eventData[eventData.length - 1]?.occurredAt
          : null;

      const hasEverUpgraded = eventData.some(
        e =>
          e.eventType === 'upgrade' ||
          (e.toPlan !== 'free' && e.fromPlan === 'free')
      );

      const hasEverCanceled = eventData.some(
        e => e.eventType === 'cancel' || e.toPlan === 'free'
      );

      return {
        success: true,
        data: {
          userId,
          events: eventData,
          currentPlan,
          subscriptionStartDate,
          totalPlanChanges: eventData.length,
          hasEverUpgraded,
          hasEverCanceled,
        },
      };
    } catch (error) {
      console.error('Error fetching user subscription history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get overall subscription metrics for admin dashboard
   */
  static async getSubscriptionMetrics(timeRange?: {
    start: Date;
    end: Date;
  }): Promise<DatabaseResult<SubscriptionMetrics>> {
    try {
      let baseQuery = db.select().from(subscriptionAnalytics);

      if (timeRange) {
        baseQuery = baseQuery.where(
          sql`${subscriptionAnalytics.occurredAt} BETWEEN ${timeRange.start} AND ${timeRange.end}`
        ) as typeof baseQuery;
      }

      const allEvents = await baseQuery;

      // Calculate metrics
      const totalEvents = allEvents.length;
      const upgradeEvents = allEvents.filter(
        e => e.eventType === 'upgrade'
      ).length;
      const downgradeEvents = allEvents.filter(
        e => e.eventType === 'downgrade'
      ).length;
      const cancelEvents = allEvents.filter(
        e => e.eventType === 'cancel'
      ).length;
      const reactivateEvents = allEvents.filter(
        e => e.eventType === 'reactivate'
      ).length;

      // Plan distribution (current state)
      const planCounts = allEvents.reduce(
        (acc, event) => {
          if (event.toPlan) {
            acc[event.toPlan] = (acc[event.toPlan] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      );

      const planDistribution = Object.entries(planCounts).map(
        ([plan, count]) => ({
          plan,
          count,
        })
      );

      // Calculate conversion and churn rates
      const totalUpgradeOpportunities = allEvents.filter(
        e => e.fromPlan === 'free'
      ).length;
      const conversionRate =
        totalUpgradeOpportunities > 0
          ? (upgradeEvents / totalUpgradeOpportunities) * 100
          : 0;

      const totalPaidUsers = allEvents.filter(e => e.toPlan !== 'free').length;
      const churnRate =
        totalPaidUsers > 0 ? (cancelEvents / totalPaidUsers) * 100 : 0;

      return {
        success: true,
        data: {
          totalEvents,
          upgradeEvents,
          downgradeEvents,
          cancelEvents,
          reactivateEvents,
          planDistribution,
          conversionRate: Math.round(conversionRate * 100) / 100,
          churnRate: Math.round(churnRate * 100) / 100,
        },
      };
    } catch (error) {
      console.error('Error fetching subscription metrics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get recent subscription events for monitoring
   */
  static async getRecentEvents(
    limit: number = 50
  ): Promise<DatabaseResult<SubscriptionAnalyticsData[]>> {
    try {
      const events = await db
        .select()
        .from(subscriptionAnalytics)
        .orderBy(desc(subscriptionAnalytics.occurredAt))
        .limit(limit);

      const eventData: SubscriptionAnalyticsData[] = events.map(event => ({
        id: event.id,
        userId: event.userId,
        eventType: event.eventType,
        fromPlan: event.fromPlan,
        toPlan: event.toPlan,
        source: event.source,
        metadata: event.metadata as Record<string, any>,
        occurredAt: event.occurredAt,
        createdAt: event.createdAt,
      }));

      return {
        success: true,
        data: eventData,
      };
    } catch (error) {
      console.error('Error fetching recent subscription events:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get subscription event counts by type for a specific user
   */
  static async getUserEventCounts(
    userId: string
  ): Promise<DatabaseResult<Record<string, number>>> {
    try {
      const events = await db
        .select({
          eventType: subscriptionAnalytics.eventType,
          count: count(subscriptionAnalytics.id),
        })
        .from(subscriptionAnalytics)
        .where(eq(subscriptionAnalytics.userId, userId))
        .groupBy(subscriptionAnalytics.eventType);

      const eventCounts = events.reduce(
        (acc, event) => {
          acc[event.eventType] = Number(event.count);
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        success: true,
        data: eventCounts,
      };
    } catch (error) {
      console.error('Error fetching user event counts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Clean up old analytics events (data retention)
   */
  static async cleanupOldEvents(
    olderThanDays: number = 365
  ): Promise<DatabaseResult<{ deletedCount: number }>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await db
        .delete(subscriptionAnalytics)
        .where(sql`${subscriptionAnalytics.occurredAt} < ${cutoffDate}`)
        .returning({ id: subscriptionAnalytics.id });

      console.log(
        `🧹 SUBSCRIPTION_ANALYTICS: Cleaned up ${result.length} old events older than ${olderThanDays} days`
      );

      return {
        success: true,
        data: { deletedCount: result.length },
      };
    } catch (error) {
      console.error('Error cleaning up old subscription events:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get subscription funnel metrics (free -> pro -> business)
   */
  static async getSubscriptionFunnel(): Promise<
    DatabaseResult<{
      freeUsers: number;
      proUpgrades: number;
      businessUpgrades: number;
      freeToProConversion: number;
      proToBusinessConversion: number;
    }>
  > {
    try {
      // Get latest event for each user to determine current state
      const latestEvents = await db
        .select({
          userId: subscriptionAnalytics.userId,
          toPlan: subscriptionAnalytics.toPlan,
          occurredAt: subscriptionAnalytics.occurredAt,
        })
        .from(subscriptionAnalytics)
        .orderBy(desc(subscriptionAnalytics.occurredAt));

      // Group by user and get their latest plan
      const userPlans = new Map<string, string>();
      latestEvents.forEach(event => {
        if (!userPlans.has(event.userId) && event.toPlan) {
          userPlans.set(event.userId, event.toPlan);
        }
      });

      // Count users by plan
      const planCounts = Array.from(userPlans.values()).reduce(
        (acc, plan) => {
          acc[plan] = (acc[plan] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const freeUsers = planCounts.free || 0;
      const proUsers = planCounts.pro || 0;
      const businessUsers = planCounts.business || 0;

      // Calculate conversion rates
      const totalUsers = freeUsers + proUsers + businessUsers;
      const freeToProConversion =
        totalUsers > 0 ? (proUsers / totalUsers) * 100 : 0;
      const proToBusinessConversion =
        proUsers + businessUsers > 0
          ? (businessUsers / (proUsers + businessUsers)) * 100
          : 0;

      return {
        success: true,
        data: {
          freeUsers,
          proUpgrades: proUsers,
          businessUpgrades: businessUsers,
          freeToProConversion: Math.round(freeToProConversion * 100) / 100,
          proToBusinessConversion:
            Math.round(proToBusinessConversion * 100) / 100,
        },
      };
    } catch (error) {
      console.error('Error fetching subscription funnel metrics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default SubscriptionAnalyticsService;
