'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/core/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/core/shadcn/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to your error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gradient-subtle p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-destructive'>
            Something went wrong!
          </CardTitle>
          <CardDescription>
            We encountered an unexpected error. Please try again or contact
            support if the problem persists.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <div className='text-sm text-muted-foreground bg-muted p-3 rounded-md'>
            <p className='font-medium'>Error details:</p>
            <p className='mt-1 break-words'>{error.message}</p>
            {error.digest && (
              <p className='mt-1 text-xs'>Error ID: {error.digest}</p>
            )}
          </div>
          <div className='flex gap-2'>
            <Button onClick={() => reset()} className='flex-1'>
              Try again
            </Button>
            <Button
              variant='outline'
              onClick={() => (window.location.href = '/')}
              className='flex-1'
            >
              Go home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
