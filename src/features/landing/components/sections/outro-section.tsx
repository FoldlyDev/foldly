'use client';

import Link from 'next/link';
import { PrimaryCta } from '@/components/ui/core/primary-cta';

export function OutroSection() {
  return (
    <section className='outro'>
      <div className='outro-content'>
        <h1 className='text-5xl sm:text-6xl md:text-7xl font-black uppercase leading-[0.85] tracking-tighter bg-gradient-to-br from-[#020618] to-[#2d4f6b] bg-clip-text text-transparent w-full md:w-1/2 mx-auto mb-16'>
          Ready to streamline your workflow?
        </h1>
        <div className='cta-buttons flex justify-center items-center mb-20'>
          <Link href='/sign-up' className='no-underline'>
            <PrimaryCta />
          </Link>
        </div>
        <div className='trust-signals text-sm text-black'>
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
