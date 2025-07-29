/**
 * Slug normalization utilities
 * Provides consistent slug handling across the entire links feature
 */

import { useCallback } from 'react';

/**
 * Normalizes a slug to lowercase and handles edge cases
 * @param slug - The slug to normalize
 * @returns Normalized slug (lowercase, trimmed)
 */
export function normalizeSlug(slug: string): string {
  if (!slug) return '';

  return (
    slug
      .toLowerCase()
      .trim()
      // Remove any potential double spaces and replace with single
      .replace(/\s+/g, ' ')
      // Convert spaces to hyphens for URL-friendly format (if needed)
      .replace(/\s/g, '-')
  );
}

/**
 * Normalizes a topic name to lowercase for consistent comparison
 * @param topic - The topic to normalize
 * @returns Normalized topic (lowercase, trimmed)
 */
export function normalizeTopic(topic: string): string {
  if (!topic) return '';

  return topic.toLowerCase().trim();
}

/**
 * Hook for slug normalization with consistent behavior
 * Provides normalized values and normalization functions
 * Uses useCallback to prevent unnecessary re-renders
 */

export function useSlugNormalization() {
  const normalizeSlugInput = useCallback((input: string): string => {
    return normalizeSlug(input);
  }, []);

  const normalizeTopicInput = useCallback((input: string): string => {
    return normalizeTopic(input);
  }, []);

  const isSlugEquivalent = useCallback(
    (slug1: string, slug2: string): boolean => {
      return normalizeSlug(slug1) === normalizeSlug(slug2);
    },
    []
  );

  const isTopicEquivalent = useCallback(
    (topic1: string, topic2: string): boolean => {
      return normalizeTopic(topic1) === normalizeTopic(topic2);
    },
    []
  );

  return {
    normalizeSlug: normalizeSlugInput,
    normalizeTopic: normalizeTopicInput,
    isSlugEquivalent,
    isTopicEquivalent,
  };
}

/**
 * Validates if a normalized slug is valid format
 * @param normalizedSlug - Pre-normalized slug to validate
 * @returns True if valid format
 */
export function isValidNormalizedSlug(normalizedSlug: string): boolean {
  if (!normalizedSlug) return true; // Empty is valid (will use username)

  // Check for valid URL-safe characters (lowercase letters, numbers, hyphens, underscores)
  return /^[a-z0-9_-]+$/.test(normalizedSlug);
}

/**
 * Validates if a normalized topic is valid format
 * @param normalizedTopic - Pre-normalized topic to validate
 * @returns True if valid format
 */
export function isValidNormalizedTopic(normalizedTopic: string): boolean {
  if (!normalizedTopic) return false; // Topic is required

  // Allow lowercase letters, numbers, spaces, hyphens, underscores
  return /^[a-z0-9\s_-]+$/.test(normalizedTopic);
}
