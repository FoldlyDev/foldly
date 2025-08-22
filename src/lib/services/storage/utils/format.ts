/**
 * Storage formatting utilities
 * Shared utilities for formatting storage-related data
 */

/**
 * Format bytes to human-readable format
 * @param bytes - Number of bytes to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with appropriate unit (Bytes, KB, MB, GB, TB)
 * @example
 * formatBytes(1024) // "1 KB"
 * formatBytes(1234567) // "1.18 MB"
 * formatBytes(0) // "0 Bytes"
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Convert gigabytes to bytes
 * @param gigabytes - Number of gigabytes
 * @returns Number of bytes
 */
export function gbToBytes(gigabytes: number): number {
  return gigabytes * 1024 * 1024 * 1024;
}

/**
 * Convert bytes to gigabytes
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Number of gigabytes
 */
export function bytesToGb(bytes: number, decimals: number = 2): number {
  const gb = bytes / (1024 * 1024 * 1024);
  return parseFloat(gb.toFixed(decimals));
}

/**
 * Format storage percentage
 * @param used - Bytes used
 * @param total - Total bytes available
 * @returns Percentage string with % symbol
 */
export function formatStoragePercentage(used: number, total: number): string {
  if (total === 0) return '0%';
  const percentage = (used / total) * 100;
  return `${Math.min(100, percentage).toFixed(1)}%`;
}

/**
 * Get human-readable time remaining based on upload speed
 * @param remainingBytes - Bytes remaining to upload
 * @param bytesPerSecond - Current upload speed
 * @returns Human-readable time string
 */
export function formatTimeRemaining(remainingBytes: number, bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return 'calculating...';
  
  const secondsRemaining = remainingBytes / bytesPerSecond;
  
  if (secondsRemaining < 60) {
    return `${Math.ceil(secondsRemaining)}s`;
  } else if (secondsRemaining < 3600) {
    const minutes = Math.ceil(secondsRemaining / 60);
    return `${minutes}m`;
  } else {
    const hours = Math.floor(secondsRemaining / 3600);
    const minutes = Math.ceil((secondsRemaining % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}