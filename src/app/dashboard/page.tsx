'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Card } from '@/components/ui/core/shadcn/card';
import { Progress } from '@/components/ui/core/shadcn/progress';
import { Button } from '@/components/ui/core/shadcn/button';
import { CheckCircle2, AlertCircle, Sparkles, FolderOpen, Shield, Zap } from 'lucide-react';
import { checkWorkspaceStatusAction, createWorkspaceAction } from '@/features/workspace/lib/actions/workspace-actions';

export default function DashboardPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const [status, setStatus] = useState<'checking' | 'creating' | 'ready' | 'error'>('checking');
  const [error, setError] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showFeatures, setShowFeatures] = useState(false);
  const [readyTimestamp, setReadyTimestamp] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;

    let intervalId: NodeJS.Timeout;
    let progressIntervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    const checkWorkspace = async (isInitialCheck = false) => {
      try {
        const result = await checkWorkspaceStatusAction();
        
        if (result.success && result.data?.exists) {
          if (isInitialCheck) {
            // Existing user with workspace - redirect immediately
            router.push('/dashboard/workspace');
            return true;
          }
          
          // New user - workspace just created, show success animation
          setStatus('ready');
          setProgress(100);
          setReadyTimestamp(Date.now());
          
          // Ensure minimum 3 seconds display for new users
          const displayDuration = 3000;
          setTimeout(() => {
            router.push('/dashboard/workspace');
          }, displayDuration);
          return true;
        }
        return false;
      } catch (err) {
        console.error('Error checking workspace:', err);
        return false;
      }
    };

    const createWorkspaceIfNeeded = async () => {
      setStatus('creating');
      try {
        const result = await createWorkspaceAction();
        if (result.success) {
          setStatus('ready');
          setProgress(100);
          setReadyTimestamp(Date.now());
          
          // Ensure minimum 3 seconds display
          const displayDuration = 3000;
          setTimeout(() => {
            router.push('/dashboard/workspace');
          }, displayDuration);
        } else {
          throw new Error(result.error || 'Failed to create workspace');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create workspace');
        setStatus('error');
      }
    };

    const startChecking = async () => {
      // Initial check - if workspace exists, redirect immediately
      const exists = await checkWorkspace(true);
      if (exists) return;

      // Only show loading UI for new users
      // Show features after a brief delay
      setTimeout(() => setShowFeatures(true), 800);

      // Smooth progress animation
      progressIntervalId = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) return 85;
          return prev + 5;
        });
      }, 150);

      // Poll for workspace existence
      intervalId = setInterval(async () => {
        const exists = await checkWorkspace(false);
        if (exists) {
          clearInterval(intervalId);
          clearInterval(progressIntervalId);
          clearTimeout(timeoutId);
        }
      }, 1000);

      // After 5 seconds, try to create workspace as backup
      timeoutId = setTimeout(async () => {
        clearInterval(intervalId);
        clearInterval(progressIntervalId);
        
        // Check one more time before creating
        const exists = await checkWorkspace(false);
        if (!exists) {
          await createWorkspaceIfNeeded();
        }
      }, 5000);
    };

    startChecking();

    return () => {
      clearInterval(intervalId);
      clearInterval(progressIntervalId);
      clearTimeout(timeoutId);
    };
  }, [userId, router, retryCount]);

  const handleRetry = () => {
    setStatus('checking');
    setError('');
    setProgress(0);
    setShowFeatures(false);
    setRetryCount(prev => prev + 1);
  };

  const features = [
    { icon: FolderOpen, text: 'Organize files effortlessly' },
    { icon: Shield, text: 'Secure cloud storage' },
    { icon: Zap, text: 'Lightning-fast uploads' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -left-4 w-72 h-72 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 dark:opacity-30 animate-blob"></div>
        <div className="absolute top-1/3 -right-4 w-72 h-72 bg-yellow-300 dark:bg-yellow-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 dark:opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 dark:opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <Card className="relative w-full max-w-lg backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-gray-200/50 dark:border-gray-800/50 shadow-2xl">
        <div className="p-8">
          <div className="space-y-8">
            {/* Status Icon with enhanced animations */}
            <div className="flex justify-center">
              {status === 'ready' ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                  <CheckCircle2 className="relative h-20 w-20 text-green-500 animate-in fade-in-0 zoom-in-50 duration-700" />
                </div>
              ) : status === 'error' ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                  <AlertCircle className="relative h-20 w-20 text-red-500 animate-in fade-in-0 zoom-in-50 duration-700" />
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-0">
                    <div className="h-20 w-20 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
                    <div className="absolute top-0 left-0 h-20 w-20 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-blue-500 animate-pulse" />
                  </div>
                </div>
              )}
            </div>

            {/* Title and Message with fade animations */}
            <div className="text-center space-y-3 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                {status === 'checking' && 'Preparing Your Workspace'}
                {status === 'creating' && 'Creating Your Workspace'}
                {status === 'ready' && 'All Set!'}
                {status === 'error' && 'Setup Failed'}
              </h1>
              <p className="text-base text-muted-foreground max-w-sm mx-auto">
                {status === 'checking' && 'Setting up your personal file management system...'}
                {status === 'creating' && 'Almost there! Finalizing your workspace...'}
                {status === 'ready' && 'Your workspace is ready. Redirecting you now...'}
                {status === 'error' && error}
              </p>
            </div>

            {/* Feature list with staggered animations */}
            {showFeatures && status !== 'error' && status !== 'ready' && (
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 text-sm text-muted-foreground animate-in fade-in-0 slide-in-from-left-4"
                    style={{ animationDelay: `${index * 200}ms` }}
                  >
                    <feature.icon className="h-5 w-5 text-blue-500" />
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Enhanced Progress Bar */}
            {status !== 'error' && (
              <div className="space-y-2 animate-in fade-in-0 duration-700">
                <div className="relative">
                  <Progress value={progress} className="h-2 bg-gray-200 dark:bg-gray-800" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div 
                      className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground font-medium">
                  {progress}% complete
                </p>
              </div>
            )}

            {/* Success checkmark animation */}
            {status === 'ready' && (
              <div className="flex justify-center space-x-2 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-300">
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Error Retry Button with hover effects */}
            {status === 'error' && (
              <div className="flex justify-center animate-in fade-in-0 duration-500">
                <Button 
                  onClick={handleRetry} 
                  variant="default" 
                  className="group"
                >
                  <RefreshCw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                  Retry Setup
                </Button>
              </div>
            )}

            {/* Manual Continue (after 10 seconds) */}
            {status === 'checking' && progress >= 85 && (
              <div className="text-center animate-in fade-in-0 slide-in-from-bottom-2 duration-700">
                <p className="text-xs text-muted-foreground mb-3">
                  Taking longer than expected?
                </p>
                <Button
                  onClick={() => router.push('/dashboard/workspace')}
                  variant="outline"
                  size="sm"
                  className="group"
                >
                  Continue to Dashboard
                  <Zap className="ml-2 h-3 w-3 group-hover:animate-pulse" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Add custom styles for animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}