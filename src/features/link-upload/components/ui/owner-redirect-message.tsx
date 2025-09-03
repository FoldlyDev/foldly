'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ExternalLink, Settings } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import Link from 'next/link';

interface OwnerRedirectMessageProps {
  linkTitle: string;
  linkSlug: string;
}

export function OwnerRedirectMessage({ 
  linkTitle, 
  linkSlug 
}: OwnerRedirectMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background/95 to-muted/30"
    >
      <div className="max-w-md w-full">
        <div className="bg-card border rounded-xl shadow-lg p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-primary/10">
              <AlertCircle className="h-10 w-10 text-primary" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-3">
            You Own This Link
          </h2>

          {/* Link Name */}
          <p className="text-center text-muted-foreground mb-6">
            <span className="font-medium text-foreground">{linkTitle}</span>
          </p>

          {/* Message */}
          <div className="space-y-3 text-sm text-muted-foreground mb-8">
            <p>
              As the owner of this link, you cannot upload files to it yourself.
            </p>
            <p>
              To manage your link settings, view uploaded files, or edit link properties, 
              please visit your dashboard.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link href="/dashboard/links">
                <Settings className="mr-2 h-4 w-4" />
                Go to Links Dashboard
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="outline" 
              className="w-full" 
              size="lg"
            >
              <Link href={`/dashboard/links/${linkSlug}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Link Details
              </Link>
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-center text-muted-foreground">
              Share this link with others to allow them to upload files to your workspace.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}