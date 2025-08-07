import { useState, useEffect, useCallback } from 'react';
import { checkUsernameAvailabilityAction } from '../lib/actions/onboarding-actions';

interface UseUsernameValidationOptions {
  enabled?: boolean;
  debounceMs?: number;
}

interface ValidationState {
  isAvailable: boolean;
  isUnavailable: boolean;
  isChecking: boolean;
  message: string | null;
}

const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const MIN_LENGTH = 4;
const MAX_LENGTH = 30;

export function useUsernameValidation(
  username: string,
  options: UseUsernameValidationOptions = {}
) {
  const { enabled = true, debounceMs = 500 } = options;

  const [validation, setValidation] = useState<ValidationState>({
    isAvailable: false,
    isUnavailable: false,
    isChecking: false,
    message: null,
  });

  // Client-side validation
  const validateFormat = useCallback((value: string): { isValid: boolean; error?: string } => {
    if (!value) {
      return { isValid: false, error: 'Username is required' };
    }

    if (value.length < MIN_LENGTH) {
      return { isValid: false, error: `Username must be at least ${MIN_LENGTH} characters` };
    }

    if (value.length > MAX_LENGTH) {
      return { isValid: false, error: `Username must be less than ${MAX_LENGTH} characters` };
    }

    if (!USERNAME_REGEX.test(value)) {
      return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }

    return { isValid: true };
  }, []);

  // Server-side availability check
  const checkAvailability = useCallback(async (value: string) => {
    const formatValidation = validateFormat(value);
    
    if (!formatValidation.isValid) {
      setValidation({
        isAvailable: false,
        isUnavailable: true,
        isChecking: false,
        message: formatValidation.error || null,
      });
      return;
    }

    setValidation(prev => ({ ...prev, isChecking: true }));

    try {
      const result = await checkUsernameAvailabilityAction(value);
      
      if (result.success && result.data) {
        setValidation({
          isAvailable: result.data.available,
          isUnavailable: !result.data.available,
          isChecking: false,
          message: result.data.message || (!result.data.available ? 'This username is already taken' : null),
        });
      } else {
        setValidation({
          isAvailable: false,
          isUnavailable: false,
          isChecking: false,
          message: result.error || 'Unable to check username availability',
        });
      }
    } catch (error) {
      setValidation({
        isAvailable: false,
        isUnavailable: false,
        isChecking: false,
        message: 'Unable to check username availability',
      });
    }
  }, [validateFormat]);

  // Debounced effect
  useEffect(() => {
    if (!enabled || !username) {
      setValidation({
        isAvailable: false,
        isUnavailable: false,
        isChecking: false,
        message: null,
      });
      return;
    }

    // Show checking state immediately for better UX
    setValidation(prev => ({ ...prev, isChecking: true }));

    // Debounce the validation
    const timeoutId = setTimeout(() => {
      checkAvailability(username);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [username, enabled, checkAvailability, debounceMs]);

  return validation;
}