'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { Progress } from '@/components/ui/core/shadcn/progress';
import { Button } from '@/components/ui/core/shadcn/button';
import type { CopyProgress } from '@/features/files/types';

interface CopyProgressIndicatorProps {
  operations: CopyProgress[];
  onCancel?: (fileId: string) => void;
  onDismiss?: () => void;
  className?: string;
}

export function CopyProgressIndicator({
  operations,
  onCancel,
  onDismiss,
  className,
}: CopyProgressIndicatorProps) {
  const totalProgress = operations.length
    ? operations.reduce((sum, op) => sum + op.progress, 0) / operations.length
    : 0;

  const completedCount = operations.filter(op => op.status === 'completed').length;
  const errorCount = operations.filter(op => op.status === 'error').length;
  const isComplete = operations.every(op => op.status === 'completed' || op.status === 'error');

  if (operations.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`fixed bottom-4 right-4 z-50 w-96 rounded-lg border bg-background p-4 shadow-lg ${className}`}
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Copy className="h-4 w-4 text-primary" />
            <h3 className="font-medium">
              Copying Files ({completedCount}/{operations.length})
            </h3>
          </div>
          {onDismiss && isComplete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Overall progress */}
        <div className="mb-4">
          <Progress value={totalProgress} className="h-2" />
          <p className="mt-1 text-xs text-muted-foreground">
            {Math.round(totalProgress)}% complete
            {errorCount > 0 && ` • ${errorCount} errors`}
          </p>
        </div>

        {/* Individual file progress (show first 3) */}
        <div className="space-y-2">
          {operations.slice(0, 3).map((operation) => (
            <div
              key={operation.fileId}
              className="flex items-center gap-2 text-sm"
            >
              {/* Status icon */}
              {operation.status === 'completed' ? (
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
              ) : operation.status === 'error' ? (
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
              ) : (
                <div className="h-4 w-4 flex-shrink-0">
                  <motion.div
                    className="h-full w-full rounded-full border-2 border-primary border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                </div>
              )}

              {/* File name */}
              <span className="flex-1 truncate">
                {operation.fileName}
              </span>

              {/* Progress or error */}
              {operation.status === 'error' ? (
                <span className="text-xs text-destructive">
                  {operation.error || 'Failed'}
                </span>
              ) : operation.status !== 'completed' ? (
                <span className="text-xs text-muted-foreground">
                  {operation.progress}%
                </span>
              ) : null}

              {/* Cancel button */}
              {operation.status === 'copying' && onCancel && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => onCancel(operation.fileId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}

          {/* Show remaining count */}
          {operations.length > 3 && (
            <p className="text-xs text-muted-foreground">
              and {operations.length - 3} more...
            </p>
          )}
        </div>

        {/* Error summary */}
        {isComplete && errorCount > 0 && (
          <div className="mt-3 rounded bg-destructive/10 p-2">
            <p className="text-xs text-destructive">
              {errorCount} file{errorCount !== 1 ? 's' : ''} failed to copy
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}