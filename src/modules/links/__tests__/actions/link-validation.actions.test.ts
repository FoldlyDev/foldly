// =============================================================================
// LINK VALIDATION ACTIONS TESTS
// =============================================================================
// Tests for link validation operations (checkSlugAvailability)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkSlugAvailabilityAction } from '../../lib/actions/link-validation.actions';
import {
  createTestUser,
  createTestWorkspace,
  createTestLink,
  cleanupTestUser,
  testData,
} from '@/test/db-test-utils';

// Mock Clerk authentication
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock logger to prevent console spam during tests
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
  logAuthFailure: vi.fn(),
  logSecurityEvent: vi.fn(),
  logSecurityIncident: vi.fn(),
  logRateLimitViolation: vi.fn(),
}));

// Mock rate limiting to avoid Redis dependency in tests
vi.mock('@/lib/middleware/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 29,
    resetAt: Date.now() + 60000,
    blocked: false,
  }),
}));

import { auth } from '@clerk/nextjs/server';
import { checkRateLimit } from '@/lib/middleware/rate-limit';

describe('Link Validation Actions', () => {
  let testUserId: string;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test data
    if (testUserId) {
      await cleanupTestUser(testUserId);
    }
  });

  // ===========================================================================
  // checkSlugAvailabilityAction Tests
  // ===========================================================================

  describe('checkSlugAvailabilityAction', () => {
    it('should return true for available slug', async () => {
      // Arrange: Create test user (no need for link)
      const user = await createTestUser();
      testUserId = user.id;

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Check availability of unused slug
      const availableSlug = testData.generateLinkSlug();
      const result = await checkSlugAvailabilityAction({ slug: availableSlug });

      // Assert: Should be available
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false for taken slug', async () => {
      // Arrange: Create test user with workspace and link
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      const takenSlug = testData.generateLinkSlug();
      await createTestLink({
        workspaceId: workspace.id,
        slug: takenSlug,
        name: 'Taken Link',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Check availability of taken slug
      const result = await checkSlugAvailabilityAction({ slug: takenSlug });

      // Assert: Should not be available
      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });

    it('should sanitize slug before checking availability', async () => {
      // Arrange: Create test user with workspace and link (lowercase slug)
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      const mySlug = testData.generateLinkSlug().toLowerCase(); // Ensure lowercase
      await createTestLink({
        workspaceId: workspace.id,
        slug: mySlug,
        name: 'My Link',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Check with uppercase version (should be sanitized to lowercase)
      const result = await checkSlugAvailabilityAction({ slug: mySlug.toUpperCase() });

      // Assert: Should not be available (sanitized to lowercase which exists)
      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });

    it('should reject slug that is too short after sanitization', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      testUserId = user.id;

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Try to check slug that's too short
      const result = await checkSlugAvailabilityAction({ slug: 'ab' });

      // Assert: Should return validation error
      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 3 characters');
    });

    it('should handle rate limit exceeded', async () => {
      // Arrange: Create test user and mock rate limit exceeded
      const user = await createTestUser();
      testUserId = user.id;

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);
      vi.mocked(checkRateLimit).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
        blocked: true,
      });

      // Act: Try to check slug
      const result = await checkSlugAvailabilityAction({ slug: testData.generateLinkSlug() });

      // Assert: Should return rate limit error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Too many requests. Please try again later.');
      expect(result.blocked).toBe(true);
      expect(result.resetAt).toBeDefined();
    });
  });
});
