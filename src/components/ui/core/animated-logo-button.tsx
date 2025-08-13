'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface AnimatedLogoButtonProps {
  href?: string;
  className?: string;
}

export const AnimatedLogoButton: React.FC<AnimatedLogoButtonProps> = ({
  href = '/',
  className = '',
}) => {
  const buttonContent = (
    <>
      <div className='logo-container'>
        <Image
          src='/assets/img/logo/foldly_logo_sm.png'
          alt='Foldly Logo'
          width={64}
          height={64}
          className='logo-icon'
          priority
        />
      </div>
      <div className='button-text'>
        <span>FOLDLY</span>
      </div>
    </>
  );

  return (
    <div className={`button-container ${className}`}>
      <Link href={href} className='brutalist-button foldly'>
        {buttonContent}
      </Link>
    </div>
  );
};