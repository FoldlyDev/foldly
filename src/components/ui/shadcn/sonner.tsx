'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={(theme as ToasterProps['theme']) || 'system'}
      className='toaster group'
      toastOptions={{
        classNames: {
          toast:
            'group toast bg-popover text-popover-foreground border-border shadow-lg rounded-lg border pl-12 pr-4 py-3 font-medium relative dark:bg-[var(--foldly-glass-bg-solid)] dark:backdrop-blur-[12px] dark:border-white/10',
          title:
            'text-sm font-semibold text-foreground',
          description:
            'text-xs text-muted-foreground mt-1 pr-4',
          actionButton:
            'bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
          cancelButton:
            'bg-muted text-muted-foreground hover:bg-muted/80 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
          closeButton:
            'absolute left-2 top-2.5 rounded-md p-1 text-foreground/50 hover:text-foreground hover:bg-muted/20 transition-colors opacity-100',
          success:
            'bg-green-50 text-green-900 border-green-200 dark:bg-[var(--foldly-glass-bg-solid)] dark:text-green-100 dark:border-green-400/30 dark:backdrop-blur-[12px]',
          error:
            'bg-red-50 text-red-900 border-red-200 dark:bg-[var(--foldly-glass-bg-solid)] dark:text-red-100 dark:border-red-400/30 dark:backdrop-blur-[12px]',
          warning:
            'bg-amber-50 text-amber-900 border-amber-200 dark:bg-[var(--foldly-glass-bg-solid)] dark:text-amber-100 dark:border-amber-400/30 dark:backdrop-blur-[12px]',
          info: 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-[var(--foldly-glass-bg-solid)] dark:text-blue-100 dark:border-blue-400/30 dark:backdrop-blur-[12px]',
        },
      }}
      style={
        {
          '--normal-bg': 'hsl(var(--popover))',
          '--normal-text': 'hsl(var(--popover-foreground))',
          '--normal-border': 'hsl(var(--border))',
        } as React.CSSProperties
      }
      position='bottom-right'
      expand={false}
      visibleToasts={4}
      closeButton
      richColors
      offset={16}
      {...props}
    />
  );
};

export { Toaster };
