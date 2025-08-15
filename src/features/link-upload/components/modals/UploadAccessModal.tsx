'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/core/shadcn';
import { Button } from '@/components/ui/core/shadcn';
import { Input } from '@/components/ui/core/shadcn';
import { Label } from '@/components/ui/core/shadcn';
import { AlertCircle, Lock, Mail, User } from 'lucide-react';
import { validateEmail } from '@/lib/utils/validation';
import { useStagingStore } from '../../stores/staging-store';
import type { LinkWithOwner, UploadSession } from '../../types';

interface UploadAccessModalProps {
  isOpen: boolean;
  linkData: LinkWithOwner;
  onAccessGranted: (session: UploadSession) => void;
}

export function UploadAccessModal({
  isOpen,
  linkData,
  onAccessGranted,
}: UploadAccessModalProps) {
  const [uploaderName, setUploaderName] = useState('');
  const [uploaderEmail, setUploaderEmail] = useState('');
  const [password, setPassword] = useState('');
  const [uploaderMessage, setUploaderMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Get the staging store setter
  const { setUploaderInfo } = useStagingStore();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Name is always required
    if (!uploaderName.trim()) {
      newErrors.name = 'We\'d love to know what to call you!';
    }

    // Email validation if required
    if (linkData.requireEmail) {
      if (!uploaderEmail.trim()) {
        newErrors.email = 'Mind sharing your email? It helps keep things organized!';
      } else if (!validateEmail(uploaderEmail)) {
        newErrors.email = 'Hmm, that email looks a bit off. Can you double-check?';
      }
    }

    // Password validation if required
    if (linkData.requirePassword) {
      if (!password.trim()) {
        newErrors.password = 'Need that magic word to get you in!';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // If password is required, validate it first
      if (linkData.requirePassword && password) {
        const response = await fetch('/api/link-upload/validate-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            linkId: linkData.id,
            password,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setErrors({ password: errorData.error || 'Invalid password' });
          return;
        }

        const { isValid } = await response.json();
        if (!isValid) {
          setErrors({ password: 'Oops! That doesn\'t seem right. Give it another shot?' });
          return;
        }
      }

      // Create upload session
      const session: UploadSession = {
        linkId: linkData.id,
        uploaderName: uploaderName.trim(),
        uploaderEmail: linkData.requireEmail ? uploaderEmail.trim() : undefined,
        uploaderMessage: uploaderMessage.trim() || undefined,
        authenticated: true,
      };
      
      // Update the staging store with uploader info
      setUploaderInfo({
        name: uploaderName.trim(),
        email: linkData.requireEmail ? uploaderEmail.trim() : undefined,
        message: uploaderMessage.trim() || undefined,
      });

      onAccessGranted(session);
    } catch (error) {
      console.error('Access validation failed:', error);
      setErrors({ form: 'Access validation failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const showEmailField = linkData.requireEmail;
  const showPasswordField = linkData.requirePassword;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent 
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">
            Hey there! 👋
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Welcome to
            </p>
            <h2 
              className="text-2xl font-bold"
              style={{
                color: linkData.branding?.enabled && linkData.branding?.color 
                  ? linkData.branding.color 
                  : undefined,
                background: !linkData.branding?.enabled || !linkData.branding?.color 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : undefined,
                WebkitBackgroundClip: !linkData.branding?.enabled || !linkData.branding?.color 
                  ? 'text' 
                  : undefined,
                WebkitTextFillColor: !linkData.branding?.enabled || !linkData.branding?.color 
                  ? 'transparent' 
                  : undefined,
                backgroundClip: !linkData.branding?.enabled || !linkData.branding?.color 
                  ? 'text' 
                  : undefined
              }}
            >
              {linkData.title || 'Upload Space'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Just need a few quick details and you'll be all set to share your files!
            </p>
          </div>

          {errors.form && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field - Always Required */}
            <div className="space-y-2">
              <Label htmlFor="uploaderName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                What should we call you?
              </Label>
              <Input
                id="uploaderName"
                type="text"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                placeholder="Your name or nickname"
                className={errors.name ? 'border-red-500' : ''}
                maxLength={100}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email Field - Only if Required */}
            {showEmailField && (
              <div className="space-y-2">
                <Label htmlFor="uploaderEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Drop your email
                </Label>
                <Input
                  id="uploaderEmail"
                  type="email"
                  value={uploaderEmail}
                  onChange={(e) => setUploaderEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            )}

            {/* Password Field - Only if Required */}
            {showPasswordField && (
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Got the magic word?
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter the access code"
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            )}

            {/* Optional Message Field */}
            <div className="space-y-2">
              <Label htmlFor="uploaderMessage">
                Want to say something? (optional)
              </Label>
              <Input
                id="uploaderMessage"
                type="text"
                value={uploaderMessage}
                onChange={(e) => setUploaderMessage(e.target.value)}
                placeholder={`drop a lil note for ${linkData.owner.username || 'the owner'} - no cap, they\'ll appreciate it 💯`}
                maxLength={500}
              />
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Getting you set up...' : "Let's go! 🚀"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}