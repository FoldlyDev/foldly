'use client';

import { useEffect } from 'react';
import {
  Settings,
  Moon,
  Sun,
  BellOff,
  User,
  Monitor,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTheme } from '@/lib/providers/theme-provider';
import { useUserSettingsStore } from '@/features/settings/store/user-settings-store';
import {
  updateDoNotDisturbAction,
  updateSilentNotificationsAction,
} from '@/features/settings/lib/actions/user-settings-actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/marketing/animate-ui/radix/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

export function SettingsDropdown() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const {
    doNotDisturb,
    silentNotifications,
    setDoNotDisturb,
    setSilentNotifications,
    isSaving,
  } = useUserSettingsStore();

  const handleThemeChange = async (newTheme: string) => {
    // The useTheme hook from theme-provider handles both local state and database sync
    setTheme(newTheme);

    const themeMessages = {
      light: 'Let there be light! ☀️',
      dark: 'Welcome to the dark side 🌙',
      system: 'Going with the flow 🤖',
    };

    toast.success(
      themeMessages[newTheme as keyof typeof themeMessages] ||
        `Switched to ${newTheme} mode`
    );
  };

  const handleDNDToggle = async () => {
    const newValue = !doNotDisturb;

    // Update local state immediately
    setDoNotDisturb(newValue);

    // If enabling DND, also disable silent notifications (since there won't be any notifications)
    if (newValue && silentNotifications) {
      setSilentNotifications(false);
      // Update silent notifications in database too
      updateSilentNotificationsAction(false);
    }

    // Update in database
    const result = await updateDoNotDisturbAction(newValue);

    if (result.success) {
      toast.success(
        newValue
          ? 'Alright, going ghost mode 👻'
          : "Back in action! Let's get those notifications 🔔"
      );
    } else {
      // Revert on error
      setDoNotDisturb(doNotDisturb);
      toast.error('Oops! Something went wrong with that toggle');
    }
  };

  const handleSilentModeToggle = async () => {
    const newValue = !silentNotifications;

    // Update local state immediately
    setSilentNotifications(newValue);

    // Update in database
    const result = await updateSilentNotificationsAction(newValue);

    if (result.success) {
      toast.success(
        newValue
          ? "Shhh... let's keep it quiet 🤫"
          : "Sound's back on! Let's make some noise 🔊"
      );
    } else {
      // Revert on error
      setSilentNotifications(silentNotifications);
      toast.error("Uh oh! Couldn't update the sound settings");
    }
  };

  const handleAccountSettings = () => {
    router.push('/dashboard/settings');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className='cta p-2.5 sm:p-3 rounded-xl border border-border 
                   shadow-sm hover:shadow-md transition-all duration-200 
                   focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 
                   flex items-center justify-center foldly-glass-shadow-bg bg-[foldly-glass-light] dark:bg-[foldly-glass]'
          aria-label='Open settings menu'
        >
          <Settings className='w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground' />
        </motion.button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className='context-menu w-72 mr-2 rounded-xl cta foldly-glass-light dark:foldly-glass'>
        <DropdownMenuGroup>
          <DropdownMenuLabel className='text-xs text-muted-foreground dark:text-white/50 px-2 py-1'>
            Theme
          </DropdownMenuLabel>

          <div className='px-2 pb-2'>
            <div className='context-menu-theme-selector'>
              <button
                onClick={() => handleThemeChange('light')}
                className={`context-menu-theme-button ${theme === 'light' ? 'active' : ''}`}
              >
                <Sun />
                <span>Light</span>
              </button>

              <button
                onClick={() => handleThemeChange('dark')}
                className={`context-menu-theme-button ${theme === 'dark' ? 'active' : ''}`}
              >
                <Moon />
                <span>Dark</span>
              </button>

              <button
                onClick={() => handleThemeChange('system')}
                className={`context-menu-theme-button ${theme === 'system' ? 'active' : ''}`}
              >
                <Monitor />
                <span>System</span>
              </button>
            </div>
          </div>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={e => e.preventDefault()}>
            <div
              className='flex items-center justify-between w-full cursor-pointer'
              onClick={handleDNDToggle}
            >
              <div className='flex items-center gap-2'>
                <BellOff size={16} className='opacity-60' />
                <span>Do not disturb</span>
              </div>
              <div 
                className='context-menu-toggle' 
                data-state={doNotDisturb ? 'checked' : 'unchecked'}
              >
                <div className='context-menu-toggle-thumb' />
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={e => e.preventDefault()}>
            <div
              className={`flex items-center justify-between w-full ${doNotDisturb ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={doNotDisturb ? undefined : handleSilentModeToggle}
              title={doNotDisturb ? 'Enable notifications first' : undefined}
            >
              <div className='flex items-center gap-2'>
                {silentNotifications ? (
                  <VolumeX size={16} className='opacity-60' />
                ) : (
                  <Volume2 size={16} className='opacity-60' />
                )}
                <span>Silent notifications</span>
              </div>
              <div 
                className='context-menu-toggle' 
                data-state={silentNotifications ? 'checked' : 'unchecked'}
                data-disabled={doNotDisturb ? '' : undefined}
              >
                <div className='context-menu-toggle-thumb' />
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleAccountSettings}
            className='cursor-pointer active:scale-[0.98] transition-transform'
          >
            <User size={16} className='opacity-60' />
            <span>Account settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
