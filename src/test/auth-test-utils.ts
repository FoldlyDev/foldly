// =============================================================================
// AUTH TEST UTILITIES
// =============================================================================
// Shared helpers for mocking Clerk authentication in tests

import { vi } from 'vitest';

/**
 * Mock Clerk auth() function
 */
export function mockClerkAuth(options: {
  userId?: string | null;
  sessionId?: string | null;
} = {}) {
  const { userId = null, sessionId = null } = options;

  return vi.fn().mockResolvedValue({
    userId,
    sessionId,
    orgId: null,
    orgRole: null,
    orgSlug: null,
    sessionClaims: userId ? { sub: userId } : null,
    has: vi.fn(() => false),
  });
}

/**
 * Mock Clerk currentUser() function
 */
export function mockClerkCurrentUser(options: {
  userId?: string;
  email?: string;
  username?: string;
} = {}) {
  const {
    userId = 'test_user_123',
    email = 'test@example.com',
    username = 'testuser',
  } = options;

  return vi.fn().mockResolvedValue({
    id: userId,
    emailAddresses: [{ emailAddress: email }],
    username,
    firstName: 'Test',
    lastName: 'User',
    imageUrl: 'https://example.com/avatar.jpg',
  });
}

/**
 * Mock unauthenticated Clerk auth
 */
export function mockUnauthenticatedClerkAuth() {
  return mockClerkAuth({ userId: null, sessionId: null });
}

/**
 * Mock authenticated Clerk auth with user ID
 */
export function mockAuthenticatedClerkAuth(userId: string) {
  return mockClerkAuth({ userId, sessionId: 'test_session_123' });
}

/**
 * Setup Clerk mocks for server actions tests
 * Returns cleanup function to restore original modules
 */
export function setupClerkMocks(options: {
  authenticated?: boolean;
  userId?: string;
  email?: string;
  username?: string;
} = {}) {
  const {
    authenticated = true,
    userId = 'test_user_123',
    email = 'test@example.com',
    username = 'testuser',
  } = options;

  // Mock auth
  const authMock = authenticated
    ? mockAuthenticatedClerkAuth(userId)
    : mockUnauthenticatedClerkAuth();

  // Mock currentUser
  const currentUserMock = authenticated
    ? mockClerkCurrentUser({ userId, email, username })
    : vi.fn().mockResolvedValue(null);

  return {
    auth: authMock,
    currentUser: currentUserMock,
  };
}
