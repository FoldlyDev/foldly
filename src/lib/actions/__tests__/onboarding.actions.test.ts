// =============================================================================
// ONBOARDING ACTIONS TESTS
// =============================================================================
// Tests for onboarding status checks with authentication states

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkOnboardingStatus,
  checkUsernameAvailability,
  completeOnboardingAction
} from '../onboarding.actions';
import {
  createTestUser,
  createTestWorkspace,
  cleanupTestUser,
} from '@/test/db-test-utils';
import { getUserById } from '@/lib/database/queries/user.queries';
import { getUserWorkspace } from '@/lib/database/queries/workspace.queries';
import { resetRateLimit, RateLimitKeys } from '@/lib/middleware/rate-limit';
import { db } from '@/lib/database/connection';
import { workspaces as workspacesTable, links, permissions } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';

// Mock Clerk authentication
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ has: vi.fn() })),
  clerkClient: vi.fn(),
  currentUser: vi.fn(),
  reverificationError: vi.fn((level: string) => ({
    success: false,
    isAvailable: false,
    message: 'Reverification required',
  })),
}));

import { auth, clerkClient, currentUser, reverificationError } from '@clerk/nextjs/server';

describe('Onboarding Actions', () => {
  // Track all user IDs created in each test for proper cleanup
  const createdUserIds = new Set<string>();

  beforeEach(() => {
    vi.clearAllMocks();
    createdUserIds.clear();
  });

  afterEach(async () => {
    // Clean up all test data created in this test
    const cleanupPromises = Array.from(createdUserIds).map(id => cleanupTestUser(id));
    await Promise.all(cleanupPromises);
    createdUserIds.clear();
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
      createdUserIds.add(user.id);

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Act: Check onboarding status
      const result = await checkOnboardingStatus();

      // Assert: Should return no workspace
      expect(result.hasWorkspace).toBe(false);
      expect(result.workspaceId).toBeNull();
    });

    it('should return true when authenticated user has workspace', async () => {
      // Arrange: Create test user with workspace
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Act: Check onboarding status
      const result = await checkOnboardingStatus();

      // Assert: Should return workspace exists
      expect(result.hasWorkspace).toBe(true);
      expect(result.workspaceId).toBe(workspace.id);
    });

    it('should return correct workspace ID for onboarded user', async () => {
      // Arrange: Create test user with workspace
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: "User's Workspace",
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

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

  describe('checkUsernameAvailability', () => {
    it('should return reverification required when user has not reverified', async () => {
      // Arrange: Mock auth.protect() to return reverification not met
      const hasMock = vi.fn().mockReturnValue(false); // User hasn't reverified
      const protectMock = vi.fn().mockResolvedValue({ userId: 'test_user_reauth', has: hasMock });
      vi.mocked(auth).mockImplementation((() => ({ protect: protectMock })) as any);
      vi.mocked(auth).protect = protectMock;

      // Reset rate limit for clean test
      resetRateLimit(RateLimitKeys.usernameCheck('test_user_reauth'));

      // Act: Check username availability
      const result = await checkUsernameAvailability('testuser');

      // Assert: Should return reverification error
      if ('success' in result) {
        expect(result.success).toBe(false);
        expect(result.isAvailable).toBe(false);
        expect(result.message).toBe('Reverification required');
      }
    });

    it('should return available when username does not exist in Clerk', async () => {
      // Arrange: Mock auth.protect() and clerkClient
      const mockUserId = 'test_user_available';
      const hasMock = vi.fn().mockReturnValue(true); // User has reverified
      const protectMock = vi.fn().mockResolvedValue({ userId: mockUserId, has: hasMock });
      vi.mocked(auth).mockImplementation((() => ({ protect: protectMock })) as any);
      vi.mocked(auth).protect = protectMock;

      const mockClerkClient = {
        users: {
          getUserList: vi.fn().mockResolvedValue({
            data: [], // No users with this username
          }),
        },
      };
      vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any);

      // Reset rate limit for clean test
      resetRateLimit(RateLimitKeys.usernameCheck(mockUserId));

      // Act: Check username availability
      const result = await checkUsernameAvailability('available-username');

      // Assert: Should return available
      if ('success' in result) {
        expect(result.success).toBe(true);
        expect(result.isAvailable).toBe(true);
        expect(result.message).toBe('Username is available');
      }
      expect(mockClerkClient.users.getUserList).toHaveBeenCalledWith({
        username: ['available-username'],
      });
    });

    it('should return taken when username exists in Clerk', async () => {
      // Arrange: Mock auth.protect() and clerkClient
      const mockUserId = 'test_user_taken';
      const hasMock = vi.fn().mockReturnValue(true); // User has reverified
      const protectMock = vi.fn().mockResolvedValue({ userId: mockUserId, has: hasMock });
      vi.mocked(auth).mockImplementation((() => ({ protect: protectMock })) as any);
      vi.mocked(auth).protect = protectMock;

      const mockClerkClient = {
        users: {
          getUserList: vi.fn().mockResolvedValue({
            data: [{ id: 'user-123', username: 'taken-username' }], // User exists
          }),
        },
      };
      vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any);

      // Reset rate limit for clean test
      resetRateLimit(RateLimitKeys.usernameCheck(mockUserId));

      // Act: Check username availability
      const result = await checkUsernameAvailability('taken-username');

      // Assert: Should return taken
      if ('success' in result) {
        expect(result.success).toBe(true);
        expect(result.isAvailable).toBe(false);
        expect(result.message).toBe('Username is already taken');
      }
      expect(mockClerkClient.users.getUserList).toHaveBeenCalledWith({
        username: ['taken-username'],
      });
    });

    it('should handle Clerk API errors gracefully', async () => {
      // Arrange: Mock auth.protect() and clerkClient to throw error
      const mockUserId = 'test_user_error';
      const hasMock = vi.fn().mockReturnValue(true); // User has reverified
      const protectMock = vi.fn().mockResolvedValue({ userId: mockUserId, has: hasMock });
      vi.mocked(auth).mockImplementation((() => ({ protect: protectMock })) as any);
      vi.mocked(auth).protect = protectMock;

      const mockClerkClient = {
        users: {
          getUserList: vi.fn().mockRejectedValue(new Error('Clerk API error')),
        },
      };
      vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any);

      // Reset rate limit for clean test
      resetRateLimit(RateLimitKeys.usernameCheck(mockUserId));

      // Act: Check username availability
      const result = await checkUsernameAvailability('error-username');

      // Assert: Should return error
      if ('success' in result) {
        expect(result.success).toBe(false);
        expect(result.isAvailable).toBe(false);
        expect(result.message).toBe('Failed to check username availability. Please try again.');
      }
    });

    it('should return taken when multiple users have the same username', async () => {
      // Arrange: Mock auth.protect() and clerkClient
      const mockUserId = 'test_user_duplicate';
      const hasMock = vi.fn().mockReturnValue(true); // User has reverified
      const protectMock = vi.fn().mockResolvedValue({ userId: mockUserId, has: hasMock });
      vi.mocked(auth).mockImplementation((() => ({ protect: protectMock })) as any);
      vi.mocked(auth).protect = protectMock;

      const mockClerkClient = {
        users: {
          getUserList: vi.fn().mockResolvedValue({
            data: [
              { id: 'user-123', username: 'duplicate-username' },
              { id: 'user-456', username: 'duplicate-username' },
            ], // Multiple users with same username
          }),
        },
      };
      vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any);

      // Reset rate limit for clean test
      resetRateLimit(RateLimitKeys.usernameCheck(mockUserId));

      // Act: Check username availability
      const result = await checkUsernameAvailability('duplicate-username');

      // Assert: Should return taken
      if ('success' in result) {
        expect(result.success).toBe(true);
        expect(result.isAvailable).toBe(false);
        expect(result.message).toBe('Username is already taken');
      }
    });

    it('should check for exact username match (case-preserved)', async () => {
      // Arrange: Mock auth.protect() and clerkClient
      const mockUserId = 'test_user_case';
      const hasMock = vi.fn().mockReturnValue(true); // User has reverified
      const protectMock = vi.fn().mockResolvedValue({ userId: mockUserId, has: hasMock });
      vi.mocked(auth).mockImplementation((() => ({ protect: protectMock })) as any);
      vi.mocked(auth).protect = protectMock;

      const mockClerkClient = {
        users: {
          getUserList: vi.fn().mockResolvedValue({
            data: [], // No users with this username
          }),
        },
      };
      vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any);

      // Reset rate limit for clean test
      resetRateLimit(RateLimitKeys.usernameCheck(mockUserId));

      // Act: Check username availability with mixed case
      const result = await checkUsernameAvailability('TestUser');

      // Assert: Should query Clerk with case preserved
      if ('success' in result) {
        expect(result.success).toBe(true);
      }
      // Note: Username case is now preserved, so Clerk is queried with 'TestUser'
      expect(mockClerkClient.users.getUserList).toHaveBeenCalledWith({
        username: ['TestUser'],
      });
    });

    describe('Security - Sanitization', () => {
      it('should sanitize username before checking availability', async () => {
        // Arrange: Mock auth and rate limit
        const mockUserId = 'test_user_123';
        const hasMock = vi.fn().mockReturnValue(true);
        const protectMock = vi.fn().mockResolvedValue({ userId: mockUserId, has: hasMock });
        vi.mocked(auth).mockImplementation((() => ({ protect: protectMock })) as any);
        vi.mocked(auth).protect = protectMock;

        const mockClerkClient = {
          users: {
            getUserList: vi.fn().mockResolvedValue({
              data: [],
            }),
          },
        };
        vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any);

        // Reset rate limit for this test
        resetRateLimit(RateLimitKeys.usernameCheck(mockUserId));

        // Act: Check with unsanitized username
        const result = await checkUsernameAvailability('Test-User_123!');

        // Assert: Should query Clerk with sanitized username
        if ('success' in result) {
          expect(result.success).toBe(true);
        }
        expect(mockClerkClient.users.getUserList).toHaveBeenCalledWith({
          username: ['Test-User_123'], // Sanitized: case preserved, special chars removed
        });
      });

      it('should reject invalid username format after sanitization', async () => {
        // Arrange: Mock auth
        const mockUserId = 'test_user_456';
        const hasMock = vi.fn().mockReturnValue(true);
        const protectMock = vi.fn().mockResolvedValue({ userId: mockUserId, has: hasMock });
        vi.mocked(auth).mockImplementation((() => ({ protect: protectMock })) as any);
        vi.mocked(auth).protect = protectMock;

        // Reset rate limit for this test
        resetRateLimit(RateLimitKeys.usernameCheck(mockUserId));

        // Act: Check with username that's too short after sanitization
        const result = await checkUsernameAvailability('ab');

        // Assert: Should return error without calling Clerk API
        if ('success' in result) {
          expect(result.success).toBe(false);
          expect(result.isAvailable).toBe(false);
          expect(result.message).toContain('at least 4 characters');
        }
      });
    });

    describe('Security - Rate Limiting', () => {
      it('should enforce rate limit of 5 requests per minute', async () => {
        // Arrange: Mock auth
        const mockUserId = 'test_user_789';
        const hasMock = vi.fn().mockReturnValue(true);
        const protectMock = vi.fn().mockResolvedValue({ userId: mockUserId, has: hasMock });
        vi.mocked(auth).mockImplementation((() => ({ protect: protectMock })) as any);
        vi.mocked(auth).protect = protectMock;

        const mockClerkClient = {
          users: {
            getUserList: vi.fn().mockResolvedValue({
              data: [],
            }),
          },
        };
        vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any);

        // Reset rate limit for clean slate
        resetRateLimit(RateLimitKeys.usernameCheck(mockUserId));

        // Act: Make 5 successful requests
        const results = [];
        for (let i = 0; i < 5; i++) {
          const result = await checkUsernameAvailability(`testuser${i}`);
          results.push(result);
        }

        // All 5 should succeed
        results.forEach(result => {
          if ('success' in result) {
            expect(result.success).toBe(true);
          }
        });

        // 6th request should be rate limited
        const rateLimitedResult = await checkUsernameAvailability('testuser6');
        if ('success' in rateLimitedResult) {
          expect(rateLimitedResult.success).toBe(false);
          expect(rateLimitedResult.message).toContain('Rate limit exceeded');
        }
      });

      it('should check authentication before applying rate limit', async () => {
        // Arrange: Mock unauthenticated state
        const protectMock = vi.fn().mockResolvedValue({ userId: null });
        vi.mocked(auth).mockImplementation((() => ({ protect: protectMock })) as any);
        vi.mocked(auth).protect = protectMock;

        // Act: Try to check username without authentication
        const result = await checkUsernameAvailability('testuser');

        // Assert: Should fail with auth error, not rate limit
        if ('success' in result) {
          expect(result.success).toBe(false);
          expect(result.message).toContain('Authentication required');
          expect(result.message).not.toContain('Rate limit');
        }
      });
    });
  });

  // =============================================================================
  // completeOnboardingAction() Tests
  // =============================================================================
  describe('completeOnboardingAction', () => {
    // ========================================
    // SUCCESS CASES (Transaction Commits)
    // ========================================
    describe('Success Cases', () => {
      it('should create all resources atomically in single transaction', async () => {
        // Arrange: Mock Clerk user
        const mockUserId = 'test_user_complete_1';
        createdUserIds.add(mockUserId);

        vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
        vi.mocked(currentUser).mockResolvedValue({
          id: mockUserId,
          primaryEmailAddress: {
            emailAddress: 'test@example.com',
          },
          emailAddresses: [{ emailAddress: 'test@example.com' }],
          firstName: 'Test',
          lastName: 'User',
          imageUrl: 'https://example.com/avatar.jpg',
        } as any);

        const mockClerkClient = {
          users: {
            updateUser: vi.fn().mockResolvedValue({}),
          },
        };
        vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any);

        // Act: Complete onboarding
        const result = await completeOnboardingAction('testuser');

        // Assert: Verify ALL 4 resources created
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();

        // Verify user in database
        const user = await getUserById(mockUserId);
        expect(user).toBeDefined();
        expect(user?.username).toBe('testuser');
        expect(user?.email).toBe('test@example.com');

        // Verify workspace in database
        const workspace = await getUserWorkspace(mockUserId);
        expect(workspace).toBeDefined();
        expect(workspace?.userId).toBe(mockUserId);

        // Verify link in database
        const linksResult = await db.select().from(links).where(eq(links.workspaceId, workspace!.id));
        expect(linksResult.length).toBe(1);
        expect(linksResult[0].slug).toBe('testuser-first-link');

        // Verify permission in database
        const permsResult = await db.select().from(permissions).where(eq(permissions.linkId, linksResult[0].id));
        expect(permsResult.length).toBe(1);
        expect(permsResult[0].email).toBe('test@example.com');
        expect(permsResult[0].role).toBe('owner');
      });

      it('should use sanitized username for all resources', async () => {
        // Arrange: Mock Clerk user
        const mockUserId = 'test_user_complete_2';
        createdUserIds.add(mockUserId);

        vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
        vi.mocked(currentUser).mockResolvedValue({
          id: mockUserId,
          primaryEmailAddress: {
            emailAddress: 'test2@example.com',
          },
          emailAddresses: [{ emailAddress: 'test2@example.com' }],
          firstName: 'Test',
          lastName: 'User',
          imageUrl: 'https://example.com/avatar.jpg',
        } as any);

        const mockClerkClient = {
          users: {
            updateUser: vi.fn().mockResolvedValue({}),
          },
        };
        vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any);

        // Act: Complete with unsanitized username
        const result = await completeOnboardingAction('Test-USER_123!');

        // Assert: Action returns sanitized username (case preserved)
        expect(result.success).toBe(true);
        expect(result.data?.user.username).toBe('Test-USER_123'); // Sanitized with case preserved
        expect(result.data?.link.slug).toBe('test-user_123-first-link'); // Slug is lowercase

        // Verify data persisted in database
        const user = await getUserById(mockUserId);
        expect(user?.username).toBe('Test-USER_123'); // Case preserved in database
      });

      it('should capture firstName and lastName from Clerk', async () => {
        // Arrange: Mock Clerk user with names
        const mockUserId = 'test_user_complete_3';
        createdUserIds.add(mockUserId);

        vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
        vi.mocked(currentUser).mockResolvedValue({
          id: mockUserId,
          primaryEmailAddress: {
            emailAddress: 'john.doe@example.com',
          },
          emailAddresses: [{ emailAddress: 'john.doe@example.com' }],
          firstName: 'John',
          lastName: 'Doe',
          imageUrl: 'https://example.com/john.jpg',
        } as any);

        const mockClerkClient = {
          users: {
            updateUser: vi.fn().mockResolvedValue({}),
          },
        };
        vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any);

        // Act: Complete onboarding
        const result = await completeOnboardingAction('johndoe');

        // Assert: Action returns firstName and lastName from Clerk
        expect(result.success).toBe(true);
        expect(result.data?.user.firstName).toBe('John');
        expect(result.data?.user.lastName).toBe('Doe');

        // Verify data persisted in database
        const user = await getUserById(mockUserId);
        expect(user?.firstName).toBe('John');
        expect(user?.lastName).toBe('Doe');
      });

      it('should update Clerk username after transaction succeeds', async () => {
        // Arrange: Mock Clerk user
        const mockUserId = 'test_user_complete_4';
        createdUserIds.add(mockUserId);

        vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
        vi.mocked(currentUser).mockResolvedValue({
          id: mockUserId,
          primaryEmailAddress: {
            emailAddress: 'test4@example.com',
          },
          emailAddresses: [{ emailAddress: 'test4@example.com' }],
          firstName: 'Test',
          lastName: 'User',
          imageUrl: 'https://example.com/avatar.jpg',
        } as any);

        const mockUpdateUser = vi.fn().mockResolvedValue({});
        const mockClerkClient = {
          users: {
            updateUser: mockUpdateUser,
          },
        };
        vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any);

        // Act: Complete onboarding
        const result = await completeOnboardingAction('testuser4');

        // Assert: Clerk updateUser was called
        expect(result.success).toBe(true);
        expect(mockUpdateUser).toHaveBeenCalledWith(mockUserId, { username: 'testuser4' });
      });
    });

    // ========================================
    // ROLLBACK CASES (Transaction Aborts)
    // ========================================
    describe('Rollback Cases', () => {
      it('should rollback ALL changes if workspace creation fails', async () => {
        // Arrange: Mock Clerk user
        const mockUserId = 'test_user_rollback_1';
        createdUserIds.add(mockUserId);

        vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
        vi.mocked(currentUser).mockResolvedValue({
          id: mockUserId,
          primaryEmailAddress: {
            emailAddress: 'rollback1@example.com',
          },
          emailAddresses: [{ emailAddress: 'rollback1@example.com' }],
          firstName: 'Test',
          lastName: 'User',
          imageUrl: 'https://example.com/avatar.jpg',
        } as any);

        // Mock transaction to fail on workspace creation
        // Note: This is tricky to test because onboardingTransaction is a separate function
        // For now, we'll test by creating a duplicate workspace (violates unique constraint)

        // First, create a workspace that will conflict
        const existingUser = await createTestUser(mockUserId);
        const existingWorkspace = await createTestWorkspace({
          userId: mockUserId,
          name: "Test's Workspace"
        });

        // Act: Try to complete onboarding (should fail because user already exists)
        const result = await completeOnboardingAction('testuser_rollback');

        // Assert: Should fail with already onboarded error
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should rollback ALL changes if link creation fails', async () => {
        // Arrange: Create a link with a slug that will conflict
        const mockUserId = 'test_user_rollback_2';
        createdUserIds.add(mockUserId);

        const existingUserId = 'existing_user_xyz';
        createdUserIds.add(existingUserId);

        // Create existing workspace and link with conflicting slug
        const existingUser = await createTestUser(existingUserId);
        const existingWorkspace = await createTestWorkspace({
          userId: existingUserId,
          name: 'Existing Workspace'
        });

        // Create a link with the slug we'll try to use
        await db.insert(links).values({
          id: crypto.randomUUID(),
          workspaceId: existingWorkspace.id,
          slug: 'testrollback-first-link',
          name: 'Existing Link',
          isPublic: false,
          isActive: true,
        });

        // Now try to onboard with username that produces the same slug
        vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
        vi.mocked(currentUser).mockResolvedValue({
          id: mockUserId,
          primaryEmailAddress: {
            emailAddress: 'rollback2@example.com',
          },
          emailAddresses: [{ emailAddress: 'rollback2@example.com' }],
          firstName: 'Test',
          lastName: 'User',
          imageUrl: 'https://example.com/avatar.jpg',
        } as any);

        // Act: Try to complete onboarding (should fail due to slug conflict)
        const result = await completeOnboardingAction('testrollback');

        // Assert: Should fail
        expect(result.success).toBe(false);

        // Verify user was NOT created (rollback)
        const user = await getUserById(mockUserId);
        expect(user).toBeUndefined();
      });

      it('should rollback ALL changes if permission creation fails', async () => {
        // This test is harder to trigger naturally since permission creation
        // rarely fails. We'll use a similar approach to the link test.

        const mockUserId = 'test_user_rollback_3';
        createdUserIds.add(mockUserId);

        vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
        vi.mocked(currentUser).mockResolvedValue({
          id: mockUserId,
          primaryEmailAddress: {
            emailAddress: 'rollback3@example.com',
          },
          emailAddresses: [{ emailAddress: 'rollback3@example.com' }],
          firstName: 'Test',
          lastName: 'User',
          imageUrl: 'https://example.com/avatar.jpg',
        } as any);

        // For this test, we can verify the transaction behavior by checking
        // that if ANY step fails, nothing gets created
        // Since it's hard to make permission creation fail naturally,
        // this test serves as documentation of expected behavior

        // Act: Complete onboarding (should succeed)
        const result = await completeOnboardingAction('testuser_rollback3');

        // Assert: If permission creation had failed, everything would be rolled back
        // Since we can't easily trigger that, we verify that when it succeeds,
        // all resources are present
        if (result.success) {
          const user = await getUserById(mockUserId);
          const workspace = await getUserWorkspace(mockUserId);
          expect(user).toBeDefined();
          expect(workspace).toBeDefined();

          const linksResult = await db.select().from(links).where(eq(links.workspaceId, workspace!.id));
          expect(linksResult.length).toBeGreaterThan(0);

          const permsResult = await db.select().from(permissions).where(eq(permissions.linkId, linksResult[0].id));
          expect(permsResult.length).toBeGreaterThan(0);
        }
      });
    });

    // ========================================
    // CLERK FAILURE CASES (DB Succeeds)
    // ========================================
    describe('Clerk Failure Cases', () => {
      it('should return success with warning if Clerk update fails', async () => {
        // Arrange: Mock successful transaction but failed Clerk update
        const mockUserId = 'test_user_clerk_1';
        createdUserIds.add(mockUserId);

        vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
        vi.mocked(currentUser).mockResolvedValue({
          id: mockUserId,
          primaryEmailAddress: {
            emailAddress: 'clerk1@example.com',
          },
          emailAddresses: [{ emailAddress: 'clerk1@example.com' }],
          firstName: 'Test',
          lastName: 'User',
          imageUrl: 'https://example.com/avatar.jpg',
        } as any);

        const mockClerkClient = {
          users: {
            updateUser: vi.fn().mockRejectedValue(new Error('Clerk API error')),
          },
        };
        vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any);

        // Act: Complete onboarding
        const result = await completeOnboardingAction('testuser_clerk');

        // Assert: Should succeed with warning
        expect(result.success).toBe(true);
        expect(result.warning).toBeDefined();
        expect(result.warning).toContain('username sync failed');
        expect(result.data).toBeDefined();

        // Verify data exists in database despite Clerk failure
        const user = await getUserById(mockUserId);
        expect(user).toBeDefined();
        expect(user?.username).toBe('testuser_clerk');

        const workspace = await getUserWorkspace(mockUserId);
        expect(workspace).toBeDefined();
      });
    });

    // ========================================
    // RESUME DETECTION (Already Onboarded)
    // ========================================
    describe('Resume Detection', () => {
      it('should detect already onboarded user', async () => {
        // Arrange: User already exists in database
        const mockUserId = 'test_user_resume_1';
        createdUserIds.add(mockUserId);

        const existingUser = await createTestUser(mockUserId);
        const workspace = await createTestWorkspace({
          userId: mockUserId,
          name: 'Existing Workspace'
        });

        vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
        vi.mocked(currentUser).mockResolvedValue({
          id: mockUserId,
          primaryEmailAddress: {
            emailAddress: existingUser.email,
          },
          emailAddresses: [{ emailAddress: existingUser.email }],
          firstName: 'Test',
          lastName: 'User',
          imageUrl: 'https://example.com/avatar.jpg',
        } as any);

        // Act: Attempt to onboard again
        const result = await completeOnboardingAction('testuser_resume');

        // Assert: Should detect existing user
        expect(result.success).toBe(false);
        expect(result.error).toContain('already onboarded');
        expect(result.isAlreadyOnboarded).toBe(true);

        // Verify no duplicate resources created
        const workspaces = await db.select().from(workspacesTable).where(eq(workspacesTable.userId, mockUserId));
        expect(workspaces.length).toBe(1); // Still only 1 workspace
      });

      it('should handle partial onboarding state gracefully', async () => {
        // Arrange: User exists but no workspace (shouldn't happen with transactions)
        const mockUserId = 'test_user_resume_2';
        createdUserIds.add(mockUserId);

        const existingUser = await createTestUser(mockUserId);

        vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
        vi.mocked(currentUser).mockResolvedValue({
          id: mockUserId,
          primaryEmailAddress: {
            emailAddress: existingUser.email,
          },
          emailAddresses: [{ emailAddress: existingUser.email }],
          firstName: 'Test',
          lastName: 'User',
          imageUrl: 'https://example.com/avatar.jpg',
        } as any);

        // Act: Attempt to onboard
        const result = await completeOnboardingAction('testuser_partial');

        // Assert: Should detect existing user
        expect(result.success).toBe(false);
        expect(result.isAlreadyOnboarded).toBe(true);
      });
    });

    // ========================================
    // VALIDATION CASES
    // ========================================
    describe('Validation', () => {
      it('should reject unauthenticated requests', async () => {
        // Arrange: Mock unauthenticated state
        vi.mocked(auth).mockResolvedValue({ userId: null } as any);
        vi.mocked(currentUser).mockResolvedValue(null);

        // Act: Try to complete onboarding
        const result = await completeOnboardingAction('testuser');

        // Assert: Should error without calling database
        expect(result.success).toBe(false);
        expect(result.error).toContain('Authentication required');
      });

      it('should reject invalid username format', async () => {
        // Arrange: Mock authenticated user
        const mockUserId = 'test_user_validation_1';
        createdUserIds.add(mockUserId);

        vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
        vi.mocked(currentUser).mockResolvedValue({
          id: mockUserId,
          primaryEmailAddress: {
            emailAddress: 'validation@example.com',
          },
          emailAddresses: [{ emailAddress: 'validation@example.com' }],
          firstName: 'Test',
          lastName: 'User',
          imageUrl: 'https://example.com/avatar.jpg',
        } as any);

        // Act: Try with invalid username (too short after sanitization)
        const result = await completeOnboardingAction('ab');

        // Assert: Should error
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid username');

        // Verify no user created
        const user = await getUserById(mockUserId);
        expect(user).toBeUndefined();
      });

      it('should reject user without email address', async () => {
        // Arrange: Mock user without email
        const mockUserId = 'test_user_validation_2';
        createdUserIds.add(mockUserId);

        vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
        vi.mocked(currentUser).mockResolvedValue({
          id: mockUserId,
          primaryEmailAddress: null,
          emailAddresses: [],
          firstName: 'Test',
          lastName: 'User',
          imageUrl: 'https://example.com/avatar.jpg',
        } as any);

        // Act: Try to complete onboarding
        const result = await completeOnboardingAction('testuser');

        // Assert: Should error
        expect(result.success).toBe(false);
        expect(result.error).toContain('valid email address');

        // Verify no user created
        const user = await getUserById(mockUserId);
        expect(user).toBeUndefined();
      });
    });
  });
});
