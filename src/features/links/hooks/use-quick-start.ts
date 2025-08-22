import { useUser } from '@clerk/nextjs';
import { useCreateLinkMutation } from './react-query/use-create-link-mutation';
import { normalizeSlug } from '../lib/utils/slug-normalization';
import { DEFAULT_BASE_LINK_TITLE } from '../lib/constants/base-link-defaults';
import { useEventBus, NotificationEventType } from '@/features/notifications/hooks/use-event-bus';

interface UseQuickStartOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

/**
 * Hook for quick start functionality - creates a base link with sensible defaults
 * and transitions user to topic creation flow
 */
export function useQuickStart(options: UseQuickStartOptions = {}) {
  const { user } = useUser();
  const createLinkMutation = useCreateLinkMutation();
  const { emit } = useEventBus();

  const quickStart = async () => {
    console.log('🚀 QUICK START: Starting quick start process');
    console.log('🚀 QUICK START: User object:', user);

    if (!user?.username) {
      console.error('🚀 QUICK START: Username not available');
      emit(NotificationEventType.SYSTEM_ERROR_PERMISSION, {
        message: 'Username not available. Please complete your profile to create links.',
        severity: 'error',
      });
      options.onError?.(new Error('Username not available'));
      return;
    }

    console.log('🚀 QUICK START: Username available:', user.username);

    try {
      // Note: Loading state is handled by the UI, no need for loading toast

      // Create base link with sensible defaults - matching manual creation exactly
      const quickStartData = {
        // Required fields matching manual creation
        title: DEFAULT_BASE_LINK_TITLE, // Use centralized default

        // Optional fields with exact same structure as manual creation
        slug: normalizeSlug(user.username), // Normalize username for consistent slug handling
        topic: undefined, // undefined for base links
        description: 'Upload your files here', // Use consistent description
        requireEmail: false,
        requirePassword: false,
        password: undefined, // undefined when no password required
        isActive: true,
        maxFiles: 100,
        maxFileSize: 5, // 5MB (Supabase deployment limit, server action will convert to bytes)
        allowedFileTypes: undefined, // undefined instead of empty array
        expiresAt: undefined, // undefined for no expiration
        brandEnabled: false,
        brandColor: undefined, // undefined when branding disabled
      };

      console.log('🚀 QUICK START: Mutation data being sent:', quickStartData);
      console.log('🚀 QUICK START: Data types:', {
        slug: typeof quickStartData.slug,
        title: typeof quickStartData.title,
        topic: typeof quickStartData.topic,
        description: typeof quickStartData.description,
        requireEmail: typeof quickStartData.requireEmail,
        requirePassword: typeof quickStartData.requirePassword,
        isActive: typeof quickStartData.isActive,
        maxFiles: typeof quickStartData.maxFiles,
        maxFileSize: typeof quickStartData.maxFileSize,
        allowedFileTypes: typeof quickStartData.allowedFileTypes,
        brandEnabled: typeof quickStartData.brandEnabled,
      });

      console.log('🚀 QUICK START: About to call mutateAsync...');
      const result = await createLinkMutation.mutateAsync(quickStartData);
      console.log('🚀 QUICK START: Mutation successful! Result:', result);

      // Success event is now emitted by the mutation hook itself
      // Call success callback (for refreshing dashboard, etc.)
      options.onSuccess?.();
    } catch (error) {
      console.error('🚀 QUICK START: Error caught:', error);
      console.error('🚀 QUICK START: Error type:', typeof error);
      
      // Type-safe error handling
      if (error instanceof Error) {
        console.error(
          '🚀 QUICK START: Error constructor:',
          error.constructor.name
        );
        console.error('🚀 QUICK START: Error message:', error.message);
        console.error('🚀 QUICK START: Error stack:', error.stack);
      } else if (error && typeof error === 'object') {
        console.error(
          '🚀 QUICK START: Error object properties:',
          Object.keys(error)
        );
        console.error(
          '🚀 QUICK START: Full error object:',
          JSON.stringify(error, null, 2)
        );
      }

      // Error is already emitted by the mutation hook
      // No need to emit another error event here
      options.onError?.(error);
    }
  };

  return {
    quickStart,
    isLoading: createLinkMutation.isPending,
    isError: createLinkMutation.isError,
    error: createLinkMutation.error,
    // Expose user data for UI purposes (normalized)
    username: user?.username ? normalizeSlug(user.username) : undefined,
    isReady: !!user?.username,
  };
}
