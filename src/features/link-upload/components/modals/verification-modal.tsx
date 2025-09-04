'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/shadcn/dialog';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { AlertCircle, Send, User, Mail, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import { useLinkUploadStagingStore } from '../../stores/staging-store';
import type { LinkWithStats } from '@/lib/database/types/links';
import { eventBus, NotificationEventType } from '@/features/notifications/core';

// Validation schema - dynamically built based on link requirements
const createVerificationSchema = (requireEmail: boolean, requirePassword: boolean) => {
  const baseSchema = {
    uploaderName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  };

  const emailSchema = requireEmail ? {
    uploaderEmail: z.string().email('Please enter a valid email address'),
  } : {};

  const passwordSchema = requirePassword ? {
    password: z.string().min(1, 'Password is required'),
  } : {};

  return z.object({
    ...baseSchema,
    ...emailSchema,
    ...passwordSchema,
  });
};

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkData: LinkWithStats;
  onVerificationComplete: (data: {
    uploaderName: string;
    uploaderEmail?: string;
    password?: string;
  }) => void;
}

export function VerificationModal({
  isOpen,
  onClose,
  linkData,
  onVerificationComplete,
}: VerificationModalProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  const { getStagedFileCount, getTotalStagedSize, hasAnyStaged } = useLinkUploadStagingStore();
  
  // Create schema based on link requirements
  const schema = createVerificationSchema(linkData.requireEmail, linkData.requirePassword);
  type FormData = z.infer<typeof schema>;
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setFocus,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset();
      setVerificationError(null);
      // Focus on first field after a small delay to ensure modal is rendered
      setTimeout(() => {
        setFocus('uploaderName');
      }, 100);
    }
  }, [isOpen, reset, setFocus]);

  const onSubmit = async (data: FormData) => {
    setIsVerifying(true);
    setVerificationError(null);

    try {
      // If password is required, verify it first
      if (linkData.requirePassword && 'password' in data && data.password) {
        const response = await fetch(`/api/link-upload/validate-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            linkId: linkData.id,
            password: data.password,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          setVerificationError(result.error || 'Invalid password');
          setIsVerifying(false);
          return;
        }
      }

      // Verification successful, proceed with upload
      const verificationData: {
        uploaderName: string;
        uploaderEmail?: string;
        password?: string;
      } = {
        uploaderName: data.uploaderName,
      };
      
      if ('uploaderEmail' in data && data.uploaderEmail) {
        verificationData.uploaderEmail = data.uploaderEmail as string;
      }
      
      if ('password' in data && data.password) {
        verificationData.password = data.password as string;
      }
      
      onVerificationComplete(verificationData);

      // Log success (notification type doesn't exist yet)
      console.log('Verification successful', {
        uploaderName: data.uploaderName,
        fileCount: getStagedFileCount(),
      });

      // Close modal and reset
      onClose();
      reset();
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Calculate staging stats
  const stagingStats = {
    fileCount: getStagedFileCount(),
    totalSize: getTotalStagedSize(),
    hasFiles: hasAnyStaged(),
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Verify Your Information
          </DialogTitle>
          <DialogDescription>
            Please provide the required information to send your files.
            {stagingStats.hasFiles && (
              <span className="block mt-2 font-medium">
                Ready to send: {stagingStats.fileCount} file{stagingStats.fileCount !== 1 ? 's' : ''} ({formatBytes(stagingStats.totalSize)})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Name field - always required */}
          <div className="space-y-2">
            <Label htmlFor="uploaderName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Your Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="uploaderName"
              placeholder="Enter your full name"
              {...register('uploaderName')}
              disabled={isVerifying}
            />
            {errors.uploaderName && (
              <p className="text-sm text-destructive">{errors.uploaderName.message}</p>
            )}
          </div>

          {/* Email field - conditional */}
          {linkData.requireEmail && (
            <div className="space-y-2">
              <Label htmlFor="uploaderEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="uploaderEmail"
                type="email"
                placeholder="your@email.com"
                {...register('uploaderEmail' as const)}
                disabled={isVerifying}
              />
              {'uploaderEmail' in errors && errors.uploaderEmail && (
                <p className="text-sm text-destructive">{errors.uploaderEmail.message}</p>
              )}
            </div>
          )}

          {/* Password field - conditional */}
          {linkData.requirePassword && (
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Access Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter the link password"
                {...register('password' as const)}
                disabled={isVerifying}
              />
              {'password' in errors && errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                This link is password protected. Enter the password provided by the link owner.
              </p>
            </div>
          )}

          {/* Error message */}
          {verificationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{verificationError}</AlertDescription>
            </Alert>
          )}

          {/* No files warning */}
          {!stagingStats.hasFiles && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No files staged for upload. Please add files before sending.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isValid || isVerifying || !stagingStats.hasFiles}
              className="flex items-center gap-2"
            >
              {isVerifying ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Verifying...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Files
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}