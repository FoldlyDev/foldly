/**
 * Links Utils - Barrel Exports
 * Utility functions for the links feature
 */

export { createSeedLinks, initializeSeedData } from './seed-data';

/**
 * URL utility functions for the links feature
 * Provides real-time slug generation and validation
 */

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
 * Validates if a topic name is valid (before conversion to slug)
 * - Must contain at least one word (letter or number)
 * - Can contain letters, numbers, spaces, hyphens, and underscores
 * - No other special characters allowed
 */
export function validateTopicName(topic: string): {
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

  return { isValid: true };
}

/**
 * Generates a complete URL preview for a topic link
 */
export function generateTopicUrl(username: string, topic: string): string {
  const slug = generateUrlSlug(topic);
  if (!slug) return `foldly.io/${username}`;
  return `foldly.io/${username}/${slug}`;
}

/**
 * Hook for real-time URL generation with validation
 */
export function useUrlGeneration(username: string) {
  return {
    generateSlug: generateUrlSlug,
    validateTopic: validateTopicName,
    generateUrl: (topic: string) => generateTopicUrl(username, topic),
  };
}
