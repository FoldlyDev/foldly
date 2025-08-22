// =============================================================================
// SIGNED URL EXPIRY UTILITY - Link-Aware Expiry Calculation
// =============================================================================
// 🎯 Calculate appropriate signed URL expiry based on link expiry settings

/**
 * Calculate appropriate signed URL expiry based on link expiry
 * 
 * Logic:
 * - If link has no expiry: NO expiry for signed URL (unlimited)
 * - If link expires: use remaining link time for signed URL
 * - Cap at maximum for security when link expiry is very far in future
 * 
 * @param linkExpiresAt - Link's expiry date (from database)
 * @returns Number of seconds for signed URL expiry, or undefined for no expiry
 */
export function calculateSignedUrlExpiry(linkExpiresAt: Date | null): number | undefined {
  const MAX_EXPIRY = 365 * 24 * 3600; // 1 year maximum for security
  
  if (!linkExpiresAt) {
    // No link expiry set - NO expiry for signed URL
    return undefined;
  }
  
  const now = new Date();
  const linkExpiry = new Date(linkExpiresAt);
  const timeUntilLinkExpiry = Math.floor((linkExpiry.getTime() - now.getTime()) / 1000);
  
  if (timeUntilLinkExpiry <= 0) {
    // Link already expired - this should be caught by validation
    // Return 0 to prevent URL generation
    return 0;
  }
  
  // Use remaining link time, but cap at max expiry for security
  return Math.min(timeUntilLinkExpiry, MAX_EXPIRY);
}

/**
 * Check if a link is expired
 * @param linkExpiresAt - Link's expiry date
 * @returns True if link is expired
 */
export function isLinkExpired(linkExpiresAt: Date | null): boolean {
  if (!linkExpiresAt) {
    return false; // No expiry means never expired
  }
  
  return new Date(linkExpiresAt) < new Date();
}

/**
 * Get human-readable time until link expiry
 * @param linkExpiresAt - Link's expiry date
 * @returns Human-readable string or null if no expiry
 */
export function getTimeUntilExpiry(linkExpiresAt: Date | null): string | null {
  if (!linkExpiresAt) {
    return null; // No expiry
  }
  
  const now = new Date();
  const linkExpiry = new Date(linkExpiresAt);
  const timeDiff = linkExpiry.getTime() - now.getTime();
  
  if (timeDiff <= 0) {
    return 'Expired';
  }
  
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'}`;
  } else if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  } else {
    const minutes = Math.floor(timeDiff / (1000 * 60));
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
}