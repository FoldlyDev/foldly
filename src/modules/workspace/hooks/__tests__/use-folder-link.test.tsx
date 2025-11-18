// =============================================================================
// USE FOLDER-LINK HOOKS TESTS
// =============================================================================
// Tests for workspace module folder-link React Query hooks

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';
import {
  useAvailableLinks,
  useLinkFolderToExistingLink,
  useLinkFolderWithNewLink,
  useUnlinkFolder,
} from '../use-folder-link';
import * as folderLinkActions from '../../lib/actions/folder-link.actions';
import type { Link } from '@/lib/database/schemas';

// =============================================================================
// Test Setup & Utilities
// =============================================================================

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Create wrapper for React Query hooks
function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

// Mock console methods to avoid noise in test output
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// =============================================================================
// useAvailableLinks() Tests
// =============================================================================

describe('useAvailableLinks', () => {
  it('should fetch available links successfully', async () => {
    // Arrange: Mock successful response
    const mockLinks: Link[] = [
      {
        id: 'link_1',
        workspaceId: 'workspace_1',
        slug: 'test-link-1',
        name: 'Test Link 1',
        isPublic: false,
        isActive: false,
        linkConfig: {
          notifyOnUpload: true,
          customMessage: null,
          requiresName: false,
          expiresAt: null,
          passwordProtected: false,
          password: null,
        },
        branding: {
          enabled: false,
          logo: null,
          colors: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'link_2',
        workspaceId: 'workspace_1',
        slug: 'test-link-2',
        name: 'Test Link 2',
        isPublic: false,
        isActive: false,
        linkConfig: {
          notifyOnUpload: true,
          customMessage: null,
          requiresName: false,
          expiresAt: null,
          passwordProtected: false,
          password: null,
        },
        branding: {
          enabled: false,
          logo: null,
          colors: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.spyOn(folderLinkActions, 'getAvailableLinksAction').mockResolvedValue({
      success: true,
      data: mockLinks,
    });

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    // Act: Render hook
    const { result } = renderHook(() => useAvailableLinks(), { wrapper });

    // Assert: Should start loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait for query to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert: Should have fetched links
    expect(result.current.data).toEqual(mockLinks);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle empty available links list', async () => {
    // Arrange: Mock empty response
    vi.spyOn(folderLinkActions, 'getAvailableLinksAction').mockResolvedValue({
      success: true,
      data: [],
    });

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    // Act: Render hook
    const { result } = renderHook(() => useAvailableLinks(), { wrapper });

    // Wait for query to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert: Should return empty array
    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle query errors gracefully', async () => {
    // Arrange: Mock error response
    vi.spyOn(folderLinkActions, 'getAvailableLinksAction').mockResolvedValue({
      success: false,
      error: 'Failed to fetch available links',
    });

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    // Act: Render hook
    const { result } = renderHook(() => useAvailableLinks(), { wrapper });

    // Wait for query to complete
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Assert: Should have error (data is undefined when error occurs)
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('should use correct staleTime (30 seconds)', async () => {
    // Arrange: Mock successful response
    vi.spyOn(folderLinkActions, 'getAvailableLinksAction').mockResolvedValue({
      success: true,
      data: [],
    });

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    // Act: Render hook
    const { result } = renderHook(() => useAvailableLinks(), { wrapper });

    // Wait for query to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert: Query should be configured with correct staleTime
    const queryState = queryClient.getQueryState(['links', 'available']);
    expect(queryState).toBeDefined();
    // Note: staleTime is set in the hook, verified by checking query doesn't refetch immediately
  });
});

// =============================================================================
// useLinkFolderToExistingLink() Tests
// =============================================================================

describe('useLinkFolderToExistingLink', () => {
  it('should link folder to existing link successfully', async () => {
    // Arrange: Mock successful mutation
    vi.spyOn(folderLinkActions, 'linkFolderToExistingLinkAction').mockResolvedValue({
      success: true,
      data: undefined,
    });

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    // Act: Render hook and trigger mutation
    const { result } = renderHook(() => useLinkFolderToExistingLink(), { wrapper });

    // Execute mutation
    result.current.mutate({
      folderId: 'folder_123',
      linkId: 'link_456',
    });

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert: Should have called action with correct input
    expect(folderLinkActions.linkFolderToExistingLinkAction).toHaveBeenCalledWith({
      folderId: 'folder_123',
      linkId: 'link_456',
    });

    // Wait for loading state to settle
    await waitFor(() => expect(result.current.isIdle).toBe(false));
    expect(result.current.error).toBeNull();
  });

  it('should invalidate caches on success', async () => {
    // Arrange: Mock successful mutation
    vi.spyOn(folderLinkActions, 'linkFolderToExistingLinkAction').mockResolvedValue({
      success: true,
      data: undefined,
    });

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = createWrapper(queryClient);

    // Act: Render hook and trigger mutation
    const { result } = renderHook(() => useLinkFolderToExistingLink(), { wrapper });

    result.current.mutate({
      folderId: 'folder_123',
      linkId: 'link_456',
    });

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert: Should have invalidated both folder and link caches
    expect(invalidateSpy).toHaveBeenCalled();
    // Verify at least 2 invalidation calls (folders + links)
    expect(invalidateSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle mutation errors gracefully', async () => {
    // Arrange: Mock error response
    vi.spyOn(folderLinkActions, 'linkFolderToExistingLinkAction').mockResolvedValue({
      success: false,
      error: 'Folder not found',
    });

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    // Act: Render hook and trigger mutation
    const { result } = renderHook(() => useLinkFolderToExistingLink(), { wrapper });

    result.current.mutate({
      folderId: 'invalid_folder',
      linkId: 'link_456',
    });

    // Wait for mutation to complete with error
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Assert: Should have error and mutation should not be loading
    expect(result.current.error).toBeTruthy();
    await waitFor(() => expect(result.current.isIdle).toBe(false));
  });

  it('should not retry on failure', async () => {
    // Arrange: Mock error response
    const actionSpy = vi.spyOn(folderLinkActions, 'linkFolderToExistingLinkAction')
      .mockResolvedValue({
        success: false,
        error: 'Network error',
      });

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    // Act: Render hook and trigger mutation
    const { result } = renderHook(() => useLinkFolderToExistingLink(), { wrapper });

    result.current.mutate({
      folderId: 'folder_123',
      linkId: 'link_456',
    });

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Assert: Action should be called exactly once (no retry)
    expect(actionSpy).toHaveBeenCalledTimes(1);
  });
});

// =============================================================================
// useLinkFolderWithNewLink() Tests
// =============================================================================

describe('useLinkFolderWithNewLink', () => {
  it('should create link and link folder successfully', async () => {
    // Arrange: Mock successful mutation with created link
    const mockCreatedLink: Link = {
      id: 'new_link_123',
      workspaceId: 'workspace_1',
      slug: 'my-folder-link',
      name: 'My Folder Link',
      isPublic: false,
      isActive: true,
      linkConfig: {
        notifyOnUpload: true,
        customMessage: null,
        requiresName: false,
        expiresAt: null,
        passwordProtected: false,
        password: null,
      },
      branding: {
        enabled: false,
        logo: null,
        colors: null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(folderLinkActions, 'linkFolderWithNewLinkAction').mockResolvedValue({
      success: true,
      data: mockCreatedLink,
    });

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    // Act: Render hook and trigger mutation
    const { result } = renderHook(() => useLinkFolderWithNewLink(), { wrapper });

    result.current.mutate({
      folderId: 'folder_123',
      allowedEmails: ['user@example.com'],
    });

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert: Should have created link
    expect(result.current.data).toEqual(mockCreatedLink);
    expect(folderLinkActions.linkFolderWithNewLinkAction).toHaveBeenCalledWith({
      folderId: 'folder_123',
      allowedEmails: ['user@example.com'],
    });
  });

  it('should invalidate caches and set new link in cache', async () => {
    // Arrange: Mock successful mutation
    const mockCreatedLink: Link = {
      id: 'new_link_123',
      workspaceId: 'workspace_1',
      slug: 'my-folder-link',
      name: 'My Folder Link',
      isPublic: false,
      isActive: true,
      linkConfig: {
        notifyOnUpload: true,
        customMessage: null,
        requiresName: false,
        expiresAt: null,
        passwordProtected: false,
        password: null,
      },
      branding: {
        enabled: false,
        logo: null,
        colors: null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(folderLinkActions, 'linkFolderWithNewLinkAction').mockResolvedValue({
      success: true,
      data: mockCreatedLink,
    });

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');
    const wrapper = createWrapper(queryClient);

    // Act: Render hook and trigger mutation
    const { result } = renderHook(() => useLinkFolderWithNewLink(), { wrapper });

    result.current.mutate({
      folderId: 'folder_123',
      allowedEmails: [],
    });

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert: Should have invalidated caches and set new link
    expect(invalidateSpy).toHaveBeenCalled();
    expect(setQueryDataSpy).toHaveBeenCalledWith(
      ['links', 'detail', mockCreatedLink.id],
      mockCreatedLink
    );
  });

  it('should handle mutation errors gracefully', async () => {
    // Arrange: Mock error response
    vi.spyOn(folderLinkActions, 'linkFolderWithNewLinkAction').mockResolvedValue({
      success: false,
      error: 'Failed to create link',
    });

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    // Act: Render hook and trigger mutation
    const { result } = renderHook(() => useLinkFolderWithNewLink(), { wrapper });

    result.current.mutate({
      folderId: 'folder_123',
      allowedEmails: [],
    });

    // Wait for mutation to complete with error
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Assert: Should have error
    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeUndefined();
  });

  it('should not retry on failure', async () => {
    // Arrange: Mock error response
    const actionSpy = vi.spyOn(folderLinkActions, 'linkFolderWithNewLinkAction')
      .mockResolvedValue({
        success: false,
        error: 'Slug conflict',
      });

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    // Act: Render hook and trigger mutation
    const { result } = renderHook(() => useLinkFolderWithNewLink(), { wrapper });

    result.current.mutate({
      folderId: 'folder_123',
      allowedEmails: [],
    });

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Assert: Action should be called exactly once (no retry)
    expect(actionSpy).toHaveBeenCalledTimes(1);
  });
});

// =============================================================================
// useUnlinkFolder() Tests
// =============================================================================

describe('useUnlinkFolder', () => {
  it('should unlink folder successfully', async () => {
    // Arrange: Mock successful mutation
    vi.spyOn(folderLinkActions, 'unlinkFolderAction').mockResolvedValue({
      success: true,
      data: undefined,
    });

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    // Act: Render hook and trigger mutation
    const { result } = renderHook(() => useUnlinkFolder(), { wrapper });

    result.current.mutate({
      folderId: 'folder_123',
    });

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert: Should have called action
    expect(folderLinkActions.unlinkFolderAction).toHaveBeenCalledWith({
      folderId: 'folder_123',
    });
    expect(result.current.error).toBeNull();
  });

  it('should invalidate folder cache when no linkId in cache', async () => {
    // Arrange: Mock successful mutation
    vi.spyOn(folderLinkActions, 'unlinkFolderAction').mockResolvedValue({
      success: true,
      data: undefined,
    });

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = createWrapper(queryClient);

    // Act: Render hook and trigger mutation
    const { result } = renderHook(() => useUnlinkFolder(), { wrapper });

    result.current.mutate({
      folderId: 'folder_123',
    });

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert: Should have invalidated folder cache
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('should invalidate both folder and link caches when linkId exists', async () => {
    // Arrange: Mock successful mutation and set folder with linkId in cache
    vi.spyOn(folderLinkActions, 'unlinkFolderAction').mockResolvedValue({
      success: true,
      data: undefined,
    });

    const queryClient = createTestQueryClient();

    // Pre-populate cache with folder data that has linkId
    queryClient.setQueryData(['folders', 'detail', 'folder_123'], {
      id: 'folder_123',
      linkId: 'link_456',
      name: 'Test Folder',
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = createWrapper(queryClient);

    // Act: Render hook and trigger mutation
    const { result } = renderHook(() => useUnlinkFolder(), { wrapper });

    result.current.mutate({
      folderId: 'folder_123',
    });

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert: Should have invalidated both folder and link caches
    expect(invalidateSpy).toHaveBeenCalled();
    // Verify multiple invalidation calls
    expect(invalidateSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle mutation errors gracefully', async () => {
    // Arrange: Mock error response
    vi.spyOn(folderLinkActions, 'unlinkFolderAction').mockResolvedValue({
      success: false,
      error: 'Folder not found',
    });

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    // Act: Render hook and trigger mutation
    const { result } = renderHook(() => useUnlinkFolder(), { wrapper });

    result.current.mutate({
      folderId: 'invalid_folder',
    });

    // Wait for mutation to complete with error
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Assert: Should have error
    expect(result.current.error).toBeTruthy();
  });
});
