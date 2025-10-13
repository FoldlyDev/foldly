'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const Spotlight = ({
  className,
}: {
  className?: string;
}) => {
  return (
    <div className={cn('absolute inset-0 pointer-events-none z-10', className)}>
      {/* Main spotlight beam */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 1.5,
          ease: 'easeInOut',
        }}
        className='absolute inset-0 flex justify-center overflow-visible'
      >
        {/* Central light beam with radial gradient */}
        <div
          className='absolute -top-20 left-1/2 -translate-x-1/2 w-[200vw] h-[150%]'
          style={{
            background: `radial-gradient(ellipse 50% 60% at 50% 0%,
              rgba(34, 211, 238, 0.4) 0%,
              rgba(34, 211, 238, 0.2) 20%,
              rgba(34, 211, 238, 0.1) 40%,
              rgba(34, 211, 238, 0.05) 60%,
              transparent 100%)`,
          }}
        />

        {/* Secondary softer glow */}
        <div
          className='absolute -top-10 left-1/2 -translate-x-1/2 w-[180vw] h-[130%]'
          style={{
            background: `radial-gradient(ellipse 60% 70% at 50% 0%,
              rgba(34, 211, 238, 0.2) 0%,
              rgba(34, 211, 238, 0.1) 30%,
              rgba(34, 211, 238, 0.05) 50%,
              transparent 80%)`,
          }}
        />

        {/* Subtle ambient light */}
        <div
          className='absolute top-0 left-1/2 -translate-x-1/2 w-[150vw] h-[110%]'
          style={{
            background: `radial-gradient(ellipse 70% 80% at 50% 0%,
              rgba(34, 211, 238, 0.15) 0%,
              rgba(34, 211, 238, 0.08) 25%,
              rgba(34, 211, 238, 0.03) 50%,
              transparent 90%)`,
          }}
        />

        {/* Top bright spot */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 2,
            ease: 'easeOut',
          }}
          className='absolute -top-10 w-96 h-96'
          style={{
            background: `radial-gradient(circle at 50% 50%,
              rgba(34, 211, 238, 0.6) 0%,
              rgba(34, 211, 238, 0.3) 30%,
              transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />

        {/* Animated light rays */}
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className='absolute -top-5 left-1/2 -translate-x-1/2 w-[100vw] h-[100%]'
          style={{
            background: `conic-gradient(from 180deg at 50% 0%,
              transparent 45deg,
              rgba(34, 211, 238, 0.1) 90deg,
              transparent 135deg,
              rgba(34, 211, 238, 0.1) 180deg,
              transparent 225deg,
              rgba(34, 211, 238, 0.1) 270deg,
              transparent 315deg)`,
            maskImage: 'radial-gradient(ellipse 80% 100% at 50% 0%, black 0%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 100% at 50% 0%, black 0%, transparent 80%)',
          }}
        />
      </motion.div>
    </div>
  );
};

// Keep the original LampContainer for backward compatibility if needed
export const LampContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 w-full rounded-md z-0',
        className
      )}
    >
      <div className='relative flex w-full flex-1 scale-y-125 items-center justify-center isolate z-0 '>
        <motion.div
          initial={{ opacity: 0.5, width: '15rem' }}
          whileInView={{ opacity: 1, width: '30rem' }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: 'easeInOut',
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className='absolute inset-auto right-1/2 h-56 overflow-visible w-[30rem] bg-gradient-conic from-cyan-500 via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]'
        >
          <div className='absolute  w-[100%] left-0 bg-slate-950 h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]' />
          <div className='absolute  w-40 h-[100%] left-0 bg-slate-950  bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]' />
        </motion.div>
        <motion.div
          initial={{ opacity: 0.5, width: '15rem' }}
          whileInView={{ opacity: 1, width: '30rem' }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: 'easeInOut',
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className='absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-conic from-transparent via-transparent to-cyan-500 text-white [--conic-position:from_290deg_at_center_top]'
        >
          <div className='absolute  w-40 h-[100%] right-0 bg-slate-950  bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]' />
          <div className='absolute  w-[100%] right-0 bg-slate-950 h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]' />
        </motion.div>
        <div className='absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 bg-slate-950 blur-2xl'></div>
        <div className='absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md'></div>
        <div className='absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full bg-cyan-500 opacity-50 blur-3xl'></div>
        <motion.div
          initial={{ width: '8rem' }}
          whileInView={{ width: '16rem' }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: 'easeInOut',
          }}
          className='absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full bg-cyan-400 blur-2xl'
        ></motion.div>
        <motion.div
          initial={{ width: '15rem' }}
          whileInView={{ width: '30rem' }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: 'easeInOut',
          }}
          className='absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem] bg-cyan-400 '
        ></motion.div>

        <div className='absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] bg-slate-950 '></div>
      </div>

      <div className='relative z-50 flex -translate-y-80 flex-col items-center px-5'>
        {children}
      </div>
    </div>
  );
};
