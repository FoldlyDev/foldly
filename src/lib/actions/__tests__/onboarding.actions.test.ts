// =============================================================================
// ONBOARDING ACTIONS TESTS
// =============================================================================
// Tests for onboarding status checks with authentication states

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkOnboardingStatus } from '../onboarding.actions';
import {
  createTestUser,
  createTestWorkspace,
  cleanupTestUser,
} from '@/test/db-test-utils';

// Mock Clerk authentication
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';

describe('Onboarding Actions', () => {
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

  describe('checkOnboardingStatus', () => {
    it('should return false for unauthenticated users', async () => {
      // Arrange: Mock unauthenticated state
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      // Act: Check onboarding status
      const result = await checkOnboardingStatus();

      // Assert: Should return no workspace
      expect(result.hasWorkspace).toBe(false);
      expect(result.workspaceId).toBeNull();
    });

    it('should return false when authenticated user has no workspace', async () => {
      // Arrange: Create test user without workspace
      const user = await createTestUser();
      testUserId = user.id;

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Check onboarding status
      const result = await checkOnboardingStatus();

      // Assert: Should return no workspace
      expect(result.hasWorkspace).toBe(false);
      expect(result.workspaceId).toBeNull();
    });

    it('should return true when authenticated user has workspace', async () => {
      // Arrange: Create test user with workspace
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Check onboarding status
      const result = await checkOnboardingStatus();

      // Assert: Should return workspace exists
      expect(result.hasWorkspace).toBe(true);
      expect(result.workspaceId).toBe(workspace.id);
    });

    it('should return correct workspace ID for onboarded user', async () => {
      // Arrange: Create test user with workspace
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: "User's Workspace",
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Check onboarding status multiple times
      const result1 = await checkOnboardingStatus();
      const result2 = await checkOnboardingStatus();

      // Assert: Should consistently return same workspace ID
      expect(result1.hasWorkspace).toBe(true);
      expect(result1.workspaceId).toBe(workspace.id);
      expect(result2.hasWorkspace).toBe(true);
      expect(result2.workspaceId).toBe(workspace.id);
    });
  });
});
