'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/core/shadcn/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/core/shadcn/form';
import { Input } from '@/components/ui/core/shadcn/input';
import { Button } from '@/components/ui/core/shadcn/button';
import { Textarea } from '@/components/ui/core/shadcn/textarea';
import { Alert, AlertDescription } from '@/components/ui/core/shadcn/alert';
import { useUploadStore } from '../../stores/upload-store';
import { validateLinkPasswordAction } from '../../lib/actions/validate-password';
import type { LinkWithOwner } from '../../types';

const authSchema = z.object({
  uploaderName: z.string().min(2, 'Name must be at least 2 characters'),
  uploaderEmail: z.string().email('Invalid email address').optional(),
  uploaderMessage: z.string().max(500, 'Message too long').optional(),
  password: z.string().optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

interface AuthenticationModalProps {
  link: LinkWithOwner;
  onAuthenticate: () => void;
  onCancel: () => void;
}

export function AuthenticationModal({
  link,
  onAuthenticate,
  onCancel,
}: AuthenticationModalProps) {
  const { session, setSession } = useUploadStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      uploaderName: session?.uploaderName || '',
      uploaderEmail: session?.uploaderEmail || '',
      uploaderMessage: session?.uploaderMessage || '',
      password: '',
    },
  });

  const onSubmit = async (data: AuthFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      // Validate password if required
      if (link.require_password) {
        if (!data.password) {
          setError('Password is required');
          setIsLoading(false);
          return;
        }

        const validation = await validateLinkPasswordAction({
          linkId: link.id,
          password: data.password,
        });

        if (!validation.success || !validation.data?.isValid) {
          setError('Invalid password');
          setIsLoading(false);
          return;
        }
      }

      // Validate email if required
      if (link.require_email && !data.uploaderEmail) {
        setError('Email is required');
        setIsLoading(false);
        return;
      }

      // Update session
      setSession({
        linkId: link.id,
        uploaderName: data.uploaderName,
        uploaderEmail: data.uploaderEmail,
        uploaderMessage: data.uploaderMessage,
        authenticated: true,
      });

      onAuthenticate();
    } catch (err) {
      setError('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Information</DialogTitle>
          <DialogDescription>
            Please provide your information to upload files to this link.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="uploaderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {link.require_email && (
              <FormField
                control={form.control}
                name="uploaderEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="uploaderMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a message..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {link.require_password && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Continue'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}