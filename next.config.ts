import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    // Enable auth interrupts for unauthorized() function
    authInterrupts: true,
    // Optimize package imports for better tree shaking
    // Note: Some local packages may have compatibility issues with Turbopack
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "framer-motion",
      "@tanstack/react-query",
    ],
    // Optimize CSS
    optimizeCss: true,
  },

  // Security headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              // Default: only allow from same origin
              "default-src 'self'",
              // Scripts: allow self, Clerk, Vercel Analytics, and inline scripts (for Next.js)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://va.vercel-scripts.com",
              // Styles: allow self, inline styles (for Tailwind/Framer Motion), and external stylesheets
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Images: allow self, data URIs, Clerk CDN, and whitelisted domains
              "img-src 'self' data: https: blob: https://img.clerk.com https://images.clerk.dev https://em-content.zobj.net",
              // Fonts: allow self, data URIs, and Google Fonts
              "font-src 'self' data: https://fonts.gstatic.com",
              // Connect: allow self, Clerk API, Supabase, and Vercel
              "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://*.supabase.co wss://*.supabase.co https://vercel.live https://vitals.vercel-insights.com",
              // Frames: allow Clerk for embedded components
              "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com",
              // Workers: allow self and blob for service workers
              "worker-src 'self' blob:",
              // Media: allow self
              "media-src 'self'",
              // Object: disallow plugins
              "object-src 'none'",
              // Base URI: restrict to same origin
              "base-uri 'self'",
              // Form actions: restrict to same origin and Clerk
              "form-action 'self' https://*.clerk.accounts.dev https://*.clerk.com",
              // Upgrade insecure requests
              "upgrade-insecure-requests"
            ].join("; ")
          },
        ],
      },
    ];
  },

  // Server configuration
  serverExternalPackages: ["postgres"],

  // Image configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "em-content.zobj.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // Compiler optimizations
  compiler: {
    // Remove console statements in production
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Build configuration
  // typescript: {
  //   // !! WARN !!
  //   // Dangerously allow production builds to successfully complete even if
  //   // your project has type errors.
  //   // !! WARN !!
  //   ignoreBuildErrors: true,
  // },
  // eslint: {
  //   // Warning: This allows production builds to successfully complete even if
  //   // your project has ESLint errors.
  //   ignoreDuringBuilds: true,
  // },
};

export default nextConfig;
