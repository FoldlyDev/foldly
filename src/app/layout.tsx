import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import { QueryProvider } from '@/lib/providers/query-client-provider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Foldly - File Collection Made Simple',
  description:
    'Create custom branded upload links and collect files from clients and collaborators with zero friction. No logins required.',
  keywords: [
    'file collection',
    'file sharing',
    'upload links',
    'file management',
    'collaboration',
  ],
  authors: [{ name: 'Foldly Team' }],
  creator: 'Foldly',
  publisher: 'Foldly',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Foldly - File Collection Made Simple',
    description:
      'Create custom branded upload links and collect files from clients and collaborators with zero friction.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Foldly',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Foldly - File Collection Made Simple',
    description:
      'Create custom branded upload links and collect files from clients and collaborators with zero friction.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang='en'>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <QueryProvider>{children}</QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
