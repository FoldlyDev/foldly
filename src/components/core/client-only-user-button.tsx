'use client';

import { useState, useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';

interface ClientOnlyUserButtonProps {
  appearance?: {
    elements?: {
      avatarBox?: string;
    };
  };
  [key: string]: any; // Allow any other UserButton props
}

export default function ClientOnlyUserButton({
  ...props
}: ClientOnlyUserButtonProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Return a placeholder that matches the expected size during SSR
    return <div className='w-8 h-8 bg-gray-200 rounded-full animate-pulse' />;
  }

  return <UserButton {...props} />;
}
