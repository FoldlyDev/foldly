'use client';

import Link from 'next/link';
import { GradientButton } from '@/components/ui/core/gradient-button';

export function OutroSection() {
  return (
    <section className='outro'>
      <div className='outro-content'>
        <h1>Ready to streamline your workflow?</h1>
        <p className='outro-subtitle text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto'>
          Set up your first link in 30 seconds. Free forever, no credit card needed.
        </p>
        <div className='cta-buttons flex flex-col sm:flex-row gap-4 justify-center items-center'>
          <Link href='/sign-up' className='no-underline'>
            <GradientButton variant='primary' size='lg' className='min-w-[160px]'>
              Create Your First Link
            </GradientButton>
          </Link>
          <Link href='/demo' className='no-underline'>
            <GradientButton variant='secondary' size='lg' className='min-w-[160px]'>
              Watch Demo
            </GradientButton>
          </Link>
        </div>
        <div className='trust-signals mt-12 text-sm text-gray-500 dark:text-gray-500'>
          <p className='flex items-center justify-center gap-6'>
            <span>✓ No credit card</span>
            <span>✓ Free forever tier</span>
            <span>✓ Setup in 30 seconds</span>
          </p>
        </div>
      </div>
    </section>
  );
}
