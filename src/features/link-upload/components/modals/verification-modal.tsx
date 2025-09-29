'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/animate-ui/radix/dialog';
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
  onVerificationComplete: (data: {
    uploaderName: string;
    uploaderEmail?: string;
    password?: string;
  }) => void;
  linkData: LinkWithStats;
}

export function VerificationModal({
  isOpen,
  onClose,
  onVerificationComplete,
  linkData,
}: VerificationModalProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  // Get staging store stats
  const { getStagedFileCount, getTotalStagedSize, hasAnyStaged } = useLinkUploadStagingStore();

  // Create schema based on link requirements
  const schema = createVerificationSchema(
    linkData.requireEmail,
    linkData.requirePassword
  );
  
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setVerificationError(null);
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsVerifying(true);
      setVerificationError(null);

      // If password is required, validate it first
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
      <DialogContent className="flex flex-col max-h-[90vh] h-auto overflow-hidden">
        {/* Modal Header */}
        <div className='modal-header p-4 sm:p-6 border-b shrink-0'>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Send className="h-5 w-5" />
            Verify Your Information
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-muted-foreground">
            Please provide the required information to send your files.
            {stagingStats.hasFiles && (
              <span className="block mt-2 font-medium">
                Ready to send: {stagingStats.fileCount} file{stagingStats.fileCount !== 1 ? 's' : ''} ({formatBytes(stagingStats.totalSize)})
              </span>
            )}
          </DialogDescription>
        </div>

        {/* Modal Body */}
        <div className='modal-body flex-1 overflow-y-auto p-4 sm:p-6'>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="verification-form">
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
                <p className="text-sm text-red-500">{errors.uploaderName.message}</p>
              )}
            </div>

            {/* Email field - conditionally required */}
            {linkData.requireEmail && (
              <div className="space-y-2">
                <Label htmlFor="uploaderEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Your Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="uploaderEmail"
                  type="email"
                  placeholder="Enter your email address"
                  {...register('uploaderEmail' as any)}
                  disabled={isVerifying}
                />
                {errors.uploaderEmail && (
                  <p className="text-sm text-red-500">{errors.uploaderEmail.message}</p>
                )}
              </div>
            )}

            {/* Password field - conditionally required */}
            {linkData.requirePassword && (
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter the password"
                  {...register('password' as any)}
                  disabled={isVerifying}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
            )}

            {/* Error alert */}
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
                  Please select files before proceeding with verification.
                </AlertDescription>
              </Alert>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className='modal-footer mt-auto p-4 sm:p-6 border-t shrink-0'>
          <div className='flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3'>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isVerifying}
              className='w-full sm:w-auto min-w-0 sm:min-w-[100px]'
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              form="verification-form"
              disabled={isVerifying || !stagingStats.hasFiles}
              className='w-full sm:w-auto min-w-0 sm:min-w-[140px] gap-2'
            >
              {isVerifying ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Verifying...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Continue to Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}