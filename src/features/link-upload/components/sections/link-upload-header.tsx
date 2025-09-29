'use client';

import { motion } from 'framer-motion';
import { 
  Upload, 
  User, 
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { LinkWithStats } from '@/lib/database/types/links';

interface LinkUploadHeaderProps {
  link: LinkWithStats;
}

export function LinkUploadHeader({ link }: LinkUploadHeaderProps) {
  const brandColor = link.branding?.enabled && link.branding?.color ? link.branding.color : '#3b82f6';

  // Calculate if link is expired
  const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="border-b bg-gradient-to-r from-background to-muted/30"
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-col items-center text-center">
          {/* Centered title with icon */}
          <div className="flex items-center gap-3 mb-2">
            {/* Brand/Upload Icon */}
            <div 
              className="p-3 rounded-xl shadow-lg flex-shrink-0"
              style={{ 
                background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)`,
                color: 'white'
              }}
            >
              <Upload className="h-6 w-6" />
            </div>
            
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">
              {link.title || link.slug || 'Upload Link'}
            </h1>
          </div>
          
          {/* Description if present */}
          {link.description && (
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto line-clamp-2 mb-2">
              {link.description}
            </p>
          )}

          {/* User and expiration info */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            {link.username && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                by {link.username.charAt(0).toUpperCase() + link.username.slice(1)}
              </span>
            )}

            {link.expiresAt && (
              <span className={`flex items-center gap-1 ${isExpired ? 'text-red-600' : ''}`}>
                <Clock className="h-4 w-4" />
                {isExpired ? 'expired' : `expires ${formatDistanceToNow(new Date(link.expiresAt), { addSuffix: true })}`}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}