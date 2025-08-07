'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import { getUserSettingsAction, updateThemeAction } from '@/features/settings/lib/actions/user-settings-actions';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: 'class' | 'data-theme' | 'data-mode';
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  storageKey?: string;
  themes?: string[];
  forcedTheme?: string;
  value?: { [themeName: string]: string };
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { isLoaded, isSignedIn } = useUser();
  const [defaultTheme, setDefaultTheme] = useState<string>(props.defaultTheme || 'system');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  // Fetch user's theme preference from database when signed in
  useEffect(() => {
    const loadUserTheme = async () => {
      if (isLoaded && isSignedIn) {
        try {
          const result = await getUserSettingsAction();
          if (result.success && 'data' in result && result.data?.theme) {
            setDefaultTheme(result.data.theme);
          }
        } catch (error) {
          console.error('Failed to load user theme:', error);
        }
      }
      setIsThemeLoaded(true);
    };

    loadUserTheme();
  }, [isLoaded, isSignedIn]);

  // Show children immediately but with system theme while loading user preference
  return (
    <NextThemesProvider
      {...props}
      defaultTheme={isThemeLoaded ? defaultTheme : 'system'}
    >
      <ThemeSyncWrapper>{children}</ThemeSyncWrapper>
    </NextThemesProvider>
  );
}

// Wrapper component to sync theme changes with database
function ThemeSyncWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useNextTheme();
  const { isSignedIn } = useUser();
  const [lastSyncedTheme, setLastSyncedTheme] = useState<string | null>(null);

  // Sync theme changes with database when user changes theme
  useEffect(() => {
    if (isSignedIn && theme && theme !== lastSyncedTheme) {
      const syncTheme = async () => {
        try {
          await updateThemeAction(theme as 'light' | 'dark' | 'system');
          setLastSyncedTheme(theme);
        } catch (error) {
          console.error('Failed to sync theme with database:', error);
        }
      };
      
      // Debounce to avoid too many database updates
      const timeoutId = setTimeout(syncTheme, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [theme, isSignedIn, lastSyncedTheme]);

  return <>{children}</>;
}

// Custom hook that wraps useTheme and adds database syncing
export function useTheme() {
  const nextTheme = useNextTheme();
  
  const setTheme = React.useCallback((theme: string) => {
    // Set theme locally first for immediate feedback
    nextTheme.setTheme(theme);
    
    // Database sync happens automatically in ThemeSyncWrapper
  }, [nextTheme]);

  return {
    ...nextTheme,
    setTheme
  };
}