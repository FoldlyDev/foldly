'use client';

import { useMemo } from 'react';
import { getDisplayDomain, generateLinkUrl } from '@/lib/config/url-config';

/**
 * Hook to generate link URLs for display in client components
 */
export function useLinkUrl(slug: string, topic?: string | null) {
  const displayUrl = useMemo(() => {
    const domain = getDisplayDomain();
    return topic ? `${domain}/${slug}/${topic}` : `${domain}/${slug}`;
  }, [slug, topic]);

  const fullUrl = useMemo(() => {
    return generateLinkUrl(slug, topic, { absolute: true });
  }, [slug, topic]);

  const shareUrl = useMemo(() => {
    // For sharing, always use the full URL with protocol
    return fullUrl;
  }, [fullUrl]);

  return {
    displayUrl,  // For display: "foldly.com/slug"
    fullUrl,     // Full URL: "https://foldly.com/slug"
    shareUrl,    // For sharing: same as fullUrl
  };
}