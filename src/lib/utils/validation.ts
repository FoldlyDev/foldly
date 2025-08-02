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
 * Validates if a string is a valid username
 */
export function validateUsername(username: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (username.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (username.trim().length > 100) {
    errors.push('Name must be less than 100 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}