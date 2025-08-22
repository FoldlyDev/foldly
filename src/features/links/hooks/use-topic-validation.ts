import { useState, useEffect, useCallback } from 'react';
import {
  checkTopicAvailabilityAction,
  type TopicAvailabilityResult,
} from '../lib/actions';
import { validateTopicName } from '../lib/utils';

export interface TopicValidationState {
  isChecking: boolean;
  result: TopicAvailabilityResult | null;
  error: string | null;
}

export interface UseTopicValidationOptions {
  debounceMs?: number;
  excludeId?: string; // For editing existing links
  enabled?: boolean; // Allow disabling validation
  userId?: string; // Required for checking topic uniqueness within user's links
  slug?: string; // Required for checking topic uniqueness within user's slug
}

/**
 * Hook for real-time topic availability validation with debouncing
 * Validates topic uniqueness within a user's slug context
 */
export function useTopicValidation(
  topic: string,
  options: UseTopicValidationOptions = {}
) {
  const { debounceMs = 500, excludeId, enabled = true, userId, slug } = options;

  const [state, setState] = useState<TopicValidationState>({
    isChecking: false,
    result: null,
    error: null,
  });

  // Debounced validation function
  const validateTopic = useCallback(
    async (topicToValidate: string) => {
      if (!topicToValidate || !enabled || !userId || !slug) {
        setState({
          isChecking: false,
          result: null,
          error: null,
        });
        return;
      }

      // Basic format validation
      const topicValidation = validateTopicName(topicToValidate);
      if (!topicValidation.isValid) {
        setState({
          isChecking: false,
          result: {
            available: false,
            topic: topicToValidate,
            message: topicValidation.error || 'Invalid topic format',
          },
          error: null,
        });
        return;
      }

      setState(prev => ({
        ...prev,
        isChecking: true,
        error: null,
      }));

      try {
        const result = await checkTopicAvailabilityAction({
          topic: topicToValidate,
          userId,
          slug,
          ...(excludeId && { excludeId }),
        });

        if (result.success && result.data) {
          setState({
            isChecking: false,
            result: result.data,
            error: null,
          });
        } else {
          setState({
            isChecking: false,
            result: null,
            error: result.error || 'Failed to check topic availability',
          });
        }
      } catch (error) {
        console.error('Topic validation error:', error);
        setState({
          isChecking: false,
          result: null,
          error: 'Network error while checking topic availability',
        });
      }
    },
    [excludeId, enabled, userId, slug]
  );

  // Debounced effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateTopic(topic);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [topic, validateTopic, debounceMs]);

  // Reset state when topic becomes empty
  useEffect(() => {
    if (!topic) {
      setState({
        isChecking: false,
        result: null,
        error: null,
      });
    }
  }, [topic]);

  return {
    ...state,
    // Helper computed properties
    isAvailable: state.result?.available === true,
    isUnavailable: state.result?.available === false,
    message: state.result?.message || state.error,
    hasResult: state.result !== null || state.error !== null,
  };
}
