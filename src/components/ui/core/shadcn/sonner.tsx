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
            'group toast bg-popover text-popover-foreground border-border shadow-lg rounded-lg border pl-12 pr-4 py-3 font-medium relative',
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
            'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-100 dark:border-emerald-800/50',
          error:
            'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/50 dark:text-red-100 dark:border-red-800/50',
          warning:
            'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-100 dark:border-amber-800/50',
          info: 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/50 dark:text-blue-100 dark:border-blue-800/50',
        },
      }}
      style={
        {
          '--normal-bg': 'hsl(var(--popover))',
          '--normal-text': 'hsl(var(--popover-foreground))',
          '--normal-border': 'hsl(var(--border))',
          '--success-bg': 'hsl(142 76% 36%)',
          '--success-text': 'hsl(0 0% 100%)',
          '--success-border': 'hsl(142 76% 36%)',
          '--error-bg': 'hsl(0 84% 60%)',
          '--error-text': 'hsl(0 0% 100%)',
          '--error-border': 'hsl(0 84% 60%)',
          '--warning-bg': 'hsl(43 96% 56%)',
          '--warning-text': 'hsl(0 0% 100%)',
          '--warning-border': 'hsl(43 96% 56%)',
          '--info-bg': 'hsl(var(--primary))',
          '--info-text': 'hsl(var(--primary-foreground))',
          '--info-border': 'hsl(var(--primary))',
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
