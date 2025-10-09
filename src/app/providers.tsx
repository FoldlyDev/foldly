"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import {
  QueryProvider,
  ThemeProvider,
  PageTransitionProvider,
} from "@/providers";
// import { NotificationProvider } from '@/modules/notifications/providers/NotificationProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={{ theme: dark }}>
      <ThemeProvider attribute="class" enableSystem disableTransitionOnChange>
        <QueryProvider>
          {/* <NotificationProvider> */}
          <PageTransitionProvider>{children}</PageTransitionProvider>
          {/* </NotificationProvider> */}
        </QueryProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
