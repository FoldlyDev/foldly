import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  // Initialize with undefined to detect SSR vs client
  const [matches, setMatches] = useState<boolean | undefined>(() => {
    // During SSR, return undefined
    if (typeof window === 'undefined') {
      return undefined;
    }
    // On client, check immediately
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    // Skip if SSR
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);
    
    // Set initial value (handles hydration)
    setMatches(media.matches);

    // Create event listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add event listener
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener);
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        // Fallback for older browsers
        media.removeListener(listener);
      }
    };
  }, [query]);

  // For desktop-first approach, default to true during SSR/initial render
  // This prevents the flash from mobile to desktop view
  return matches ?? true;
}