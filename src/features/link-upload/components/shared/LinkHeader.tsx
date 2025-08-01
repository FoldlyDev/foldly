'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/core/shadcn/button';
import type { LinkWithOwner } from '../../types';

interface LinkHeaderProps {
  link: LinkWithOwner;
}

export function LinkHeader({ link }: LinkHeaderProps) {
  const brandColor = link.brand_enabled && link.brand_color 
    ? link.brand_color 
    : undefined;

  return (
    <header 
      className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      style={{
        borderBottomColor: brandColor,
      }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div>
              <h1 
                className="text-lg font-semibold"
                style={{ color: brandColor }}
              >
                {link.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                by {link.owner.username}
              </p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Powered by Foldly
          </div>
        </div>
      </div>
    </header>
  );
}