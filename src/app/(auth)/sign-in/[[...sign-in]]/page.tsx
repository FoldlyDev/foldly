'use client';

import { ClerkLoaded, ClerkLoading, SignIn } from '@clerk/nextjs';
import { ArrowLeft } from '@/components/ui/animate-ui/icons/arrow-left';
import { AnimateIcon } from '@/components/ui/animate-ui/icons/icon';
import { ContentLoader } from '@/components/feedback/content-loader';
import { BubbleBackground } from '@/components/core/bubble';
import { useEffect, useState } from 'react';

import '@/features/auth/styles/auth-pages.css';

export default function SignInPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className='auth-page flex flex-col items-center justify-center'>
        <BubbleBackground />

        {/* Back button */}
        <a href='/' className='auth-back-button' aria-label='Back to home'>
          <AnimateIcon>
            <ArrowLeft />
          </AnimateIcon>
          Back
        </a>

        {/* Loading state for SSR */}
        <div className='flex flex-col items-center justify-center gap-6 p-8 bg-neutral-50 border border-neutral-200 rounded-2xl shadow-xl max-w-md w-full relative z-10'>
          <ContentLoader size='lg' />
          <p className='text-neutral-600 text-sm font-medium text-center m-0'>
            Loading authentication...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='auth-page flex flex-col items-center justify-center'>
      <BubbleBackground />

      {/* Back button */}
      <a href='/' className='auth-back-button' aria-label='Back to home'>
        <AnimateIcon>
          <ArrowLeft />
        </AnimateIcon>
        Back
      </a>

      {/* Loading state */}
      <ClerkLoading>
        <div className='flex flex-col items-center justify-center gap-6 p-8 bg-neutral-50 border border-neutral-200 rounded-2xl shadow-xl max-w-md w-full relative z-10'>
          <ContentLoader size='lg' />
          <p className='text-neutral-600 text-sm font-medium text-center m-0'>
            Loading authentication...
          </p>
        </div>
      </ClerkLoading>

      {/* Auth modal */}
      <ClerkLoaded>
        <div className='auth-card-container'>
          <SignIn />
        </div>
      </ClerkLoaded>
    </div>
  );
}
