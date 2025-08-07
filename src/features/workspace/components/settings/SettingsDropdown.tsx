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
import { useUserSettingsStore, type ThemeMode } from '@/features/settings/store/user-settings-store';
import { 
  updateThemeAction, 
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
  const { 
    theme, 
    doNotDisturb, 
    silentNotifications, 
    setTheme, 
    setDoNotDisturb, 
    setSilentNotifications,
    isSaving 
  } = useUserSettingsStore();

  const handleThemeChange = async (newTheme: ThemeMode) => {
    // Update local state immediately for responsive UI
    setTheme(newTheme);
    
    // Update in database
    const result = await updateThemeAction(newTheme);
    
    if (result.success) {
      toast.success(`Theme changed to ${newTheme} mode`);
    } else {
      // Revert on error
      setTheme(theme);
      toast.error('Failed to update theme');
    }
  };

  const handleDNDToggle = async () => {
    const newValue = !doNotDisturb;
    
    // Update local state immediately
    setDoNotDisturb(newValue);
    
    // Update in database
    const result = await updateDoNotDisturbAction(newValue);
    
    if (result.success) {
      toast.success(newValue ? 'Do not disturb enabled' : 'Notifications enabled');
    } else {
      // Revert on error
      setDoNotDisturb(doNotDisturb);
      toast.error('Failed to update do not disturb');
    }
  };

  const handleSilentModeToggle = async () => {
    const newValue = !silentNotifications;
    
    // Update local state immediately
    setSilentNotifications(newValue);
    
    // Update in database
    const result = await updateSilentNotificationsAction(newValue);
    
    if (result.success) {
      toast.success(newValue ? 'Silent notifications enabled' : 'Notification sounds enabled');
    } else {
      // Revert on error
      setSilentNotifications(silentNotifications);
      toast.error('Failed to update silent notifications');
    }
  };

  const handleAccountSettings = () => {
    router.push('/settings/account');
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
      
      <DropdownMenuContent className="w-72 mr-2">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
            Theme
          </DropdownMenuLabel>
          
          <div className="px-2 pb-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted">
              <button
                onClick={() => handleThemeChange('light')}
                className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  theme === 'light' 
                    ? 'bg-primary shadow-sm text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Light</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('dark')}
                className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  theme === 'dark' 
                    ? 'bg-primary shadow-sm text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Dark</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('system')}
                className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  theme === 'system' 
                    ? 'bg-primary shadow-sm text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
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
          <DropdownMenuItem onClick={handleDNDToggle}>
            <div className="flex items-center justify-between w-full">
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
                    doNotDisturb ? 'bg-[var(--primary)]' : 'bg-[var(--neutral-300)]'
                  }`}
                >
                  <motion.div
                    animate={{ x: doNotDisturb ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-4 h-4 bg-background rounded-full absolute top-0.5 left-0.5 shadow-sm"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleSilentModeToggle}>
            <div className="flex items-center justify-between w-full">
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
                    silentNotifications ? 'bg-[var(--primary)]' : 'bg-[var(--neutral-300)]'
                  }`}
                >
                  <motion.div
                    animate={{ x: silentNotifications ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-4 h-4 bg-background rounded-full absolute top-0.5 left-0.5 shadow-sm"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleAccountSettings}>
            <User size={16} className="opacity-60" />
            <span>Account settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}