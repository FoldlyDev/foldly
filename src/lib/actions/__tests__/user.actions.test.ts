// =============================================================================
// USER ACTIONS TESTS
// =============================================================================
// Tests for user server actions with authentication checks

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createUserAction,
  updateUserProfileAction,
  getUserAction,
} from '../user.actions';
import {
  createTestUser,
  cleanupTestUser,
  testData,
} from '@/test/db-test-utils';

// Mock Clerk authentication
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

import { auth, currentUser } from '@clerk/nextjs/server';

describe('User Actions', () => {
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

  describe('createUserAction', () => {
    it('should return error when user is not authenticated (userId null)', async () => {
      // Arrange: Mock unauthenticated state
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);
      vi.mocked(currentUser).mockResolvedValue(null);

      // Act: Attempt to create user
      const result = await createUserAction('testuser');

      // Assert: Should return unauthorized error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized - user not authenticated');
      }
    });

    it('should return error when Clerk user is null', async () => {
      // Arrange: Mock authenticated state but null currentUser
      const userId = testData.generateUserId(); createdUserIds.add(userId);
      vi.mocked(auth).mockResolvedValue({ userId } as any);
      vi.mocked(currentUser).mockResolvedValue(null);

      // Act: Attempt to create user
      const result = await createUserAction('testuser');

      // Assert: Should return unauthorized error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized - user not authenticated');
      }
    });

    it('should return error when user has no email addresses', async () => {
      // Arrange: Mock authenticated user with no email
      const userId = testData.generateUserId(); createdUserIds.add(userId);
      vi.mocked(auth).mockResolvedValue({ userId } as any);
      vi.mocked(currentUser).mockResolvedValue({
        id: userId,
        primaryEmailAddress: null,
        emailAddresses: [], // No email addresses
        firstName: 'Test',
        lastName: 'User',
        imageUrl: 'https://example.com/avatar.jpg',
      } as any);

      // Act: Attempt to create user
      const result = await createUserAction('testuser');

      // Assert: Should return email required error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('User must have a valid email address');
      }
    });

    it('should return error when user already exists in database', async () => {
      // Arrange: Create test user first
      const user = await createTestUser();
      createdUserIds.add(user.id);

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      vi.mocked(currentUser).mockResolvedValue({
        id: user.id,
        primaryEmailAddress: { emailAddress: user.email },
        emailAddresses: [{ emailAddress: user.email }],
        firstName: 'Test',
        lastName: 'User',
        imageUrl: 'https://example.com/avatar.jpg',
      } as any);

      // Act: Attempt to create user again
      const result = await createUserAction('testuser');

      // Assert: Should return user already exists error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('User already exists in database');
      }
    });

    it('should successfully create user with primary email', async () => {
      // Arrange: Mock authenticated user
      const userId = testData.generateUserId(); createdUserIds.add(userId);
      const primaryEmail = `test_${userId}@example.com`;
      const username = `testuser_${Date.now()}`;

      vi.mocked(auth).mockResolvedValue({ userId } as any);
      vi.mocked(currentUser).mockResolvedValue({
        id: userId,
        primaryEmailAddress: { emailAddress: primaryEmail },
        emailAddresses: [{ emailAddress: primaryEmail }],
        firstName: 'Test',
        lastName: 'User',
        imageUrl: 'https://example.com/avatar.jpg',
      } as any);

      // Act: Create user
      const result = await createUserAction(username);

      // Assert: User should be created successfully
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toBeDefined();
        expect(result.user.id).toBe(userId);
        expect(result.user.email).toBe(primaryEmail);
        expect(result.user.username).toBe(username);
        expect(result.user.firstName).toBe('Test');
        expect(result.user.lastName).toBe('User');
        expect(result.user.avatarUrl).toBe('https://example.com/avatar.jpg');
      }
    });

    it('should successfully create user using fallback email when primary is null', async () => {
      // Arrange: Mock authenticated user with no primary email
      const userId = testData.generateUserId(); createdUserIds.add(userId);
      const fallbackEmail = `fallback_${userId}@example.com`;
      const username = `testuser_${Date.now()}`;

      vi.mocked(auth).mockResolvedValue({ userId } as any);
      vi.mocked(currentUser).mockResolvedValue({
        id: userId,
        primaryEmailAddress: null, // No primary email
        emailAddresses: [{ emailAddress: fallbackEmail }],
        firstName: 'Test',
        lastName: 'User',
        imageUrl: 'https://example.com/avatar.jpg',
      } as any);

      // Act: Create user
      const result = await createUserAction(username);

      // Assert: User should be created with fallback email
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toBeDefined();
        expect(result.user.email).toBe(fallbackEmail);
      }
    });

    it('should successfully create user with null optional fields', async () => {
      // Arrange: Mock authenticated user with null optional fields
      const userId = testData.generateUserId(); createdUserIds.add(userId);
      const email = `test_${userId}@example.com`;
      const username = `testuser_${Date.now()}`;

      vi.mocked(auth).mockResolvedValue({ userId } as any);
      vi.mocked(currentUser).mockResolvedValue({
        id: userId,
        primaryEmailAddress: { emailAddress: email },
        emailAddresses: [{ emailAddress: email }],
        firstName: null, // Null optional field
        lastName: null, // Null optional field
        imageUrl: null, // Null optional field
      } as any);

      // Act: Create user
      const result = await createUserAction(username);

      // Assert: User should be created with null fields
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toBeDefined();
        expect(result.user.firstName).toBeNull();
        expect(result.user.lastName).toBeNull();
        expect(result.user.avatarUrl).toBeNull();
      }
    });
  });

  describe('updateUserProfileAction', () => {
    it('should return error when user is not authenticated', async () => {
      // Arrange: Mock unauthenticated state
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      // Act: Attempt to update user profile
      const result = await updateUserProfileAction({
        username: 'newusername',
      });

      // Assert: Should return unauthorized error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized');
      }
    });

    it('should return error when user does not exist in database', async () => {
      // Arrange: Mock authenticated user that doesn't exist in database
      const userId = testData.generateUserId(); createdUserIds.add(userId);
      vi.mocked(auth).mockResolvedValue({ userId } as any);

      // Act: Attempt to update non-existent user
      const result = await updateUserProfileAction({
        username: 'newusername',
      });

      // Assert: Should return user not found error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('User not found in database');
      }
    });

    it('should successfully update username', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      const newUsername = `updated_${Date.now()}`;

      // Act: Update username
      const result = await updateUserProfileAction({
        username: newUsername,
      });

      // Assert: Username should be updated
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toBeDefined();
        expect(result.user.id).toBe(user.id);
        expect(result.user.username).toBe(newUsername);
        expect(result.user.email).toBe(user.email); // Unchanged
      }
    });

    it('should successfully update firstName', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Act: Update firstName
      const result = await updateUserProfileAction({
        firstName: 'UpdatedFirst',
      });

      // Assert: firstName should be updated
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toBeDefined();
        expect(result.user.firstName).toBe('UpdatedFirst');
        expect(result.user.username).toBe(user.username); // Unchanged
      }
    });

    it('should successfully update lastName', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Act: Update lastName
      const result = await updateUserProfileAction({
        lastName: 'UpdatedLast',
      });

      // Assert: lastName should be updated
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toBeDefined();
        expect(result.user.lastName).toBe('UpdatedLast');
      }
    });

    it('should successfully update avatarUrl', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      const newAvatarUrl = 'https://example.com/new-avatar.jpg';

      // Act: Update avatarUrl
      const result = await updateUserProfileAction({
        avatarUrl: newAvatarUrl,
      });

      // Assert: avatarUrl should be updated
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toBeDefined();
        expect(result.user.avatarUrl).toBe(newAvatarUrl);
      }
    });

    it('should successfully update multiple fields at once', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      const updates = {
        username: `multupdate_${Date.now()}`,
        firstName: 'Multi',
        lastName: 'Update',
        avatarUrl: 'https://example.com/multi-avatar.jpg',
      };

      // Act: Update multiple fields
      const result = await updateUserProfileAction(updates);

      // Assert: All fields should be updated
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toBeDefined();
        expect(result.user.username).toBe(updates.username);
        expect(result.user.firstName).toBe(updates.firstName);
        expect(result.user.lastName).toBe(updates.lastName);
        expect(result.user.avatarUrl).toBe(updates.avatarUrl);
      }
    });

    it('should successfully set fields to null', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Act: Update fields to null
      const result = await updateUserProfileAction({
        firstName: null,
        lastName: null,
        avatarUrl: null,
      });

      // Assert: Fields should be set to null
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toBeDefined();
        expect(result.user.firstName).toBeNull();
        expect(result.user.lastName).toBeNull();
        expect(result.user.avatarUrl).toBeNull();
      }
    });

    it('should successfully update with empty object (no changes)', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Act: Update with no fields
      const result = await updateUserProfileAction({});

      // Assert: Should succeed with no changes
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toBeDefined();
        expect(result.user.username).toBe(user.username);
        expect(result.user.email).toBe(user.email);
      }
    });
  });

  describe('getUserAction', () => {
    it('should return null when user is not authenticated', async () => {
      // Arrange: Mock unauthenticated state
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      // Act: Get user
      const result = await getUserAction();

      // Assert: Should return null
      expect(result).toBeNull();
    });

    it('should return null when authenticated user does not exist in database', async () => {
      // Arrange: Mock authenticated user that doesn't exist in database
      const userId = testData.generateUserId(); createdUserIds.add(userId);
      vi.mocked(auth).mockResolvedValue({ userId } as any);

      // Act: Get user
      const result = await getUserAction();

      // Assert: Should return null
      expect(result).toBeNull();
    });

    it('should return user when authenticated user exists in database', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Act: Get user
      const result = await getUserAction();

      // Assert: Should return user
      expect(result).toBeDefined();
      expect(result?.id).toBe(user.id);
      expect(result?.email).toBe(user.email);
      expect(result?.username).toBe(user.username);
    });

    it('should return user with all fields populated', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Act: Get user
      const result = await getUserAction();

      // Assert: Should return user with all fields
      expect(result).toBeDefined();
      expect(result?.id).toBe(user.id);
      expect(result?.email).toBe(user.email);
      expect(result?.username).toBe(user.username);
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
      expect(result?.isActive).toBe(true);
      expect(result?.storageUsed).toBe(0);
      expect(result?.deletedAt).toBeNull();
    });

    it('should return user consistently on multiple calls', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Act: Get user multiple times
      const result1 = await getUserAction();
      const result2 = await getUserAction();

      // Assert: Should return same user data
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1?.id).toBe(result2?.id);
      expect(result1?.email).toBe(result2?.email);
      expect(result1?.username).toBe(result2?.username);
    });
  });
});
