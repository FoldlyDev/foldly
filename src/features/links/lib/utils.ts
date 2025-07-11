/**
 * Links Utils - Utility functions for the links feature
 * Consolidated from utils/index.ts to resolve module resolution conflicts
 */

import type { LinkWithStats, DatabaseId, LinkType } from '@/lib/supabase/types';

/**
 * Seed data functions - moved from deleted utils/seed-data.ts
 */
export function createSeedLinks(): LinkWithStats[] {
  return [
    {
      id: 'seed-1' as DatabaseId,
      userId: 'user-1',
      workspaceId: 'workspace-1',
      slug: 'portfolio-submissions',
      topic: 'Portfolio Submissions',
      linkType: 'topic' as LinkType,
      title: 'Portfolio Submissions',
      description: 'Upload your portfolio files for review',
      isPublic: true,
      isActive: true,
      requireEmail: false,
      requirePassword: false,
      passwordHash: null,
      maxFiles: 10,
      maxFileSize: 50,
      allowedFileTypes: ['image/*', 'application/pdf'],
      expiresAt: null,
      brandEnabled: false,
      brandColor: null,
      totalUploads: 32,
      totalFiles: 24,
      totalSize: 156789123,
      lastUploadAt: new Date('2024-01-15T10:30:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        fileCount: 24,
        batchCount: 8,
        folderCount: 3,
        totalViewCount: 156,
        uniqueViewCount: 89,
        averageFileSize: 6532880,
        storageUsedPercentage: 62.4,
        isNearLimit: false,
      },
    },
    {
      id: 'seed-2' as DatabaseId,
      userId: 'user-1',
      workspaceId: 'workspace-1',
      slug: 'feedback-forms',
      topic: 'Feedback Forms',
      linkType: 'topic' as LinkType,
      title: 'Feedback Forms',
      description: 'Upload feedback documents and forms',
      isPublic: true,
      isActive: true,
      requireEmail: true,
      requirePassword: false,
      passwordHash: null,
      maxFiles: 5,
      maxFileSize: 25,
      allowedFileTypes: ['image/*', 'application/pdf', 'text/*'],
      expiresAt: null,
      brandEnabled: true,
      brandColor: '#3b82f6',
      totalUploads: 16,
      totalFiles: 12,
      totalSize: 45123456,
      lastUploadAt: new Date('2024-01-14T16:45:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        fileCount: 12,
        batchCount: 4,
        folderCount: 2,
        totalViewCount: 89,
        uniqueViewCount: 34,
        averageFileSize: 3760288,
        storageUsedPercentage: 36.1,
        isNearLimit: false,
      },
    },
  ];
}

export function initializeSeedData(): LinkWithStats[] {
  return createSeedLinks();
}

/**
 * Validates topic name format
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
