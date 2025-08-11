'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { QueryProvider } from '@/lib/providers/query-client-provider';
import { ThemeProvider } from '@/lib/providers/theme-provider';
import { NotificationProvider } from '@/features/notifications/providers/NotificationProvider';
import { useTheme } from '@/lib/providers/theme-provider';
import { useEffect, useState } from 'react';

// This component must be inside ThemeProvider to use useTheme
function ThemedClerkProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [clerkAppearance, setClerkAppearance] = useState({});

  useEffect(() => {
    // Update Clerk appearance when theme changes
    setClerkAppearance(resolvedTheme === 'dark' ? { baseTheme: dark } : {});
  }, [resolvedTheme]);

  return (
    <ClerkProvider appearance={clerkAppearance}>
      {children}
    </ClerkProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ThemeProvider
        attribute='class'
        enableSystem
        disableTransitionOnChange
      >
        <ThemedClerkProvider>
          <QueryProvider>
            <NotificationProvider>{children}</NotificationProvider>
          </QueryProvider>
        </ThemedClerkProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}