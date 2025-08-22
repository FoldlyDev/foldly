import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    // Enable auth interrupts for unauthorized() function
    authInterrupts: true,
    // Optimize package imports for better tree shaking
    // Note: Some local packages may have compatibility issues with Turbopack
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'framer-motion',
      '@tanstack/react-query',
    ],
    // Optimize CSS
    optimizeCss: true,
  },

  // Server configuration
  serverExternalPackages: ['postgres'],

  // Image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
        pathname: '/**',
      },
    ],
  },

  // Compiler optimizations
  compiler: {
    // Remove console statements in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Turbopack configuration (replaces webpack configuration)
  // Note: Turbopack handles chunk optimization automatically and more efficiently
  turbopack: {
    // Resolve aliases for better import paths
    resolveAlias: {
      '@/components': './src/components',
      '@/lib': './src/lib',
      '@/features': './src/features',
      '@/types': './src/types',
    },
    // Resolve extensions for TypeScript and JavaScript files
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },

  // Build configuration
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
