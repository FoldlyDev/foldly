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
    const baseClasses = 'secondary-cta-btn cta foldly-glass';
    const combinedClasses = cn(baseClasses, className);

    const content = (
      <>
        {/* Content */}
        <span className='relative z-20 flex items-center gap-2'>
          {Icon && <Icon className='w-5 h-5' />}
          {children}
        </span>

        {/* Particles */}
        <div
          className='secondary-cta-particle'
          style={
            {
              '--tx': '-20px',
              '--ty': '-15px',
              left: '25%',
              top: '25%',
            } as React.CSSProperties
          }
        />
        <div
          className='secondary-cta-particle'
          style={
            {
              '--tx': '15px',
              '--ty': '-20px',
              left: '75%',
              top: '25%',
              animationDelay: '0.2s',
            } as React.CSSProperties
          }
        />
        <div
          className='secondary-cta-particle'
          style={
            {
              '--tx': '-15px',
              '--ty': '15px',
              left: '25%',
              top: '75%',
              animationDelay: '0.4s',
            } as React.CSSProperties
          }
        />
        <div
          className='secondary-cta-particle'
          style={
            {
              '--tx': '20px',
              '--ty': '15px',
              left: '75%',
              top: '75%',
              animationDelay: '0.6s',
            } as React.CSSProperties
          }
        />
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
