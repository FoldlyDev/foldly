'use client';

/**
 * Browser detection utilities for handling browser-specific issues
 */

export interface BrowserInfo {
  isBrave: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  isEdge: boolean;
  hasStrictPrivacy: boolean;
  supportsWebGL: boolean;
  supportsGSAP: boolean;
}

/**
 * Detects the current browser and its capabilities
 */
export function detectBrowser(): BrowserInfo {
  if (typeof window === 'undefined') {
    return {
      isBrave: false,
      isChrome: false,
      isFirefox: false,
      isSafari: false,
      isEdge: false,
      hasStrictPrivacy: false,
      supportsWebGL: true,
      supportsGSAP: true,
    };
  }

  const ua = navigator.userAgent.toLowerCase();
  const vendor = (navigator as any).vendor?.toLowerCase() || '';

  // Detect Brave browser
  const isBrave = !!(navigator as any).brave || false;

  // Detect other browsers
  const isChrome = !isBrave && /chrome|chromium/.test(ua) && /google/.test(vendor);
  const isFirefox = /firefox/.test(ua);
  const isSafari = /safari/.test(ua) && /apple/.test(vendor) && !/chrome/.test(ua);
  const isEdge = /edg/.test(ua);

  // Check for strict privacy mode (Brave shields, Firefox ETP, etc.)
  const hasStrictPrivacy = isBrave || checkStrictPrivacyMode();

  // Check WebGL support
  const supportsWebGL = checkWebGLSupport();

  // Check if GSAP can work properly
  const supportsGSAP = checkGSAPSupport();

  return {
    isBrave,
    isChrome,
    isFirefox,
    isSafari,
    isEdge,
    hasStrictPrivacy,
    supportsWebGL,
    supportsGSAP,
  };
}

/**
 * Checks if the browser has strict privacy mode enabled
 */
function checkStrictPrivacyMode(): boolean {
  try {
    // Check for common privacy indicators
    const hasPrivacyMode = 
      // Check if third-party cookies are blocked
      !navigator.cookieEnabled ||
      // Check if localStorage is restricted
      !window.localStorage ||
      // Check for privacy-focused user agents
      /duckduckgo|brave/i.test(navigator.userAgent);

    return hasPrivacyMode;
  } catch {
    return true; // If we can't check, assume strict mode
  }
}

/**
 * Checks WebGL support for advanced animations
 */
function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

/**
 * Checks if GSAP animations can work properly
 */
function checkGSAPSupport(): boolean {
  try {
    // Check if requestAnimationFrame is available
    if (!window.requestAnimationFrame) return false;

    // Check if CSS transforms are supported
    const testEl = document.createElement('div');
    const transforms = ['transform', 'WebkitTransform', 'MozTransform', 'OTransform', 'msTransform'];
    
    for (const transform of transforms) {
      if (transform in testEl.style) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Gets browser-specific configuration for animations
 */
export function getBrowserAnimationConfig() {
  const browser = detectBrowser();

  return {
    // Reduce animation complexity for browsers with strict privacy
    reduceMotion: browser.hasStrictPrivacy,
    
    // Disable WebGL effects if not supported
    enableWebGL: browser.supportsWebGL && !browser.hasStrictPrivacy,
    
    // Use simpler animations for Brave
    useSimpleAnimations: browser.isBrave,
    
    // Animation frame rate
    targetFPS: browser.hasStrictPrivacy ? 30 : 60,
    
    // ScrollTrigger configuration
    scrollTriggerConfig: {
      // Limit auto-refresh for privacy browsers to improve performance
      limitCallbacks: browser.hasStrictPrivacy,
      // Sync refresh with RAF for smoother animations
      syncInterval: browser.hasStrictPrivacy ? 100 : 40,
      // Disable auto-refresh on resize for Brave
      autoRefreshEvents: browser.isBrave ? 'visibilitychange,DOMContentLoaded,load' : 'visibilitychange,DOMContentLoaded,load,resize',
    },
    
    // ScrollTrigger defaults for individual triggers
    scrollTriggerDefaults: {
      anticipatePin: browser.isBrave ? 0 : 1,
      fastScrollEnd: !browser.isBrave,
      preventOverlaps: browser.isBrave,
    },
  };
}