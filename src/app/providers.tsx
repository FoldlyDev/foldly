'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { QueryProvider } from '@/lib/providers/query-client-provider';
import { ThemeProvider } from '@/lib/providers/theme-provider';
import { NotificationProvider } from '@/features/notifications/providers/NotificationProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={{ theme: dark }}>
      <ThemeProvider attribute='class' enableSystem disableTransitionOnChange>
        <QueryProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </QueryProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
