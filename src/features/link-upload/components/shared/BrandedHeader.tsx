'use client';

import { Sparkles } from 'lucide-react';
import type { LinkWithStats } from '@/lib/database/types/links';

interface BrandedHeaderProps {
  link: LinkWithStats;
}

export function BrandedHeader({ link }: BrandedHeaderProps) {
  return (
    <header 
      className="relative overflow-hidden border-b backdrop-blur-sm"
      style={{
        background: 'linear-gradient(to bottom, var(--brand-primary-light), transparent)',
        borderBottomColor: 'var(--brand-primary-medium)',
      }}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, var(--brand-primary-medium) 0%, transparent 50%),
                              radial-gradient(circle at 80% 80%, var(--brand-primary-light) 0%, transparent 50%),
                              radial-gradient(circle at 40% 20%, var(--brand-primary-light) 0%, transparent 50%)`,
            animation: 'float 20s ease-in-out infinite',
          }}
        />
      </div>

      <div className="relative container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          {/* Main title with brand color */}
          <h1 
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight"
            style={{ color: 'var(--brand-primary)' }}
          >
            {link.title}
          </h1>
          
          {/* Description if available */}
          {link.description && (
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {link.description}
            </p>
          )}

          {/* Welcome message */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
            <span>Share your files securely</span>
            <Sparkles className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
          </div>
        </div>
      </div>

      {/* Subtle branding */}
      <div className="absolute bottom-2 right-4 text-xs text-muted-foreground/50">
        Powered by Foldly
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(1deg); }
          66% { transform: translateY(5px) rotate(-1deg); }
        }
      `}</style>
    </header>
  );
}