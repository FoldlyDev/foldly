/**
 * Validates topic name format
 */
export function validateTopicName(topic: string): {
  isValid: boolean;
  error?: string;
} {
  if (!topic) {
    return { isValid: false, error: 'Topic is required' };
  }

  if (topic.length > 50) {
    return { isValid: false, error: 'Topic must be less than 50 characters' };
  }

  // Allow alphanumeric, hyphens, and underscores
  const validFormat = /^[a-zA-Z0-9_-]+$/.test(topic);
  if (!validFormat) {
    return {
      isValid: false,
      error:
        'Topic can only contain letters, numbers, hyphens, and underscores',
    };
  }

  return { isValid: true };
}
