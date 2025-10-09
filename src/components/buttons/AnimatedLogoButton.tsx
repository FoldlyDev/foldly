'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface AnimatedLogoButtonProps {
  href?: string;
  className?: string;
  isCollapsed?: boolean;
}

export const AnimatedLogoButton: React.FC<AnimatedLogoButtonProps> = ({
  href = '/',
  className = '',
  isCollapsed = false,
}) => {
  const buttonContent = (
    <>
      <div className='animated-logo-wrapper'>
        <Image
          src='/assets/img/logo/foldly_logo_sm.png'
          alt='Foldly Logo'
          width={64}
          height={64}
          className='animated-logo-icon'
          priority
        />
      </div>
      <div className='animated-logo-text'>
        <span className='animated-logo-text-label'>Back to</span>
        <span className='animated-logo-text-brand'>HOME</span>
      </div>
    </>
  );

  return (
    <div className={`animated-logo-container ${isCollapsed ? 'collapsed' : ''} ${className}`}>
      <Link 
        href={href} 
        className={`animated-logo-button brand-foldly ${isCollapsed ? 'collapsed' : ''}`}
        title={isCollapsed ? 'Back to Home' : ''}
      >
        {buttonContent}
      </Link>
    </div>
  );
};