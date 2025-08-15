'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/core/shadcn/switch';

interface LinkPasswordProtectionProps {
  formData: {
    requirePassword?: boolean;
    password?: string;
  };
  onDataChange: (data: any) => void;
  isLoading?: boolean;
}

export function LinkPasswordProtection({
  formData,
  onDataChange,
  isLoading = false,
}: LinkPasswordProtectionProps) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className='space-y-3'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <Lock className='h-4 w-4 text-primary' />
            <label className='form-label mb-0'>
              Password Protection
            </label>
          </div>
          <p className='form-helper text-xs'>
            Require a password to access this link
          </p>
        </div>
        <Switch
          checked={formData.requirePassword || false}
          onCheckedChange={checked =>
            onDataChange({ requirePassword: checked })
          }
          disabled={isLoading}
          className='data-[state=unchecked]:bg-muted-foreground/20 cursor-pointer'
        />
      </div>

      {/* Password Input - Shown when password protection is enabled */}
      {formData.requirePassword && (
        <div className='space-y-2 pl-6'>
          <div className='relative'>
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password || ''}
              onChange={e => {
                onDataChange({ password: e.target.value });
              }}
              placeholder='Enter password (8+ characters)'
              disabled={isLoading}
              className={`premium-input pr-10 ${
                formData.password && formData.password.length < 8
                  ? 'form-input-error'
                  : ''
              }`}
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50'
            >
              {showPassword ? (
                <EyeOff className='w-4 h-4' />
              ) : (
                <Eye className='w-4 h-4' />
              )}
            </button>
          </div>
          {formData.password && formData.password.length < 8 && (
            <p className='text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1'>
              <span>⚠️</span>
              Password must be at least 8 characters long
            </p>
          )}
          <p className='form-helper text-xs'>
            Visitors will need this password to access your link
          </p>
        </div>
      )}
    </div>
  );
}
