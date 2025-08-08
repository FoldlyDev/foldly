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
  VolumeX
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTheme } from '@/lib/providers/theme-provider';
import { useUserSettingsStore } from '@/features/settings/store/user-settings-store';
import { 
  updateDoNotDisturbAction, 
  updateSilentNotificationsAction 
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
    isSaving 
  } = useUserSettingsStore();

  const handleThemeChange = async (newTheme: string) => {
    // The useTheme hook from theme-provider handles both local state and database sync
    setTheme(newTheme);
    
    const themeMessages = {
      light: "Let there be light! ☀️",
      dark: "Welcome to the dark side 🌙",
      system: "Going with the flow 🤖"
    };
    
    toast.success(themeMessages[newTheme as keyof typeof themeMessages] || `Switched to ${newTheme} mode`);
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
      toast.success(newValue 
        ? "Alright, going ghost mode 👻" 
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
      toast.success(newValue 
        ? "Shhh... let's keep it quiet 🤫" 
        : "Sound's back on! Let's make some noise 🔊"
      );
    } else {
      // Revert on error
      setSilentNotifications(silentNotifications);
      toast.error('Uh oh! Couldn\'t update the sound settings');
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
          className='p-2.5 sm:p-3 rounded-xl bg-card border border-border 
                   shadow-sm hover:shadow-md transition-all duration-200 
                   focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 
                   flex items-center justify-center'
          aria-label="Open settings menu"
        >
          <Settings className='w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground' />
        </motion.button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-72 mr-2 dark:foldly-glass-solid">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground dark:text-white/50 px-2 py-1">
            Theme
          </DropdownMenuLabel>
          
          <div className="px-2 pb-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted dark:bg-white/5">
              <button
                onClick={() => handleThemeChange('light')}
                className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'light' 
                    ? 'bg-primary dark:bg-white/20 shadow-sm text-primary-foreground dark:text-white' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Light</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('dark')}
                className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'dark' 
                    ? 'bg-primary dark:bg-white/20 shadow-sm text-primary-foreground dark:text-white' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Dark</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('system')}
                className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'system' 
                    ? 'bg-primary dark:bg-white/20 shadow-sm text-primary-foreground dark:text-white' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">System</span>
              </button>
            </div>
          </div>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <div 
              className="flex items-center justify-between w-full cursor-pointer"
              onClick={handleDNDToggle}
            >
              <div className="flex items-center gap-2">
                <BellOff size={16} className="opacity-60" />
                <span>Do not disturb</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={doNotDisturb ? 'on' : 'off'}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`w-10 h-5 rounded-full relative transition-colors ${
                    doNotDisturb ? 'bg-muted dark:bg-white/10' : 'bg-muted dark:bg-white/5'
                  }`}
                >
                  <motion.div
                    animate={{ x: doNotDisturb ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`w-4 h-4 rounded-full absolute top-0.5 left-0.5 shadow-sm transition-colors ${
                      doNotDisturb ? 'bg-primary dark:bg-primary' : 'bg-gray-400 dark:bg-gray-500'
                    }`}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <div 
              className={`flex items-center justify-between w-full ${doNotDisturb ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={doNotDisturb ? undefined : handleSilentModeToggle}
              title={doNotDisturb ? "Enable notifications first" : undefined}
            >
              <div className="flex items-center gap-2">
                {silentNotifications ? <VolumeX size={16} className="opacity-60" /> : <Volume2 size={16} className="opacity-60" />}
                <span>Silent notifications</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={silentNotifications ? 'on' : 'off'}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`w-10 h-5 rounded-full relative transition-colors ${
                    doNotDisturb 
                      ? 'bg-gray-200 dark:bg-gray-700' 
                      : silentNotifications 
                        ? 'bg-muted dark:bg-white/10' 
                        : 'bg-muted dark:bg-white/5'
                  }`}
                >
                  <motion.div
                    animate={{ x: silentNotifications && !doNotDisturb ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`w-4 h-4 rounded-full absolute top-0.5 left-0.5 shadow-sm transition-colors ${
                      doNotDisturb 
                        ? 'bg-gray-400 dark:bg-gray-600' 
                        : silentNotifications 
                          ? 'bg-primary dark:bg-primary' 
                          : 'bg-gray-400 dark:bg-gray-500'
                    }`}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={handleAccountSettings}
            className="cursor-pointer active:scale-[0.98] transition-transform"
          >
            <User size={16} className="opacity-60" />
            <span>Account settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}