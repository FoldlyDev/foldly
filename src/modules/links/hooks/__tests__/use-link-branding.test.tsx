// =============================================================================
// USE LINK BRANDING HOOKS TESTS
// =============================================================================
// Tests for links module branding React Query hooks

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';
import {
  useUpdateLinkBranding,
  useDeleteBrandingLogo,
} from '../use-link-branding';
import * as brandingActions from '../../lib/actions/branding.actions';

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
// useUpdateLinkBranding() Tests
// =============================================================================

describe('useUpdateLinkBranding', () => {
  it('should update branding successfully', async () => {
    // Arrange: Mock successful mutation
    vi.spyOn(brandingActions, 'updateLinkBrandingAction').mockResolvedValue({
      success: true,
      data: undefined,
    });

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    // Act: Render hook and trigger mutation
    const { result } = renderHook(() => useUpdateLinkBranding(), { wrapper });

    result.current.mutate({
      linkId: 'link_123',
      branding: {
        enabled: true,
        colors: {
          accentColor: '#FF5733',
          backgroundColor: '#FFFFFF',
        },
      },
    });

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert: Should have called action with correct input
    expect(brandingActions.updateLinkBrandingAction).toHaveBeenCalledWith({
      linkId: 'link_123',
      branding: {
        enabled: true,
        colors: {
          accentColor: '#FF5733',
          backgroundColor: '#FFFFFF',
        },
      },
    });
  });

  it('should invalidate caches on success', async () => {
    // Arrange: Mock successful mutation
    vi.spyOn(brandingActions, 'updateLinkBrandingAction').mockResolvedValue({
      success: true,
      data: undefined,
    });

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = createWrapper(queryClient);

    // Act: Render hook and trigger mutation
    const { result } = renderHook(() => useUpdateLinkBranding(), { wrapper });

    result.current.mutate({
      linkId: 'link_456',
      branding: {
        enabled: false,
      },
    });

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert: Should have invalidated both link detail and list caches
    expect(invalidateSpy).toHaveBeenCalled();
    expect(invalidateSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle mutation errors gracefully', async () => {
    // Arrange: Mock error response
    vi.spyOn(brandingActions, 'updateLinkBrandingAction').mockResolvedValue({
      success: false,
      error: 'Invalid branding configuration',
    });

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    // Act: Render hook and trigger mutation
    const { result } = renderHook(() => useUpdateLinkBranding(), { wrapper });

    result.current.mutate({
      linkId: 'invalid_link',
      branding: {
        enabled: true,
      },
    });

    // Wait for mutation to complete with error
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Assert: Should have error
    expect(result.current.error).toBeTruthy();
    await waitFor(() => expect(result.current.isIdle).toBe(false));
  });

  it('should not retry on failure', async () => {
    // Arrange: Mock error response
    const actionSpy = vi.spyOn(brandingActions, 'updateLinkBrandingAction')
      .mockResolvedValue({
        success: false,
        error: 'Network error',
      });

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    // Act: Render hook and trigger mutation
    const { result } = renderHook(() => useUpdateLinkBranding(), { wrapper });

    result.current.mutate({
      linkId: 'link_123',
      branding: {
        enabled: true,
      },
    });

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Assert: Action should be called exactly once (no retry)
    expect(actionSpy).toHaveBeenCalledTimes(1);
  });
});

// =============================================================================
// useDeleteBrandingLogo() Tests
// =============================================================================

describe('useDeleteBrandingLogo', () => {
  it('should delete logo successfully', async () => {
    // Arrange: Mock successful mutation
    vi.spyOn(brandingActions, 'deleteBrandingLogoAction').mockResolvedValue({
      success: true,
      data: undefined,
    });

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    // Act: Render hook and trigger mutation
    const { result } = renderHook(() => useDeleteBrandingLogo(), { wrapper });

    result.current.mutate({
      linkId: 'link_123',
    });

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert: Should have called action with correct input
    expect(brandingActions.deleteBrandingLogoAction).toHaveBeenCalledWith({
      linkId: 'link_123',
    });
  });

  it('should invalidate caches on success', async () => {
    // Arrange: Mock successful mutation
    vi.spyOn(brandingActions, 'deleteBrandingLogoAction').mockResolvedValue({
      success: true,
      data: undefined,
    });

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = createWrapper(queryClient);

    // Act: Render hook and trigger mutation
    const { result } = renderHook(() => useDeleteBrandingLogo(), { wrapper });

    result.current.mutate({
      linkId: 'link_456',
    });

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert: Should have invalidated both link detail and list caches
    expect(invalidateSpy).toHaveBeenCalled();
    expect(invalidateSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle mutation errors gracefully', async () => {
    // Arrange: Mock error response
    vi.spyOn(brandingActions, 'deleteBrandingLogoAction').mockResolvedValue({
      success: false,
      error: 'Logo not found',
    });

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    // Act: Render hook and trigger mutation
    const { result } = renderHook(() => useDeleteBrandingLogo(), { wrapper });

    result.current.mutate({
      linkId: 'invalid_link',
    });

    // Wait for mutation to complete with error
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Assert: Should have error
    expect(result.current.error).toBeTruthy();
  });

  it('should not retry on failure', async () => {
    // Arrange: Mock error response
    const actionSpy = vi.spyOn(brandingActions, 'deleteBrandingLogoAction')
      .mockResolvedValue({
        success: false,
        error: 'Network error',
      });

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    // Act: Render hook and trigger mutation
    const { result } = renderHook(() => useDeleteBrandingLogo(), { wrapper });

    result.current.mutate({
      linkId: 'link_123',
    });

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Assert: Action should be called exactly once (no retry)
    expect(actionSpy).toHaveBeenCalledTimes(1);
  });
});
