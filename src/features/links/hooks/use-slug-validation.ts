import { useState, useEffect, useCallback } from 'react';
import { checkSlugAvailabilityAction, type SlugAvailabilityResult } from '../lib/actions';
import { normalizeSlug, isValidNormalizedSlug } from '../lib/utils/slug-normalization';

export interface SlugValidationState {
  isChecking: boolean;
  result: SlugAvailabilityResult | null;
  error: string | null;
}

export interface UseSlugValidationOptions {
  debounceMs?: number;
  excludeId?: string; // For editing existing links
  enabled?: boolean; // Allow disabling validation
}

/**
 * Hook for real-time slug availability validation with debouncing
 * Similar to Calendly's username validation pattern
 */
export function useSlugValidation(
  slug: string,
  options: UseSlugValidationOptions = {}
) {
  const { debounceMs = 1000, excludeId, enabled = true } = options;
  
  const [state, setState] = useState<SlugValidationState>({
    isChecking: false,
    result: null,
    error: null,
  });

  // Debounced validation function
  const validateSlug = useCallback(
    async (slugToValidate: string) => {
      if (!slugToValidate || !enabled) {
        setState({
          isChecking: false,
          result: null,
          error: null,
        });
        return;
      }

      // Normalize the slug to lowercase for consistent validation
      const normalizedSlug = normalizeSlug(slugToValidate);

      // Basic format validation on normalized slug
      if (!isValidNormalizedSlug(normalizedSlug)) {
        setState({
          isChecking: false,
          result: {
            available: false,
            slug: normalizedSlug, // Return normalized version
            message: 'Slug can only contain letters, numbers, hyphens, and underscores',
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
        const result = await checkSlugAvailabilityAction({
          slug: normalizedSlug, // Send normalized slug to server
          excludeId,
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
            error: result.error || 'Failed to check slug availability',
          });
        }
      } catch (error) {
        console.error('Slug validation error:', error);
        setState({
          isChecking: false,
          result: null,
          error: 'Network error while checking slug availability',
        });
      }
    },
    [excludeId, enabled]
  );

  // Debounced effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateSlug(slug);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [slug, validateSlug, debounceMs]);

  // Reset state when slug becomes empty
  useEffect(() => {
    if (!slug) {
      setState({
        isChecking: false,
        result: null,
        error: null,
      });
    }
  }, [slug]);

  return {
    ...state,
    // Helper computed properties
    isAvailable: state.result?.available === true,
    isUnavailable: state.result?.available === false,
    message: state.result?.message || state.error,
    hasResult: state.result !== null || state.error !== null,
  };
}