'use client';

import React, { useState, useMemo } from 'react';
import { useUser, useReverification } from '@clerk/nextjs';
import {
  isClerkRuntimeError,
  isReverificationCancelledError,
} from '@clerk/clerk-react/errors';
import { Button } from '@/components/ui/shadcn/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import { BiLogoMicrosoft } from 'react-icons/bi';
import {
  showWorkspaceNotification,
  showWorkspaceError,
} from '@/features/notifications/utils';

interface CloudProviderButtonsProps {
  className?: string;
}

export function CloudProviderButtons({ className }: CloudProviderButtonsProps) {
  const { user } = useUser();
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  // Memoize connection status checks
  const connectionStatus = useMemo(() => {
    if (!user?.externalAccounts) return { google: false, microsoft: false };

    return {
      google: user.externalAccounts.some(
        account => account.provider === 'oauth_google'
      ),
      microsoft: user.externalAccounts.some(
        account => account.provider === 'oauth_microsoft'
      ),
    };
  }, [user?.externalAccounts]);

  // Create re-verification enhanced connection functions
  const connectGoogleWithReverification = useReverification(async () => {
    if (!user) return;

    // Double-check if already connected to prevent duplicate connection error
    const alreadyConnected = user.externalAccounts?.some(
      account => account.provider === 'oauth_google'
    );

    if (alreadyConnected) {
      showWorkspaceNotification('cloud_already_connected', {
        itemName: 'Google Drive',
        itemType: 'cloud_provider',
      });
      return;
    }

    const redirectUrl = `${window.location.origin}/dashboard/workspace?connected=google`;
    await user.createExternalAccount({
      strategy: 'oauth_google',
      redirectUrl,
    });
  });

  const connectOneDriveWithReverification = useReverification(async () => {
    if (!user) return;

    // Double-check if already connected to prevent duplicate connection error
    const alreadyConnected = user.externalAccounts?.some(
      account => account.provider === 'oauth_microsoft'
    );

    if (alreadyConnected) {
      showWorkspaceNotification('cloud_already_connected', {
        itemName: 'OneDrive',
        itemType: 'cloud_provider',
      });
      return;
    }

    const redirectUrl = `${window.location.origin}/dashboard/workspace?connected=microsoft`;
    await user.createExternalAccount({
      strategy: 'oauth_microsoft',
      redirectUrl,
    });
  });

  const handleConnectGoogle = async () => {
    // Early return if already connected - don't trigger reverification
    if (connectionStatus.google) {
      showWorkspaceNotification('cloud_already_connected', {
        itemName: 'Google Drive',
        itemType: 'cloud_provider',
      });
      return;
    }

    if (!user) {
      showWorkspaceError(
        'cloud_connection_failed',
        {
          itemName: 'Google Drive',
          itemType: 'cloud_provider',
        },
        'User session not found'
      );
      return;
    }

    try {
      setIsConnecting('google');
      await connectGoogleWithReverification();
      // Success toast will be shown after redirect when connection is complete
    } catch (error: any) {
      if (isClerkRuntimeError(error) && isReverificationCancelledError(error)) {
        showWorkspaceError(
          'cloud_verification_cancelled',
          {
            itemName: 'Google Drive',
            itemType: 'cloud_provider',
          },
          'Please verify your identity to connect'
        );
      } else if (error.message?.includes('already connected')) {
        showWorkspaceNotification('cloud_already_connected', {
          itemName: 'Google Drive',
          itemType: 'cloud_provider',
        });
      } else {
        showWorkspaceError(
          'cloud_connection_failed',
          {
            itemName: 'Google Drive',
            itemType: 'cloud_provider',
          },
          'Please try again or contact support if the issue persists'
        );
        console.error('Failed to connect Google Drive:', error);
      }
    } finally {
      setIsConnecting(null);
    }
  };

  const handleConnectOneDrive = async () => {
    // Early return if already connected - don't trigger reverification
    if (connectionStatus.microsoft) {
      showWorkspaceNotification('cloud_already_connected', {
        itemName: 'OneDrive',
        itemType: 'cloud_provider',
      });
      return;
    }

    if (!user) {
      showWorkspaceError(
        'cloud_connection_failed',
        {
          itemName: 'OneDrive',
          itemType: 'cloud_provider',
        },
        'User session not found'
      );
      return;
    }

    try {
      setIsConnecting('microsoft');
      await connectOneDriveWithReverification();
      // Success toast will be shown after redirect when connection is complete
    } catch (error: any) {
      if (isClerkRuntimeError(error) && isReverificationCancelledError(error)) {
        showWorkspaceError(
          'cloud_verification_cancelled',
          {
            itemName: 'OneDrive',
            itemType: 'cloud_provider',
          },
          'Please verify your identity to connect'
        );
      } else if (error.message?.includes('already connected')) {
        showWorkspaceNotification('cloud_already_connected', {
          itemName: 'OneDrive',
          itemType: 'cloud_provider',
        });
      } else {
        showWorkspaceError(
          'cloud_connection_failed',
          {
            itemName: 'OneDrive',
            itemType: 'cloud_provider',
          },
          'Please try again or contact support if the issue persists'
        );
        console.error('Failed to connect OneDrive:', error);
      }
    } finally {
      setIsConnecting(null);
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Google Drive Button */}
      <Button
        variant={connectionStatus.google ? 'default' : 'outline'}
        size='icon'
        onClick={handleConnectGoogle}
        disabled={isConnecting === 'google'}
        className={cn(
          'h-10 w-10 relative',
          connectionStatus.google && 'bg-green-600 hover:bg-green-700'
        )}
        title={
          connectionStatus.google
            ? 'Google Drive Connected'
            : 'Connect Google Drive'
        }
      >
        {isConnecting === 'google' ? (
          <Loader2 className='h-5 w-5 animate-spin' />
        ) : (
          <FaGoogle className='h-4 w-4' />
        )}
        {connectionStatus.google && (
          <div className='absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background' />
        )}
      </Button>

      {/* OneDrive Button */}
      <Button
        variant={connectionStatus.microsoft ? 'default' : 'outline'}
        size='icon'
        onClick={handleConnectOneDrive}
        disabled={isConnecting === 'microsoft'}
        className={cn(
          'h-10 w-10 relative',
          connectionStatus.microsoft && 'bg-blue-600 hover:bg-blue-700'
        )}
        title={
          connectionStatus.microsoft ? 'OneDrive Connected' : 'Connect OneDrive'
        }
      >
        {isConnecting === 'microsoft' ? (
          <Loader2 className='h-5 w-5 animate-spin' />
        ) : (
          <BiLogoMicrosoft className='h-5 w-5' />
        )}
        {connectionStatus.microsoft && (
          <div className='absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full border-2 border-background' />
        )}
      </Button>
    </div>
  );
}
