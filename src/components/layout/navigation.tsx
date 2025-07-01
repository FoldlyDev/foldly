'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser, UserButton } from '@clerk/nextjs';
import { LayoutDashboard } from 'lucide-react';
import { GradientButton } from '@/components/ui';
import { useScrollPosition } from '@/lib/hooks/use-scroll-position';
import { cn } from '@/lib/utils/utils';

export function Navigation() {
  const { isSignedIn, isLoaded } = useUser();
  const { isScrolled } = useScrollPosition({ threshold: 20 });

  // Don't render until user state is loaded to prevent flash
  if (!isLoaded) return null;

  return (
    <nav
      className={cn(
        'fixed w-screen flex justify-between items-center z-[100] transition-all duration-300 ease-out',
        isScrolled
          ? 'bg-transparent backdrop-blur-md shadow-lg shadow-black/5 py-3 px-8'
          : 'bg-transparent py-8 px-8'
      )}
    >
      <div className='logo'>
        <Image
          src='/assets/img/logo/foldly_logo_sm.png'
          alt='Foldly'
          width={180}
          height={60}
          className='h-16 w-auto'
          priority
        />
      </div>

      <div className='nav-links flex items-center gap-4'>
        {isSignedIn ? (
          // Signed in: Show dashboard button + user button
          <>
            <Link href='/dashboard' className='no-underline'>
              <GradientButton variant='secondary' size='md'>
                <LayoutDashboard size={16} />
                Dashboard
              </GradientButton>
            </Link>
            <div className='flex items-center'>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-12 h-12 cursor-pointer',
                  },
                }}
                afterSignOutUrl='/'
              />
            </div>
          </>
        ) : (
          // Signed out: Show sign in button
          <Link href='/sign-in' className='no-underline'>
            <span className='text-sm p-3 rounded-sm font-medium uppercase tracking-wide bg-neutral-100 text-neutral-800 transition-all duration-300 ease-in-out hover:bg-neutral-800 hover:text-neutral-50 font-sans cursor-pointer'>
              Sign In
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}
