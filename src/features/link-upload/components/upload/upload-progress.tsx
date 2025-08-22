'use client';

import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface UploadProgressProps {
  isUploading: boolean;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
}

export function UploadProgress({
  isUploading,
  totalFiles,
  completedFiles,
  failedFiles,
}: UploadProgressProps) {
  const progressPercentage = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;
  const isComplete = completedFiles + failedFiles === totalFiles;
  const hasErrors = failedFiles > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border rounded-lg p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Upload Progress</h4>
        <span className="text-sm text-muted-foreground">
          {completedFiles} of {totalFiles} files
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            isComplete && hasErrors
              ? 'bg-yellow-500'
              : isComplete
              ? 'bg-green-500'
              : 'bg-blue-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 text-sm">
        {isComplete ? (
          hasErrors ? (
            <>
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-yellow-700">
                Upload completed with {failedFiles} error{failedFiles > 1 ? 's' : ''}
              </span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-green-700">All files uploaded successfully</span>
            </>
          )
        ) : isUploading ? (
          <>
            <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-muted-foreground">
              Uploading files...
              {failedFiles > 0 && ` (${failedFiles} failed)`}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">Files staged - ready to upload</span>
        )}
      </div>

      {/* Error Details */}
      {failedFiles > 0 && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {failedFiles} file{failedFiles > 1 ? 's' : ''} failed to upload. Please try again.
        </div>
      )}
    </motion.div>
  );
}