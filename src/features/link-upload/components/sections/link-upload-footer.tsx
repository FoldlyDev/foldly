'use client';

import { motion } from 'framer-motion';
import { useUserPlan } from '../../hooks/use-user-plan';

export function LinkUploadFooter() {
  const { requiresBranding } = useUserPlan();

  // Don't render footer for pro/business users
  if (!requiresBranding) {
    return null;
  }

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="border-t bg-muted/5 mt-auto"
    >
      <div className="container mx-auto px-4 py-6 pb-16 sm:pb-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left side - Powered by */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Powered by</span>
            <a 
              href="https://foldly.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Foldly
            </a>
          </div>

          {/* Center - Tagline */}
          <div className="text-xs text-muted-foreground text-center">
            Simple file sharing for everyone
          </div>

          {/* Right side - Links */}
          <div className="flex items-center gap-4 text-xs">
            <a 
              href="https://foldly.com/privacy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </a>
            <a 
              href="https://foldly.com/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}