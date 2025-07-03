import { ClerkLoaded, ClerkLoading, SignUp } from '@clerk/nextjs';
import { ArrowLeft } from '@/components/animate-ui/icons/arrow-left';
import { AnimateIcon } from '@/components/animate-ui/icons/icon';
import { ContentLoader } from '@/components/ui/content-loader';
import { BubbleBackground } from '@/components/ui/bubble';

import '@/components/features/auth/styles/auth-pages.css';

export default function SignUpPage() {
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
        <div className='auth-loading-state'>
          <ContentLoader size='lg' />
          <p className='auth-loading-text'>Loading authentication...</p>
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
