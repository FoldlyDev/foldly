'use client';
import { cn } from '@/lib/utils';
import { useMotionValue, motion, useMotionTemplate } from 'motion/react';
import React from 'react';

export default function BackgroundHighlight({
  children,
  className,
  containerClassName,
  staticHighlights = [],
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  staticHighlights?: Array<{
    x: number;
    y: number;
    size?: number;
    width?: number;
    height?: number;
    opacity?: number;
    shape?: 'circle' | 'rectangle';
  }>;
}) {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  // SVG patterns for different states and themes
  const dotPatterns = {
    light: {
      default: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%23d4d4d4' id='pattern-circle' cx='10' cy='10' r='2.5'%3E%3C/circle%3E%3C/svg%3E")`,
      hover: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%236366f1' id='pattern-circle' cx='10' cy='10' r='2.5'%3E%3C/circle%3E%3C/svg%3E")`,
    },
    dark: {
      default: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%23404040' id='pattern-circle' cx='10' cy='10' r='2.5'%3E%3C/circle%3E%3C/svg%3E")`,
      hover: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%238183f4' id='pattern-circle' cx='10' cy='10' r='2.5'%3E%3C/circle%3E%3C/svg%3E")`,
    },
  };

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    if (!currentTarget) return;
    let { left, top } = currentTarget.getBoundingClientRect();

    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }
  return (
    <div
      className={cn(
        'group relative h-full w-full bg-white dark:bg-black',
        containerClassName
      )}
      onMouseMove={handleMouseMove}
    >
      <div
        className='pointer-events-none absolute inset-0 dark:hidden'
        style={{
          backgroundImage: dotPatterns.light.default,
        }}
      />
      <div
        className='pointer-events-none absolute inset-0 hidden dark:block'
        style={{
          backgroundImage: dotPatterns.dark.default,
        }}
      />
      <motion.div
        className='pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 dark:hidden'
        style={{
          backgroundImage: dotPatterns.light.hover,
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              200px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
          maskImage: useMotionTemplate`
            radial-gradient(
              200px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
        }}
      />
      <motion.div
        className='pointer-events-none absolute inset-0 hidden opacity-0 transition duration-300 group-hover:opacity-100 dark:block'
        style={{
          backgroundImage: dotPatterns.dark.hover,
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              200px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
          maskImage: useMotionTemplate`
            radial-gradient(
              200px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
        }}
      />

      {/* Static Highlights */}
      {staticHighlights.map((highlight, index) => {
        const isRectangle = highlight.shape === 'rectangle';
        const width = highlight.width || highlight.size || 200;
        const height = highlight.height || highlight.size || 200;
        
        // Create more potent patterns for lamp effect
        const brightDotPatterns = {
          light: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%233b82f6' id='pattern-circle' cx='10' cy='10' r='2.5'%3E%3C/circle%3E%3C/svg%3E")`,
          dark: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%235b94f7' id='pattern-circle' cx='10' cy='10' r='2.5'%3E%3C/circle%3E%3C/svg%3E")`,
        };

        const maskImage = isRectangle
          ? `linear-gradient(
              to right,
              transparent 0%,
              black 10%,
              black 90%,
              transparent 100%
            )`
          : `radial-gradient(
              ${width}px circle at ${highlight.x}px ${highlight.y}px,
              black 0%,
              transparent 100%
            )`;

        return (
          <React.Fragment key={index}>
            {/* Light mode static highlight */}
            <div
              className='pointer-events-none absolute dark:hidden'
              style={{
                backgroundImage: brightDotPatterns.light,
                opacity: highlight.opacity || 1.2,
                filter: 'brightness(1.5) saturate(1.3)',
                WebkitMaskImage: maskImage,
                maskImage: maskImage,
                width: isRectangle ? `${width}px` : '100%',
                height: isRectangle ? `${height}px` : '100%',
                top: isRectangle ? `${highlight.y - height / 2}px` : 0,
                left: isRectangle ? `${highlight.x - width / 2}px` : 0,
              }}
            />
            {/* Dark mode static highlight */}
            <div
              className='pointer-events-none absolute hidden dark:block'
              style={{
                backgroundImage: brightDotPatterns.dark,
                opacity: highlight.opacity || 1.2,
                filter: 'brightness(1.8) saturate(1.5)',
                WebkitMaskImage: maskImage,
                maskImage: maskImage,
                width: isRectangle ? `${width}px` : '100%',
                height: isRectangle ? `${height}px` : '100%',
                top: isRectangle ? `${highlight.y - height / 2}px` : 0,
                left: isRectangle ? `${highlight.x - width / 2}px` : 0,
              }}
            />
          </React.Fragment>
        );
      })}

      <div className={cn('relative z-20', className)}>{children}</div>
    </div>
  );
}
