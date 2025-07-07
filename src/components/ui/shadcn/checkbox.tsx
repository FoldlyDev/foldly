'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // Base styles - make sure it's visible with strong border
      'peer h-4 w-4 shrink-0 rounded-sm border-2 bg-white transition-colors',
      // Cursor pointer - important for UX
      'cursor-pointer',
      // Focus styles
      'ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      // Disabled styles
      'disabled:cursor-not-allowed disabled:opacity-50',
      // Unchecked state - using much darker border for visibility
      'border-[#52525b]', // This is neutral-600 - much more visible
      // Hover state
      'hover:border-[#2d4f6b]', // This is tertiary from your design system
      // Focus state
      'focus-visible:ring-[#c3e1f7]', // This is primary from your design system
      // Checked state
      'data-[state=checked]:bg-[#2d4f6b] data-[state=checked]:text-white data-[state=checked]:border-[#2d4f6b]', // tertiary color
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn('flex items-center justify-center text-current')}
    >
      <Check className='h-3 w-3 stroke-[3]' />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
