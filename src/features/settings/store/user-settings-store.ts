/**
 * User Settings Store - Global state management for user preferences
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface UserSettings {
  // Settings state
  theme: ThemeMode;
  doNotDisturb: boolean;
  silentNotifications: boolean;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  
  // Actions
  setTheme: (theme: ThemeMode) => void;
  setDoNotDisturb: (enabled: boolean) => void;
  setSilentNotifications: (enabled: boolean) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  
  // Initialize settings from database
  initializeSettings: (settings: {
    theme: ThemeMode;
    doNotDisturb: boolean;
    silentNotifications: boolean;
  }) => void;
}

export const useUserSettingsStore = create<UserSettings>()(
  subscribeWithSelector((set) => ({
    // Default settings
    theme: 'system',
    doNotDisturb: false,
    silentNotifications: false,
    
    // Loading states
    isLoading: true,
    isSaving: false,
    
    // Actions
    setTheme: (theme) => set({ theme }),
    
    setDoNotDisturb: (doNotDisturb) => set({ doNotDisturb }),
    
    setSilentNotifications: (silentNotifications) => set({ silentNotifications }),
    
    updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
    
    setLoading: (isLoading) => set({ isLoading }),
    
    setSaving: (isSaving) => set({ isSaving }),
    
    initializeSettings: (settings) => set({
      theme: settings.theme,
      doNotDisturb: settings.doNotDisturb,
      silentNotifications: settings.silentNotifications,
      isLoading: false,
    }),
  }))
);

// Subscribe to theme changes to update document
useUserSettingsStore.subscribe(
  (state) => state.theme,
  (theme) => {
    // Apply theme to document
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      
      if (theme === 'system') {
        // Use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      } else {
        // Use explicit theme
        root.classList.toggle('dark', theme === 'dark');
      }
    }
  }
);

// Listen for system theme changes when in system mode
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  mediaQuery.addEventListener('change', (e) => {
    const state = useUserSettingsStore.getState();
    if (state.theme === 'system') {
      document.documentElement.classList.toggle('dark', e.matches);
    }
  });
}