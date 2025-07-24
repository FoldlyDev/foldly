'use server';

import { validateTopicName } from '../utils';
import { linksDbService } from '../db-service';
import type { ActionResult } from '../validations';

export interface TopicAvailabilityResult {
  available: boolean;
  topic: string;
  message: string;
}

export interface CheckTopicAvailabilityInput {
  topic: string;
  userId: string;
  slug: string;
  excludeId?: string; // For editing existing links
}

/**
 * Server action to check if a topic is available for a specific user and slug
 * Topics must be unique within a user's slug context
 */
export async function checkTopicAvailabilityAction({
  topic,
  userId,
  slug,
  excludeId,
}: CheckTopicAvailabilityInput): Promise<ActionResult<TopicAvailabilityResult>> {
  try {
    // Validate inputs
    if (!topic || !userId || !slug) {
      return {
        success: false,
        error: 'Missing required parameters: topic, userId, and slug are required',
      };
    }

    // Basic format validation
    const topicValidation = validateTopicName(topic);
    if (!topicValidation.isValid) {
      return {
        success: true,
        data: {
          available: false,
          topic,
          message: topicValidation.error || 'Invalid topic format',
        },
      };
    }

    // Check if topic exists for this user and slug combination
    const existingLinkResult = await linksDbService.getByUserSlugAndTopic(userId, slug, topic);
    
    if (!existingLinkResult.success) {
      return {
        success: false,
        error: 'Failed to check topic availability',
      };
    }

    const existingLink = existingLinkResult.data;
    
    // If link exists and it's not the one being edited, topic is unavailable
    if (existingLink && existingLink.id !== excludeId) {
      return {
        success: true,
        data: {
          available: false,
          topic,
          message: 'Topic name already in use',
        },
      };
    }

    // Topic is available
    return {
      success: true,
      data: {
        available: true,
        topic,
        message: 'Topic is available',
      },
    };
  } catch (error) {
    console.error('Failed to check topic availability:', error);
    return {
      success: false,
      error: 'Internal server error',
    };
  }
}