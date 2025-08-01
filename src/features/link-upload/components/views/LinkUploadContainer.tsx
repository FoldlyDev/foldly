'use client';

import { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { LinkUploadDesktop } from '../desktop/LinkUploadDesktop';
import { LinkUploadMobile } from '../mobile/LinkUploadMobile';
import { AuthenticationModal } from '../modals/AuthenticationModal';
import { useUploadStore } from '../../stores/upload-store';
import { useUploadSession } from '../../hooks/use-upload-session';
import type { LinkWithOwner } from '../../types';

interface LinkUploadContainerProps {
  linkData: LinkWithOwner;
}

export function LinkUploadContainer({ linkData }: LinkUploadContainerProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { session, setSession } = useUploadStore();
  const { initializeSession } = useUploadSession();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Initialize upload session
    initializeSession(linkData);

    // Check if authentication is required
    if (linkData.require_password || linkData.require_email) {
      setShowAuth(true);
    }
  }, [linkData, initializeSession]);

  // Apply brand color if enabled
  useEffect(() => {
    if (linkData.brand_enabled && linkData.brand_color) {
      document.documentElement.style.setProperty(
        '--brand-color',
        linkData.brand_color
      );
      return () => {
        document.documentElement.style.removeProperty('--brand-color');
      };
    }
  }, [linkData.brand_enabled, linkData.brand_color]);

  const handleAuthenticate = () => {
    setShowAuth(false);
    setSession({ ...session, authenticated: true });
  };

  // Show authentication modal if required and not authenticated
  if (showAuth && !session?.authenticated) {
    return (
      <AuthenticationModal
        link={linkData}
        onAuthenticate={handleAuthenticate}
        onCancel={() => window.history.back()}
      />
    );
  }

  return isDesktop ? (
    <LinkUploadDesktop linkData={linkData} />
  ) : (
    <LinkUploadMobile linkData={linkData} />
  );
}