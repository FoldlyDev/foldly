import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Foldly Authentication',
    default: 'Sign In | Foldly',
  },
  description: 'Secure authentication for your file collection platform',
  robots: {
    index: false, // Don't index auth pages
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className='min-h-screen bg-gradient-subtle'>{children}</div>;
}
