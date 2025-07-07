'use client';

import Link from 'next/link';
import { GradientButton } from '@/components/ui';

export function OutroSection() {
  return (
    <section className='outro'>
      <div className='outro-content'>
        <h1>Ready to simplify file collection?</h1>
        <div className='cta-buttons'>
          <Link href='/sign-up' className='no-underline'>
            <GradientButton variant='primary' size='lg'>
              Start Free
            </GradientButton>
          </Link>
          <Link href='/sign-in' className='no-underline'>
            <GradientButton variant='secondary' size='lg'>
              Sign In
            </GradientButton>
          </Link>
        </div>
      </div>
    </section>
  );
}
