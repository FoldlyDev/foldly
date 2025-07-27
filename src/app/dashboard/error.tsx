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

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className='flex flex-col items-center justify-center min-h-[60vh] p-4'>
      <Card className='w-full max-w-lg'>
        <CardHeader className='text-center'>
          <CardTitle className='text-destructive'>Dashboard Error</CardTitle>
          <CardDescription>
            We couldn't load your dashboard. This might be a temporary issue.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <div className='text-sm text-muted-foreground bg-muted p-3 rounded-md'>
            <p className='font-medium'>What happened:</p>
            <p className='mt-1 break-words'>{error.message}</p>
          </div>
          <div className='flex gap-2'>
            <Button onClick={() => reset()} className='flex-1'>
              Try again
            </Button>
            <Button
              variant='outline'
              onClick={() => (window.location.href = '/dashboard/workspace')}
              className='flex-1'
            >
              Go to home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
