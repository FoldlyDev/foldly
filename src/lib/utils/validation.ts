// Username validation constants
export const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;
export const MIN_USERNAME_LENGTH = 4;
export const MAX_USERNAME_LENGTH = 30;

/**
 * Validates if a string is a valid email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates if a password meets minimum requirements
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Normalize username to lowercase and validate format
 * @param username - Raw username input
 * @returns Normalized username or null if invalid
 */
export function normalizeUsername(username: string): string | null {
  if (!username) return null;
  
  // Remove spaces and special characters
  const normalized = username
    .trim()
    .replace(/\s/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toLowerCase();
  
  // Validate length
  if (normalized.length < MIN_USERNAME_LENGTH || normalized.length > MAX_USERNAME_LENGTH) {
    return null;
  }
  
  // Validate format
  if (!USERNAME_REGEX.test(normalized)) {
    return null;
  }
  
  return normalized;
}

/**
 * Validates if a string is a valid username
 * @returns Validation result with detailed error message
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username) {
    return { isValid: false, error: 'Username is required' };
  }

  if (username.length < MIN_USERNAME_LENGTH) {
    return { isValid: false, error: `Username must be at least ${MIN_USERNAME_LENGTH} characters` };
  }

  if (username.length > MAX_USERNAME_LENGTH) {
    return { isValid: false, error: `Username must be less than ${MAX_USERNAME_LENGTH} characters` };
  }

  if (!USERNAME_REGEX.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  return { isValid: true };
}

/**
 * Sanitize input to prevent XSS attacks
 * @param input - Raw input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/[<>"'&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '&': '&amp;',
      };
      return entities[char] || char;
    })
    .trim();
}

/**
 * Generate a CSRF token
 * @returns CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token
 * @param token - Token to validate
 * @param expectedToken - Expected token value
 * @returns True if valid
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) return false;
  return token === expectedToken;
}