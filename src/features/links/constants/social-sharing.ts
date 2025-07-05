/**
 * Social Sharing Constants
 * Platform configurations and templates for sharing links
 * Following 2025 best practices with readonly arrays and proper typing
 */

export interface SocialShareConfig {
  readonly name: string;
  readonly baseUrl: string;
  readonly urlParam: string;
  readonly textParam?: string;
  readonly color: string;
  readonly bgColor: string;
}

/**
 * Social sharing platform configurations
 */
export const SOCIAL_SHARE_PLATFORMS: readonly SocialShareConfig[] = [
  {
    name: 'Twitter',
    baseUrl: 'https://twitter.com/intent/tweet',
    urlParam: 'url',
    textParam: 'text',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
  },
  {
    name: 'Facebook',
    baseUrl: 'https://www.facebook.com/sharer/sharer.php',
    urlParam: 'u',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
  },
  {
    name: 'LinkedIn',
    baseUrl: 'https://www.linkedin.com/sharing/share-offsite/',
    urlParam: 'url',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
  },
  {
    name: 'WhatsApp',
    baseUrl: 'https://wa.me/',
    urlParam: 'text',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
  },
] as const;

/**
 * Email sharing configuration
 */
export const EMAIL_SHARE_CONFIG = {
  subject: 'File Collection Link',
  bodyTemplate: (linkName: string, url: string) =>
    `Check out this file collection: ${linkName}\n\n${url}`,
} as const;

/**
 * Share text templates
 */
export const SHARE_TEXT_TEMPLATES = {
  default: (linkName: string) =>
    `Check out this file collection link: ${linkName}`,
  withCTA: (linkName: string) => `📁 Upload your files here: ${linkName}`,
  professional: (linkName: string) =>
    `Please submit your files via this secure link: ${linkName}`,
} as const;

/**
 * Share window configuration
 */
export const SHARE_WINDOW_CONFIG = {
  width: 600,
  height: 400,
  features: 'noopener,noreferrer',
} as const;
