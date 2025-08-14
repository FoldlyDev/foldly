'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface TertiaryCTAButtonProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  href?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  target?: '_blank' | '_self' | '_parent' | '_top';
  rel?: string;
}

export const TertiaryCTAButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  TertiaryCTAButtonProps
>(
  (
    {
      children,
      icon: Icon,
      href,
      onClick,
      className,
      disabled = false,
      type = 'button',
      target,
      rel,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'cta relative cursor-pointer py-4 px-8 text-center font-barlow inline-flex justify-center text-base uppercase text-white rounded-lg border-solid transition-transform duration-300 ease-in-out group outline-offset-4 focus:outline focus:outline-2 focus:outline-white focus:outline-offset-4 overflow-hidden';
    const combinedClasses = cn(baseClasses, className);

    const content = (
      <>
        <span className='relative z-20 flex items-center gap-2'>
          {Icon && <Icon className='w-5 h-5' />}
          {children}
        </span>

        {/* Animated glow effect */}
        <span className='absolute left-[-75%] top-0 h-full w-[50%] bg-white/20 rotate-12 z-10 blur-lg group-hover:left-[125%] transition-all duration-1000 ease-in-out'></span>

        {/* Corner borders */}
        <span className='w-1/2 drop-shadow-3xl transition-all duration-300 block border-[#D4EDF9] absolute h-[20%] rounded-tl-lg border-l-2 border-t-2 top-0 left-0'></span>
        <span className='w-1/2 drop-shadow-3xl transition-all duration-300 block border-[#D4EDF9] absolute group-hover:h-[90%] h-[60%] rounded-tr-lg border-r-2 border-t-2 top-0 right-0'></span>
        <span className='w-1/2 drop-shadow-3xl transition-all duration-300 block border-[#D4EDF9] absolute h-[60%] group-hover:h-[90%] rounded-bl-lg border-l-2 border-b-2 left-0 bottom-0'></span>
        <span className='w-1/2 drop-shadow-3xl transition-all duration-300 block border-[#D4EDF9] absolute h-[20%] rounded-br-lg border-r-2 border-b-2 right-0 bottom-0'></span>
      </>
    );

    if (href && !disabled) {
      return (
        <Link
          href={href}
          className={combinedClasses}
          target={target}
          rel={rel}
          ref={ref as React.Ref<HTMLAnchorElement>}
          {...props}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        type={type}
        onClick={onClick}
        className={combinedClasses}
        disabled={disabled}
        ref={ref as React.Ref<HTMLButtonElement>}
        {...props}
      >
        {content}
      </button>
    );
  }
);

TertiaryCTAButton.displayName = 'TertiaryCTAButton';
