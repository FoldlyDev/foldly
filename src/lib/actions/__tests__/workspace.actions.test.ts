// =============================================================================
// WORKSPACE ACTIONS TESTS
// =============================================================================
// Tests for workspace server actions with authentication checks

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createUserWorkspaceAction,
  updateWorkspaceNameAction,
  createDefaultLinkAction,
} from '../workspace.actions';
import {
  createTestUser,
  createTestWorkspace,
  cleanupTestUser,
  testData,
} from '@/test/db-test-utils';
import {
  getPermissionByLinkAndEmail,
} from '@/lib/database/queries';

// Mock Clerk authentication
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

import { auth, currentUser } from '@clerk/nextjs/server';

describe('Workspace Actions', () => {
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

  describe('createUserWorkspaceAction', () => {
    it('should return error when user is not authenticated', async () => {
      // Arrange: Mock unauthenticated state
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);
      vi.mocked(currentUser).mockResolvedValue(null);

      // Act: Attempt to create workspace
      const result = await createUserWorkspaceAction({ username: 'testuser' });

      // Assert: Should return unauthorized error
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });

    it('should successfully create workspace for authenticated user', async () => {
      // Arrange: Create test user and mock authentication
      const user = await createTestUser();
      testUserId = user.id;

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);
      vi.mocked(currentUser).mockResolvedValue({
        id: testUserId,
        username: 'testuser',
      } as any);

      // Act: Create workspace
      const result = await createUserWorkspaceAction({ username: 'testuser' });

      // Assert: Workspace should be created successfully
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data).toBeDefined();
        expect(result.data.userId).toBe(testUserId);
        expect(result.data.name).toBe("testuser's Workspace");
      }
    });

    it('should return error when workspace already exists', async () => {
      // Arrange: Create test user with existing workspace
      const user = await createTestUser();
      testUserId = user.id;

      await createTestWorkspace({
        userId: testUserId,
        name: 'Existing Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);
      vi.mocked(currentUser).mockResolvedValue({
        id: testUserId,
        username: 'testuser',
      } as any);

      // Act: Attempt to create second workspace
      const result = await createUserWorkspaceAction({ username: 'testuser' });

      // Assert: Should return duplicate workspace error
      expect(result.success).toBe(false);
      expect(result.error).toContain('Workspace already exists');
    });
  });

  describe('updateWorkspaceNameAction', () => {
    it('should return error when user is not authenticated', async () => {
      // Arrange: Mock unauthenticated state
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      // Act: Attempt to update workspace
      const result = await updateWorkspaceNameAction({
        workspaceId: 'workspace-id',
        name: 'New Name',
      });

      // Assert: Should return unauthorized error
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });

    it('should return error when user does not own workspace', async () => {
      // Arrange: Create test user and workspace owned by another user
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Original Workspace',
      });

      // Mock authentication as a different user
      const differentUserId = testData.generateUserId();
      vi.mocked(auth).mockResolvedValue({ userId: differentUserId } as any);

      // Act: Attempt to update workspace owned by different user
      const result = await updateWorkspaceNameAction({
        workspaceId: workspace.id,
        name: 'New Name',
      });

      // Assert: Should return not found/unauthorized error
      expect(result.success).toBe(false);
      expect(result.error).toContain('Workspace not found');
    });

    it('should successfully update workspace name for owner', async () => {
      // Arrange: Create test user and workspace
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Original Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Update workspace name
      const result = await updateWorkspaceNameAction({
        workspaceId: workspace.id,
        name: 'Updated Workspace Name',
      });

      // Assert: Name should be updated successfully
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data).toBeDefined();
        expect(result.data.id).toBe(workspace.id);
        expect(result.data.name).toBe('Updated Workspace Name');
      }
    });

    it('should return error when workspace not found', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      testUserId = user.id;

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      const nonExistentId = testData.generateWorkspaceId();

      // Act: Attempt to update non-existent workspace
      const result = await updateWorkspaceNameAction({
        workspaceId: nonExistentId,
        name: 'New Name',
      });

      // Assert: Should return not found error
      expect(result.success).toBe(false);
      expect(result.error).toContain('Workspace not found');
    });
  });

  describe('createDefaultLinkAction', () => {
    it('should return error when user is not authenticated', async () => {
      // Arrange: Mock unauthenticated state
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);
      vi.mocked(currentUser).mockResolvedValue(null);

      // Act: Attempt to create default link
      const result = await createDefaultLinkAction('workspace-id', 'test-slug');

      // Assert: Should return unauthorized error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should return error when workspace does not exist', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      testUserId = user.id;

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);
      vi.mocked(currentUser).mockResolvedValue({
        id: testUserId,
        primaryEmailAddress: { emailAddress: 'test@example.com' },
        emailAddresses: [{ emailAddress: 'test@example.com' }],
      } as any);

      const nonExistentWorkspaceId = testData.generateWorkspaceId();

      // Act: Attempt to create link for non-existent workspace
      const result = await createDefaultLinkAction(
        nonExistentWorkspaceId,
        'test-slug'
      );

      // Assert: Should return workspace not found error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Workspace not found or unauthorized');
    });

    it('should return error when user does not own workspace', async () => {
      // Arrange: Create test user and workspace owned by that user
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      // Mock authentication as a different user
      const differentUserId = testData.generateUserId();
      vi.mocked(auth).mockResolvedValue({ userId: differentUserId } as any);
      vi.mocked(currentUser).mockResolvedValue({
        id: differentUserId,
        primaryEmailAddress: { emailAddress: 'other@example.com' },
        emailAddresses: [{ emailAddress: 'other@example.com' }],
      } as any);

      // Act: Attempt to create link for workspace owned by different user
      const result = await createDefaultLinkAction(workspace.id, 'test-slug');

      // Assert: Should return unauthorized error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Workspace not found or unauthorized');
    });

    it('should successfully create link with owner permission', async () => {
      // Arrange: Create test user and workspace
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      const ownerEmail = 'owner@example.com';

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);
      vi.mocked(currentUser).mockResolvedValue({
        id: testUserId,
        primaryEmailAddress: { emailAddress: ownerEmail },
        emailAddresses: [{ emailAddress: ownerEmail }],
      } as any);

      // Act: Create default link
      const result = await createDefaultLinkAction(workspace.id, 'test-first-link');

      // Assert: Link should be created successfully
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.link).toBeDefined();
        expect(result.link.workspaceId).toBe(workspace.id);
        expect(result.link.slug).toBe('test-first-link');
        expect(result.link.name).toBe('My First Link');
        expect(result.link.isPublic).toBe(true);
      }
    });

    it('should create owner permission with correct email', async () => {
      // Arrange: Create test user and workspace
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      const ownerEmail = 'owner@example.com';

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);
      vi.mocked(currentUser).mockResolvedValue({
        id: testUserId,
        primaryEmailAddress: { emailAddress: ownerEmail },
        emailAddresses: [{ emailAddress: ownerEmail }],
      } as any);

      // Act: Create default link
      const result = await createDefaultLinkAction(workspace.id, 'test-link-perm');

      // Assert: Owner permission should be created
      expect(result.success).toBe(true);
      if (result.success) {
        const permission = await getPermissionByLinkAndEmail(
          result.link.id,
          ownerEmail
        );

        expect(permission).toBeDefined();
        expect(permission?.email).toBe(ownerEmail);
        expect(permission?.role).toBe('owner');
        expect(permission?.isVerified).toBe('true');
      }
    });

    it('should use fallback email if primary email is not available', async () => {
      // Arrange: Create test user and workspace
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      const fallbackEmail = 'fallback@example.com';

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);
      vi.mocked(currentUser).mockResolvedValue({
        id: testUserId,
        primaryEmailAddress: null, // No primary email
        emailAddresses: [{ emailAddress: fallbackEmail }],
      } as any);

      // Act: Create default link
      const result = await createDefaultLinkAction(workspace.id, 'test-link-fallback');

      // Assert: Should use fallback email for owner permission
      expect(result.success).toBe(true);
      if (result.success) {
        const permission = await getPermissionByLinkAndEmail(
          result.link.id,
          fallbackEmail
        );

        expect(permission).toBeDefined();
        expect(permission?.email).toBe(fallbackEmail);
        expect(permission?.role).toBe('owner');
      }
    });

    it('should handle duplicate slug gracefully', async () => {
      // Arrange: Create test user, workspace, and initial link with slug
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);
      vi.mocked(currentUser).mockResolvedValue({
        id: testUserId,
        primaryEmailAddress: { emailAddress: 'test@example.com' },
        emailAddresses: [{ emailAddress: 'test@example.com' }],
      } as any);

      // Create first link with slug
      await createDefaultLinkAction(workspace.id, 'duplicate-slug');

      // Act: Attempt to create link with same slug
      const result = await createDefaultLinkAction(workspace.id, 'duplicate-slug');

      // Assert: Should return error (unique constraint violation)
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create link');
    });

    it('should return error when user has no email addresses', async () => {
      // Arrange: Create test user and workspace
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);
      vi.mocked(currentUser).mockResolvedValue({
        id: testUserId,
        primaryEmailAddress: null, // No primary email
        emailAddresses: [], // Empty email array - EDGE CASE
      } as any);

      // Act: Attempt to create default link with no email
      const result = await createDefaultLinkAction(workspace.id, 'test-link-no-email');

      // Assert: Should return error about missing email
      expect(result.success).toBe(false);
      expect(result.error).toContain('email');
    });
  });
});
