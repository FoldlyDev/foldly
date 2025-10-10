'use client';

import { ClerkLoaded, ClerkLoading, SignUp } from '@clerk/nextjs';
import { ArrowLeft } from 'lucide-react';
import { BubbleBackground } from '@/components/ui/animateui/bubble';
import { useEffect, useState } from 'react';

export function SignUpView() {
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
          <ArrowLeft className="w-5 h-5" />
          Back
        </a>

        {/* Loading state for SSR */}
        <div className='flex flex-col items-center justify-center gap-6 p-8 bg-neutral-50 border border-neutral-200 rounded-2xl shadow-xl max-w-md w-full relative z-10'>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
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
        <ArrowLeft className="w-5 h-5" />
        Back
      </a>

      {/* Loading state */}
      <ClerkLoading>
        <div className='flex flex-col items-center justify-center gap-6 p-8 bg-neutral-50 border border-neutral-200 rounded-2xl shadow-xl max-w-md w-full relative z-10'>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
          <p className='text-neutral-600 text-sm font-medium text-center m-0'>
            Loading authentication...
          </p>
        </div>
      </ClerkLoading>

      {/* Auth modal */}
      <ClerkLoaded>
        <div className='auth-card-container'>
          <SignUp />
        </div>
      </ClerkLoaded>
    </div>
  );
}
