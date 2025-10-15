// =============================================================================
// LINK READ ACTIONS TESTS
// =============================================================================
// Tests for link read operations (getUserLinks, getLinkById)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getUserLinksAction, getLinkByIdAction } from '../../lib/actions/link-read.actions';
import {
  createTestUser,
  createTestWorkspace,
  createTestLink,
  cleanupTestUser,
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
    remaining: 99,
    resetAt: Date.now() + 60000,
    blocked: false,
  }),
}));

import { auth } from '@clerk/nextjs/server';
import { checkRateLimit } from '@/lib/middleware/rate-limit';

describe('Link Read Actions', () => {
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
  // getUserLinksAction Tests
  // ===========================================================================

  describe('getUserLinksAction', () => {
    it('should return user links successfully', async () => {
      // Arrange: Create test user with workspace and links
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      const link1 = await createTestLink({
        workspaceId: workspace.id,
        name: 'Link One',
      });

      const link2 = await createTestLink({
        workspaceId: workspace.id,
        name: 'Link Two',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Get user's links
      const result = await getUserLinksAction();

      // Assert: Should return both links
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(2);
      expect(result.data?.map((l) => l.id)).toContain(link1.id);
      expect(result.data?.map((l) => l.id)).toContain(link2.id);
    });

    it('should return empty array when user has no links', async () => {
      // Arrange: Create test user with workspace but no links
      const user = await createTestUser();
      testUserId = user.id;

      await createTestWorkspace({
        userId: testUserId,
        name: 'Empty Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Get user's links
      const result = await getUserLinksAction();

      // Assert: Should return empty array
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(0);
    });

    it('should handle rate limit exceeded', async () => {
      // Arrange: Create test user and mock rate limit exceeded
      const user = await createTestUser();
      testUserId = user.id;

      await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);
      vi.mocked(checkRateLimit).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
        blocked: true,
      });

      // Act: Try to get links
      const result = await getUserLinksAction();

      // Assert: Should return rate limit error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Too many requests. Please try again later.');
      expect(result.blocked).toBe(true);
      expect(result.resetAt).toBeDefined();
    });

    it('should handle workspace not found', async () => {
      // Arrange: Create test user WITHOUT workspace
      const user = await createTestUser();
      testUserId = user.id;

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Try to get links
      const result = await getUserLinksAction();

      // Assert: Should return workspace not found error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Workspace not found. Please complete onboarding.');
    });
  });

  // ===========================================================================
  // getLinkByIdAction Tests
  // ===========================================================================

  describe('getLinkByIdAction', () => {
    it('should return link with permissions successfully', async () => {
      // Arrange: Create test user with workspace and link
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: 'Test Link',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Get link by ID
      const result = await getLinkByIdAction({ linkId: link.id });

      // Assert: Should return link with permissions
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(link.id);
      expect(result.data?.slug).toBe('test-link');
      expect(result.data?.name).toBe('Test Link');
    });

    it('should handle invalid UUID format', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      testUserId = user.id;

      await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Try to get link with invalid UUID
      const result = await getLinkByIdAction({ linkId: 'invalid-uuid' });

      // Assert: Should return validation error
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });

    it('should handle rate limit exceeded', async () => {
      // Arrange: Create test user and mock rate limit exceeded
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: 'Test Link',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);
      vi.mocked(checkRateLimit).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
        blocked: true,
      });

      // Act: Try to get link
      const result = await getLinkByIdAction({ linkId: link.id });

      // Assert: Should return rate limit error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Too many requests. Please try again later.');
      expect(result.blocked).toBe(true);
    });

    it('should handle link not found', async () => {
      // Arrange: Create test user with workspace
      const user = await createTestUser();
      testUserId = user.id;

      await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      const nonExistentLinkId = crypto.randomUUID();

      // Act: Try to get non-existent link
      const result = await getLinkByIdAction({ linkId: nonExistentLinkId });

      // Assert: Should return link not found error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Link not found.');
    });

    it('should handle unauthorized access to link from different workspace', async () => {
      // Arrange: Create first user with workspace and link
      const user1 = await createTestUser();
      const workspace1 = await createTestWorkspace({
        userId: user1.id,
        name: 'Workspace 1',
      });
      const link = await createTestLink({
        workspaceId: workspace1.id,
        name: 'User 1 Link',
      });

      // Create second user with different workspace
      const user2 = await createTestUser();
      testUserId = user2.id;
      await createTestWorkspace({
        userId: user2.id,
        name: 'Workspace 2',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: User 2 tries to access User 1's link
      const result = await getLinkByIdAction({ linkId: link.id });

      // Assert: Should return unauthorized error
      expect(result.success).toBe(false);
      expect(result.error).toBe('You do not have permission to access this link.');

      // Cleanup user1
      await cleanupTestUser(user1.id);
    });

    it('should handle workspace not found', async () => {
      // Arrange: Create test user WITHOUT workspace
      const user = await createTestUser();
      testUserId = user.id;

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      const linkId = crypto.randomUUID();

      // Act: Try to get link
      const result = await getLinkByIdAction({ linkId });

      // Assert: Should return workspace not found error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Workspace not found. Please complete onboarding.');
    });
  });
});
