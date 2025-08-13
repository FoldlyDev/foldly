'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface SecondaryCTAButtonProps {
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

export const SecondaryCTAButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  SecondaryCTAButtonProps
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
    const baseClasses = 'relative cursor-pointer py-4 px-8 text-center font-bold inline-flex justify-center text-base text-white rounded-lg border-[3px] border-[#149CEA] border-solid bg-transparent transition-all duration-[1s] group outline-none hover:shadow-[inset_0px_0px_25px_#1479EA] overflow-hidden';
    const combinedClasses = cn(baseClasses, className);

    const content = (
      <>
        <span className='relative z-20 flex items-center gap-2'>
          {Icon && <Icon className='w-5 h-5' />}
          {children}
        </span>

        {/* Top border mask - uses parent background color */}
        <span className='absolute -top-[3px] left-[5%] w-[90%] h-[6px] bg-white dark:bg-gray-900 transition-transform duration-500 origin-center group-hover:scale-x-0'></span>

        {/* Bottom border mask - uses parent background color */}
        <span className='absolute -bottom-[3px] left-[5%] w-[90%] h-[6px] bg-white dark:bg-gray-900 transition-transform duration-500 origin-center group-hover:scale-x-0'></span>
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

SecondaryCTAButton.displayName = 'SecondaryCTAButton';
