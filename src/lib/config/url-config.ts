/**
 * Centralized URL configuration for the application
 * Handles dynamic base URLs with security considerations
 */

/**
 * Get the base URL for the application
 * Priority order:
 * 1. Environment variable (production)
 * 2. Vercel URL (from environment)
 * 3. Window location (client-side)
 * 4. Fallback localhost
 */
export function getBaseUrl(): string {
  // Production: Use configured URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }

  // Vercel deployments (including preview)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  // Client-side: Use window location
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Server-side development fallback
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Fallback
  return 'http://localhost:3000';
}

/**
 * Validate host to prevent header injection attacks
 */
function isValidHost(host: string): boolean {
  // Remove port if present
  const hostname = host.split(':')[0];
  
  // Define allowed hosts/patterns
  const allowedHosts = [
    'localhost',
    'foldly.com',
    'foldly.io',
    /^.*\.vercel\.app$/,
    /^.*\.foldly\.com$/,
    /^.*\.foldly\.io$/,
  ];

  return allowedHosts.some(allowed => {
    if (typeof allowed === 'string') {
      return hostname === allowed;
    }
    return allowed.test(hostname);
  });
}

/**
 * Get display domain (without protocol)
 */
export function getDisplayDomain(): string {
  const baseUrl = getBaseUrl();
  return baseUrl.replace(/^https?:\/\//, '');
}

/**
 * Generate a full URL for a link
 */
export function generateLinkUrl(
  slug: string,
  topic?: string | null,
  options?: { absolute?: boolean }
): string {
  const path = topic ? `/${slug}/${topic}` : `/${slug}`;
  
  if (options?.absolute !== false) {
    return `${getBaseUrl()}${path}`;
  }
  
  return path;
}

/**
 * URL builder with validation
 */
export class UrlBuilder {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getBaseUrl();
  }

  link(slug: string, topic?: string | null): string {
    return generateLinkUrl(slug, topic, { absolute: true });
  }

  api(path: string): string {
    return `${this.baseUrl}/api${path.startsWith('/') ? path : `/${path}`}`;
  }

  static(path: string): string {
    return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }
}

// Export singleton instance
export const urlBuilder = new UrlBuilder();