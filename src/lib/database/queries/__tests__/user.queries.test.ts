// =============================================================================
// USER QUERIES TESTS
// =============================================================================
// Tests for user database operations using real database

import { describe, it, expect, afterEach } from 'vitest';
import {
  getUserById,
  getUserByEmail,
  getUserByUsername,
  createUser,
  updateUser,
  updateUserStorage,
  softDeleteUser,
} from '../user.queries';
import {
  createTestUser,
  cleanupTestUser,
  testData,
} from '@/test/db-test-utils';

describe('User Queries', () => {
  let testUserId: string;

  afterEach(async () => {
    // Clean up test data after each test
    if (testUserId) {
      await cleanupTestUser(testUserId);
    }
  });

  describe('getUserById', () => {
    it('should return user when user exists', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      testUserId = user.id;

      // Act: Get user by ID
      const result = await getUserById(testUserId);

      // Assert: User should be found
      expect(result).toBeDefined();
      expect(result?.id).toBe(testUserId);
      expect(result?.email).toBe(user.email);
      expect(result?.username).toBe(user.username);
    });

    it('should return undefined when user does not exist', async () => {
      // Arrange: Use non-existent user ID
      const nonExistentId = testData.generateUserId();

      // Act: Get user by ID
      const result = await getUserById(nonExistentId);

      // Assert: No user should be found
      expect(result).toBeUndefined();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when email exists', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      testUserId = user.id;

      // Act: Get user by email
      const result = await getUserByEmail(user.email);

      // Assert: User should be found
      expect(result).toBeDefined();
      expect(result?.id).toBe(testUserId);
      expect(result?.email).toBe(user.email);
      expect(result?.username).toBe(user.username);
    });

    it('should return undefined when email does not exist', async () => {
      // Arrange: Use non-existent email
      const nonExistentEmail = `nonexistent_${Date.now()}@example.com`;

      // Act: Get user by email
      const result = await getUserByEmail(nonExistentEmail);

      // Assert: No user should be found
      expect(result).toBeUndefined();
    });

    it('should be case-sensitive for email lookup', async () => {
      // Arrange: Create test user with specific email case
      const user = await createTestUser();
      testUserId = user.id;

      // Act: Try to get user with different case
      const result = await getUserByEmail(user.email.toUpperCase());

      // Assert: Should return undefined (case mismatch)
      expect(result).toBeUndefined();
    });
  });

  describe('getUserByUsername', () => {
    it('should return user when username exists', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      testUserId = user.id;

      // Act: Get user by username
      const result = await getUserByUsername(user.username);

      // Assert: User should be found
      expect(result).toBeDefined();
      expect(result?.id).toBe(testUserId);
      expect(result?.email).toBe(user.email);
      expect(result?.username).toBe(user.username);
    });

    it('should return undefined when username does not exist', async () => {
      // Arrange: Use non-existent username
      const nonExistentUsername = `nonexistent_${Date.now()}`;

      // Act: Get user by username
      const result = await getUserByUsername(nonExistentUsername);

      // Assert: No user should be found
      expect(result).toBeUndefined();
    });

    it('should be case-sensitive for username lookup', async () => {
      // Arrange: Create test user with specific username case
      const user = await createTestUser();
      testUserId = user.id;

      // Act: Try to get user with different case
      const result = await getUserByUsername(user.username.toUpperCase());

      // Assert: Should return undefined (case mismatch)
      expect(result).toBeUndefined();
    });
  });

  describe('createUser', () => {
    it('should successfully create user with all fields', async () => {
      // Arrange: Prepare user data
      testUserId = testData.generateUserId();
      const userData = {
        id: testUserId,
        email: `test_${testUserId}@example.com`,
        username: `testuser_${Date.now()}`,
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      // Act: Create user
      const user = await createUser(userData);

      // Assert: User should be created with correct data
      expect(user).toBeDefined();
      expect(user.id).toBe(testUserId);
      expect(user.email).toBe(userData.email);
      expect(user.username).toBe(userData.username);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.avatarUrl).toBe(userData.avatarUrl);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(user.isActive).toBe(true);
      expect(user.storageUsed).toBe(0);
    });

    it('should successfully create user with minimal fields (nullable fields as null)', async () => {
      // Arrange: Prepare minimal user data
      testUserId = testData.generateUserId();
      const userData = {
        id: testUserId,
        email: `test_${testUserId}@example.com`,
        username: `testuser_${Date.now()}`,
        firstName: null,
        lastName: null,
        avatarUrl: null,
      };

      // Act: Create user
      const user = await createUser(userData);

      // Assert: User should be created with null optional fields
      expect(user).toBeDefined();
      expect(user.id).toBe(testUserId);
      expect(user.email).toBe(userData.email);
      expect(user.username).toBe(userData.username);
      expect(user.firstName).toBeNull();
      expect(user.lastName).toBeNull();
      expect(user.avatarUrl).toBeNull();
    });

    it('should throw error when creating user with duplicate email', async () => {
      // Arrange: Create test user with specific email
      const user = await createTestUser();
      testUserId = user.id;

      const duplicateUserId = testData.generateUserId();

      // Act & Assert: Attempt to create user with duplicate email should fail
      // (unique constraint on email)
      await expect(
        createUser({
          id: duplicateUserId,
          email: user.email, // Duplicate email
          username: `different_${Date.now()}`,
        })
      ).rejects.toThrow();
    });

    it('should throw error when creating user with duplicate username', async () => {
      // Arrange: Create test user with specific username
      const user = await createTestUser();
      testUserId = user.id;

      const duplicateUserId = testData.generateUserId();

      // Act & Assert: Attempt to create user with duplicate username should fail
      // (unique constraint on username)
      await expect(
        createUser({
          id: duplicateUserId,
          email: `different_${Date.now()}@example.com`,
          username: user.username, // Duplicate username
        })
      ).rejects.toThrow();
    });

    it('should throw error when creating user with duplicate id', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      testUserId = user.id;

      // Act & Assert: Attempt to create user with duplicate ID should fail
      // (primary key constraint)
      await expect(
        createUser({
          id: testUserId, // Duplicate ID
          email: `different_${Date.now()}@example.com`,
          username: `different_${Date.now()}`,
        })
      ).rejects.toThrow();
    });
  });

  describe('updateUser', () => {
    it('should successfully update username', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      testUserId = user.id;

      const newUsername = `updated_${Date.now()}`;

      // Act: Update username
      const updatedUser = await updateUser(testUserId, {
        username: newUsername,
      });

      // Assert: Username should be updated
      expect(updatedUser).toBeDefined();
      expect(updatedUser.id).toBe(testUserId);
      expect(updatedUser.username).toBe(newUsername);
      expect(updatedUser.email).toBe(user.email); // Unchanged
      expect(updatedUser.updatedAt).toBeInstanceOf(Date);
    });

    it('should successfully update firstName and lastName', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      testUserId = user.id;

      // Act: Update name fields
      const updatedUser = await updateUser(testUserId, {
        firstName: 'Updated',
        lastName: 'Name',
      });

      // Assert: Name fields should be updated
      expect(updatedUser).toBeDefined();
      expect(updatedUser.firstName).toBe('Updated');
      expect(updatedUser.lastName).toBe('Name');
      expect(updatedUser.username).toBe(user.username); // Unchanged
    });

    it('should successfully update avatarUrl', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      testUserId = user.id;

      const newAvatarUrl = 'https://example.com/new-avatar.jpg';

      // Act: Update avatar URL
      const updatedUser = await updateUser(testUserId, {
        avatarUrl: newAvatarUrl,
      });

      // Assert: Avatar URL should be updated
      expect(updatedUser).toBeDefined();
      expect(updatedUser.avatarUrl).toBe(newAvatarUrl);
    });

    it('should successfully update multiple fields at once', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      testUserId = user.id;

      const updates = {
        username: `multupdate_${Date.now()}`,
        firstName: 'Multi',
        lastName: 'Update',
        avatarUrl: 'https://example.com/multi-avatar.jpg',
      };

      // Act: Update multiple fields
      const updatedUser = await updateUser(testUserId, updates);

      // Assert: All fields should be updated
      expect(updatedUser).toBeDefined();
      expect(updatedUser.username).toBe(updates.username);
      expect(updatedUser.firstName).toBe(updates.firstName);
      expect(updatedUser.lastName).toBe(updates.lastName);
      expect(updatedUser.avatarUrl).toBe(updates.avatarUrl);
    });

    it('should successfully set fields to null', async () => {
      // Arrange: Create test user with values
      const user = await createTestUser();
      testUserId = user.id;

      // First update to set values
      await updateUser(testUserId, {
        firstName: 'Initial',
        lastName: 'Values',
      });

      // Act: Update fields to null
      const updatedUser = await updateUser(testUserId, {
        firstName: null,
        lastName: null,
        avatarUrl: null,
      });

      // Assert: Fields should be null
      expect(updatedUser).toBeDefined();
      expect(updatedUser.firstName).toBeNull();
      expect(updatedUser.lastName).toBeNull();
      expect(updatedUser.avatarUrl).toBeNull();
    });

    it('should throw error when updating to duplicate username', async () => {
      // Arrange: Create two test users
      const user1 = await createTestUser();
      testUserId = user1.id;

      const user2 = await createTestUser();

      // Act & Assert: Attempt to update user2 with user1's username should fail
      await expect(
        updateUser(user2.id, {
          username: user1.username, // Duplicate username
        })
      ).rejects.toThrow();

      // Cleanup user2
      await cleanupTestUser(user2.id);
    });

    it('should return undefined when updating non-existent user', async () => {
      // Arrange: Use non-existent user ID
      const nonExistentId = testData.generateUserId();

      // Act: Attempt to update non-existent user
      const result = await updateUser(nonExistentId, {
        username: 'newusername',
      });

      // Assert: Result should be undefined (no rows returned)
      expect(result).toBeUndefined();
    });
  });

  describe('updateUserStorage', () => {
    it('should successfully update storage used', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      testUserId = user.id;

      const newStorageUsed = 1024 * 1024 * 5; // 5 MB

      // Act: Update storage
      await updateUserStorage(testUserId, newStorageUsed);

      // Assert: Storage should be updated
      const updatedUser = await getUserById(testUserId);
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.storageUsed).toBe(newStorageUsed);
      expect(updatedUser?.updatedAt).toBeInstanceOf(Date);
    });

    it('should successfully update storage to zero', async () => {
      // Arrange: Create test user with initial storage
      const user = await createTestUser();
      testUserId = user.id;

      // Set initial storage
      await updateUserStorage(testUserId, 1024 * 1024);

      // Act: Update storage to zero
      await updateUserStorage(testUserId, 0);

      // Assert: Storage should be zero
      const updatedUser = await getUserById(testUserId);
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.storageUsed).toBe(0);
    });

    it('should successfully update storage to large value', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      testUserId = user.id;

      const largeStorageValue = 1024 * 1024 * 1024 * 10; // 10 GB

      // Act: Update storage to large value
      await updateUserStorage(testUserId, largeStorageValue);

      // Assert: Storage should be updated to large value
      const updatedUser = await getUserById(testUserId);
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.storageUsed).toBe(largeStorageValue);
    });

    it('should not throw error when updating storage for non-existent user', async () => {
      // Arrange: Use non-existent user ID
      const nonExistentId = testData.generateUserId();

      // Act & Assert: Should not throw (no rows affected is not an error)
      await expect(
        updateUserStorage(nonExistentId, 1024)
      ).resolves.not.toThrow();
    });
  });

  describe('softDeleteUser', () => {
    it('should successfully soft delete user', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      testUserId = user.id;

      // Act: Soft delete user
      await softDeleteUser(testUserId);

      // Assert: User should be marked as inactive and deletedAt should be set
      const deletedUser = await getUserById(testUserId);
      expect(deletedUser).toBeDefined();
      expect(deletedUser?.isActive).toBe(false);
      expect(deletedUser?.deletedAt).toBeInstanceOf(Date);
      expect(deletedUser?.updatedAt).toBeInstanceOf(Date);
    });

    it('should set deletedAt timestamp to current time', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      testUserId = user.id;

      const beforeDelete = new Date();

      // Act: Soft delete user
      await softDeleteUser(testUserId);

      const afterDelete = new Date();

      // Assert: deletedAt should be between before and after timestamps
      const deletedUser = await getUserById(testUserId);
      expect(deletedUser).toBeDefined();
      expect(deletedUser?.deletedAt).toBeDefined();
      expect(deletedUser?.deletedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeDelete.getTime()
      );
      expect(deletedUser?.deletedAt!.getTime()).toBeLessThanOrEqual(
        afterDelete.getTime()
      );
    });

    it('should successfully soft delete already soft-deleted user', async () => {
      // Arrange: Create test user and soft delete once
      const user = await createTestUser();
      testUserId = user.id;

      await softDeleteUser(testUserId);
      const firstDeletedUser = await getUserById(testUserId);
      expect(firstDeletedUser).toBeDefined();
      expect(firstDeletedUser!.deletedAt).toBeDefined();

      // Act: Soft delete again
      await softDeleteUser(testUserId);

      // Assert: Should update deletedAt timestamp
      const secondDeletedUser = await getUserById(testUserId);
      expect(secondDeletedUser).toBeDefined();
      expect(secondDeletedUser!.isActive).toBe(false);
      expect(secondDeletedUser!.deletedAt).toBeInstanceOf(Date);
      expect(secondDeletedUser!.deletedAt!.getTime()).toBeGreaterThanOrEqual(
        firstDeletedUser!.deletedAt!.getTime()
      );
    });

    it('should not throw error when soft deleting non-existent user', async () => {
      // Arrange: Use non-existent user ID
      const nonExistentId = testData.generateUserId();

      // Act & Assert: Should not throw (no rows affected is not an error)
      await expect(softDeleteUser(nonExistentId)).resolves.not.toThrow();
    });
  });
});
