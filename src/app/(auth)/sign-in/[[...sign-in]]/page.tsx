import { ClerkLoaded, ClerkLoading, SignIn } from '@clerk/nextjs';
import { ArrowLeft } from '@/components/animate-ui/icons/arrow-left';
import { AnimateIcon } from '@/components/animate-ui/icons/icon';
import { ContentLoader } from '@/components/ui/content-loader';
import { BubbleBackground } from '@/components/ui/bubble';

import '@/styles/components/auth/auth-pages.css';

export default function SignInPage() {
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
