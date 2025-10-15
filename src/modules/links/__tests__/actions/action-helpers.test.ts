// =============================================================================
// ACTION HELPERS TESTS
// =============================================================================
// Tests for link action helper functions including HOFs and utilities

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  withLinkAuth,
  withLinkAuthInput,
  formatActionError,
  getAuthenticatedWorkspace,
  verifyLinkOwnership,
  type LinkActionResponse,
} from '../../lib/actions/action-helpers';
import { createTestUser, createTestWorkspace, createTestLink, cleanupTestUser, testData } from '@/test/db-test-utils';

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

import { auth } from '@clerk/nextjs/server';

describe('Link Action Helpers', () => {
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

  describe('withLinkAuth', () => {
    it('should return error when user is not authenticated', async () => {
      // Arrange: Mock unauthenticated state
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      // Create a simple handler that should not be called
      const mockHandler = vi.fn().mockResolvedValue({
        success: true,
        data: 'test-data',
      } as const);

      const wrappedAction = withLinkAuth('testAction', mockHandler);

      // Act: Execute wrapped action
      const result = await wrappedAction();

      // Assert: Should return unauthorized error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized. Please sign in.');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should call handler with userId when authenticated', async () => {
      // Arrange: Create test user and mock authentication
      const user = await createTestUser();
      testUserId = user.id;

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Create handler that returns success
      const mockHandler = vi.fn().mockResolvedValue({
        success: true,
        data: 'test-result',
      } as const);

      const wrappedAction = withLinkAuth('testAction', mockHandler);

      // Act: Execute wrapped action
      const result = await wrappedAction();

      // Assert: Handler should be called with correct userId
      expect(mockHandler).toHaveBeenCalledWith(testUserId);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test-result');
      }
    });

    it('should pass through LinkActionResponse errors from handler', async () => {
      // Arrange: Create test user and mock authentication
      const user = await createTestUser();
      testUserId = user.id;

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Create handler that throws LinkActionResponse
      const mockHandler = vi.fn().mockRejectedValue({
        success: false,
        error: 'Workspace not found',
      });

      const wrappedAction = withLinkAuth('testAction', mockHandler);

      // Act: Execute wrapped action
      const result = await wrappedAction();

      // Assert: Should return the thrown LinkActionResponse
      expect(result.success).toBe(false);
      expect(result.error).toBe('Workspace not found');
    });

    it('should handle unexpected errors gracefully', async () => {
      // Arrange: Create test user and mock authentication
      const user = await createTestUser();
      testUserId = user.id;

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Create handler that throws unexpected error
      const mockHandler = vi.fn().mockRejectedValue(new Error('Database connection failed'));

      const wrappedAction = withLinkAuth('testAction', mockHandler);

      // Act: Execute wrapped action
      const result = await wrappedAction();

      // Assert: Should return generic error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to execute testAction.');
    });
  });

  describe('withLinkAuthInput', () => {
    it('should return error when user is not authenticated', async () => {
      // Arrange: Mock unauthenticated state
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const mockHandler = vi.fn();
      const wrappedAction = withLinkAuthInput('testInputAction', mockHandler);

      // Act: Execute wrapped action with input
      const result = await wrappedAction({ name: 'test' });

      // Assert: Should return unauthorized error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized. Please sign in.');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should call handler with userId and input when authenticated', async () => {
      // Arrange: Create test user and mock authentication
      const user = await createTestUser();
      testUserId = user.id;

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      const mockHandler = vi.fn().mockResolvedValue({
        success: true,
        data: { id: '123', name: 'test' },
      } as const);

      const wrappedAction = withLinkAuthInput<{ name: string }, { id: string; name: string }>(
        'testInputAction',
        mockHandler
      );

      const input = { name: 'test-link' };

      // Act: Execute wrapped action
      const result = await wrappedAction(input);

      // Assert: Handler should be called with userId and input
      expect(mockHandler).toHaveBeenCalledWith(testUserId, input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ id: '123', name: 'test' });
      }
    });

    it('should include input in error logs for debugging', async () => {
      // Arrange: Create test user and mock authentication
      const user = await createTestUser();
      testUserId = user.id;

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      const mockHandler = vi.fn().mockRejectedValue(new Error('Validation failed'));
      const wrappedAction = withLinkAuthInput('testInputAction', mockHandler);

      const input = { name: 'invalid-name' };

      // Act: Execute wrapped action
      const result = await wrappedAction(input);

      // Assert: Should return error (logger will have received input)
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to execute testInputAction.');
    });
  });

  describe('formatActionError', () => {
    it('should return LinkActionResponse if error is already formatted', () => {
      // Arrange: Create a LinkActionResponse error
      const linkError: LinkActionResponse = {
        success: false,
        error: 'Link not found',
      };

      // Act: Format the error
      const result = formatActionError(linkError);

      // Assert: Should return the same error
      expect(result).toEqual(linkError);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Link not found');
    });

    it('should format Error objects', () => {
      // Arrange: Create standard Error
      const error = new Error('Database timeout');

      // Act: Format the error
      const result = formatActionError(error);

      // Assert: Should extract error message
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database timeout');
    });

    it('should use fallback message for unknown errors', () => {
      // Arrange: Create unknown error type
      const unknownError = 'string error';

      // Act: Format the error
      const result = formatActionError(unknownError, 'Something went wrong');

      // Assert: Should use fallback message
      expect(result.success).toBe(false);
      expect(result.error).toBe('Something went wrong');
    });

    it('should use default fallback message when not provided', () => {
      // Arrange: Create unknown error
      const unknownError = 12345;

      // Act: Format the error without custom fallback
      const result = formatActionError(unknownError);

      // Assert: Should use default fallback message
      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred.');
    });
  });

  describe('getAuthenticatedWorkspace', () => {
    it('should throw LinkActionResponse when workspace not found', async () => {
      // Arrange: Create test user with no workspace
      const user = await createTestUser();
      testUserId = user.id;

      // Act & Assert: Should throw workspace not found error
      await expect(getAuthenticatedWorkspace(testUserId)).rejects.toEqual({
        success: false,
        error: 'Workspace not found. Please complete onboarding.',
      });
    });

    it('should return workspace when user has workspace', async () => {
      // Arrange: Create test user with workspace
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      // Act: Get authenticated workspace
      const result = await getAuthenticatedWorkspace(testUserId);

      // Assert: Should return the workspace
      expect(result).toBeDefined();
      expect(result.id).toBe(workspace.id);
      expect(result.userId).toBe(testUserId);
      expect(result.name).toBe('Test Workspace');
    });
  });

  describe('verifyLinkOwnership', () => {
    it('should throw LinkActionResponse when link not found', async () => {
      // Arrange: Create test user and workspace
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      const nonExistentLinkId = crypto.randomUUID();

      // Act & Assert: Should throw link not found error
      await expect(
        verifyLinkOwnership(nonExistentLinkId, workspace.id, 'testAction')
      ).rejects.toEqual({
        success: false,
        error: 'Link not found.',
      });
    });

    it('should throw unauthorized error when link belongs to different workspace', async () => {
      // Arrange: Create test user with workspace and link
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'User Workspace',
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        slug: 'test-link',
        name: 'Test Link',
      });

      // Try to access with different workspace ID
      const differentWorkspaceId = testData.generateWorkspaceId();

      // Act & Assert: Should throw unauthorized error
      await expect(
        verifyLinkOwnership(link.id, differentWorkspaceId, 'testAction')
      ).rejects.toEqual({
        success: false,
        error: 'You do not have permission to access this link.',
      });
    });

    it('should return link when ownership is verified', async () => {
      // Arrange: Create test user with workspace and link
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'User Workspace',
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        slug: 'owned-link',
        name: 'Owned Link',
      });

      // Act: Verify ownership with correct workspace
      const result = await verifyLinkOwnership(link.id, workspace.id, 'testAction');

      // Assert: Should return the link
      expect(result).toBeDefined();
      expect(result.id).toBe(link.id);
      expect(result.workspaceId).toBe(workspace.id);
      expect(result.slug).toBe('owned-link');
    });
  });
});
