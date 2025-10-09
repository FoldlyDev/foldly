import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Foldly - File Collection Platform',
    short_name: 'Foldly',
    description: 'Collect files from anyone, anywhere with smart links',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    orientation: 'portrait-primary',
    categories: ['productivity', 'utilities', 'business'],
    icons: [
      {
        src: '/assets/img/logo/foldly_logo_sm.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/assets/img/logo/foldly_logo_lg.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Create Link',
        short_name: 'New Link',
        description: 'Create a new file collection link',
        url: '/dashboard/links?action=create',
        icons: [
          {
            src: '/assets/img/logo/foldly_logo_sm.png',
            sizes: '96x96',
          },
        ],
      },
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'View your dashboard',
        url: '/dashboard/workspace',
        icons: [
          {
            src: '/assets/img/logo/foldly_logo_sm.png',
            sizes: '96x96',
          },
        ],
      },
    ],
  };
}
