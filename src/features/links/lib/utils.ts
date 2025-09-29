/**
 * Links Utils - Utility functions for the links feature
 * Consolidated from utils/index.ts to resolve module resolution conflicts
 */

import type { LinkWithStats, DatabaseId, LinkType } from '@/lib/database/types';

// Re-export slug normalization utilities for convenience
export {
  normalizeSlug,
  normalizeTopic,
  useSlugNormalization,
  isValidNormalizedSlug,
  isValidNormalizedTopic,
} from './utils/slug-normalization';

/**
 * Generate full URL for link
 */
export const generateFullUrl = (
  baseUrl: string,
  slug: string,
  topic?: string | null
): string => {
  if (topic) {
    return `${baseUrl}/${slug}/${topic}`;
  }
  return `${baseUrl}/${slug}`;
};

/**
 * Validates topic name format (client-side validation)
 * For plan-based validation, pass hasPremiumShortLinks parameter
 */
export function validateTopicName(
  topic: string,
  hasPremiumShortLinks?: boolean
): {
  isValid: boolean;
  error?: string;
} {
  if (!topic.trim()) {
    return { isValid: false, error: 'Topic name is required' };
  }

  // Check for invalid characters (only allow letters, numbers, spaces, hyphens, underscores)
  const invalidChars = topic.match(/[^a-zA-Z0-9\s\-_]/g);
  if (invalidChars) {
    return {
      isValid: false,
      error: `Invalid characters: ${[...new Set(invalidChars)].join(', ')}. Only letters, numbers, spaces, hyphens, and underscores are allowed.`,
    };
  }

  // Must contain at least one alphanumeric character
  if (!/[a-zA-Z0-9]/.test(topic)) {
    return {
      isValid: false,
      error: 'Topic must contain at least one letter or number',
    };
  }

  // Check plan-based length restriction if hasPremiumShortLinks is provided
  if (hasPremiumShortLinks !== undefined) {
    const topicSlug = generateUrlSlug(topic);
    if (!hasPremiumShortLinks && topicSlug.length < 5) {
      return {
        isValid: false,
        error:
          'Topic names that create URLs with less than 5 characters are reserved for Pro users. Upgrade to access premium short links!',
      };
    }
  }

  return { isValid: true };
}

/**
 * Converts a string to a URL-friendly slug
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes special characters except letters, numbers, and hyphens
 * - Handles multiple consecutive spaces/hyphens
 * - Trims leading/trailing hyphens
 */
export function generateUrlSlug(input: string): string {
  if (!input) return '';

  return (
    input
      .toLowerCase()
      .trim()
      // Replace spaces with hyphens
      .replace(/\s+/g, '-')
      // Remove all special characters except letters, numbers, and hyphens
      .replace(/[^a-z0-9-]/g, '')
      // Replace multiple consecutive hyphens with single hyphen
      .replace(/-+/g, '-')
      // Remove leading and trailing hyphens
      .replace(/^-+|-+$/g, '')
  );
}

/**
 * Generates a complete URL preview for a topic link
 */
export function generateTopicUrl(baseSlug: string, topic: string): string {
  const { getDisplayDomain } = require('@/lib/config/url-config');
  const domain = getDisplayDomain();
  const topicSlug = generateUrlSlug(topic);
  if (!topicSlug) return `${domain}/${baseSlug}`;
  return `${domain}/${baseSlug}/${topicSlug}`;
}

/**
 * Hook for real-time URL generation with validation
 */
export function useUrlGeneration(baseSlug: string) {
  return {
    generateSlug: generateUrlSlug,
    validateTopic: validateTopicName,
    generateUrl: (topic: string) => generateTopicUrl(baseSlug, topic),
  };
}