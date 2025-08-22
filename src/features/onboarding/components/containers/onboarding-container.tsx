'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { checkWorkspaceStatusAction } from '@/features/workspace/lib/actions/workspace-actions';
import { completeOnboardingAction } from '../../lib/actions/onboarding-actions';
import { OnboardingFormSection } from '../sections/onboarding-form-section';
import { OnboardingStatusSection } from '../sections/onboarding-status-section';

// Configuration constants
const MIN_DISPLAY_TIME = 4000; // Increased from 2s to 4s for better UX

export function OnboardingContainer() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const [status, setStatus] = useState<
    'checking' | 'form' | 'creating' | 'ready' | 'error'
  >('checking');
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [showFeatures, setShowFeatures] = useState(false);
  const loadStartTime = useRef<number>(Date.now());
  const hasCheckedRef = useRef(false);

  // Define createWorkspaceWithUsername at component level
  const createWorkspaceWithUsername = useCallback(async (username: string) => {
    setStatus('creating');
    setProgress(0);
    setShowFeatures(true);
    loadStartTime.current = Date.now();

    // Animate progress while creating
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 5;
        return next >= 90 ? 90 : next;
      });
    }, 100);

    try {
      const result = await completeOnboardingAction(username);

      clearInterval(progressInterval);

      if (result.success) {
        setStatus('ready');
        setProgress(100);

        const elapsedTime = Date.now() - loadStartTime.current;
        const remainingTime = Math.max(1000, MIN_DISPLAY_TIME - elapsedTime);

        setTimeout(() => {
          router.push('/dashboard/workspace');
        }, remainingTime);
      } else {
        throw new Error(result.error || 'Failed to create workspace');
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError(
        err instanceof Error ? err.message : 'Failed to create workspace'
      );
      setStatus('error');
      setProgress(0);
    }
  }, [router]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      router.push('/sign-in');
      return;
    }

    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    // Start progress animation for checking phase
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 10;
        return next >= 90 ? 90 : next;
      });
    }, 100);

    // Cleanup flag to prevent state updates after unmount
    let isMounted = true;

    const checkWorkspace = async () => {
      try {
        const result = await checkWorkspaceStatusAction();
        return result.success && result.data?.exists;
      } catch (err) {
        console.error('Error checking workspace:', err);
        return false;
      }
    };

    const showOnboardingForm = () => {
      if (!isMounted) return;
      clearInterval(progressInterval);
      setStatus('form');
      setProgress(100);
      setShowFeatures(false);
    };

    const handleWorkspaceReady = () => {
      if (!isMounted) return;
      clearInterval(progressInterval);
      setStatus('ready');
      setProgress(100);

      const elapsedTime = Date.now() - loadStartTime.current;
      const remainingTime = Math.max(500, MIN_DISPLAY_TIME - elapsedTime);

      setTimeout(() => {
        if (isMounted) {
          router.push('/dashboard/workspace');
        }
      }, remainingTime);
    };

    const initialize = async () => {
      // Check if workspace already exists
      const exists = await checkWorkspace();
      if (!isMounted) return;
      
      if (exists) {
        handleWorkspaceReady();
      } else {
        // Show form immediately if no workspace
        showOnboardingForm();
      }
    };

    initialize();

    return () => {
      isMounted = false;
      clearInterval(progressInterval);
    };
  }, [userId, isLoaded, router]);

  const handleRetry = () => {
    hasCheckedRef.current = false;
    setStatus('checking');
    setError('');
    setProgress(0);
    setShowFeatures(false);
    loadStartTime.current = Date.now();
    router.refresh();
  };

  if (!isLoaded) {
    return null;
  }

  // Show the username form
  if (status === 'form') {
    return (
      <OnboardingFormSection
        onComplete={createWorkspaceWithUsername}
        onError={error => {
          setError(error);
          setStatus('error');
        }}
      />
    );
  }

  // Show status UI (checking, creating, ready, or error)
  return (
    <OnboardingStatusSection
      status={status}
      error={error}
      progress={progress}
      showFeatures={showFeatures}
      onRetry={handleRetry}
    />
  );
}
