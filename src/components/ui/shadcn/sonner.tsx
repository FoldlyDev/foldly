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
            'group toast group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg rounded-lg border-2 px-4 py-3 font-medium',
          title:
            'group-[.toast]:text-sm group-[.toast]:font-semibold group-[.toast]:text-foreground',
          description:
            'group-[.toast]:text-xs group-[.toast]:text-muted-foreground group-[.toast]:mt-1',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground hover:group-[.toast]:bg-primary/90 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground hover:group-[.toast]:bg-muted/80 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
          closeButton:
            'group-[.toast]:bg-transparent group-[.toast]:text-foreground/50 hover:group-[.toast]:text-foreground group-[.toast]:border-0 hover:group-[.toast]:bg-muted/20 transition-colors',
          success:
            'group-[.toaster]:bg-emerald-50 group-[.toaster]:text-emerald-900 group-[.toaster]:border-emerald-200 dark:group-[.toaster]:bg-emerald-950/50 dark:group-[.toaster]:text-emerald-100 dark:group-[.toaster]:border-emerald-800/50',
          error:
            'group-[.toaster]:bg-red-50 group-[.toaster]:text-red-900 group-[.toaster]:border-red-200 dark:group-[.toaster]:bg-red-950/50 dark:group-[.toaster]:text-red-100 dark:group-[.toaster]:border-red-800/50',
          warning:
            'group-[.toaster]:bg-amber-50 group-[.toaster]:text-amber-900 group-[.toaster]:border-amber-200 dark:group-[.toaster]:bg-amber-950/50 dark:group-[.toaster]:text-amber-100 dark:group-[.toaster]:border-amber-800/50',
          info: 'group-[.toaster]:bg-blue-50 group-[.toaster]:text-blue-900 group-[.toaster]:border-blue-200 dark:group-[.toaster]:bg-blue-950/50 dark:group-[.toaster]:text-blue-100 dark:group-[.toaster]:border-blue-800/50',
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
      position='top-right'
      expand={false}
      visibleToasts={4}
      closeButton
      richColors
      {...props}
    />
  );
};

export { Toaster };
