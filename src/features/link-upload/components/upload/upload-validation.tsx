'use client';

import { AlertTriangle, XCircle, Info } from 'lucide-react';
import type { LinkWithOwner } from '../../types';

interface UploadValidationProps {
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  formatSize: (bytes: number) => string;
  linkData: LinkWithOwner;
}

interface UploadStorageWarningProps {
  remainingSpace: number;
  formatSize: (bytes: number) => string;
}

export function UploadValidation({ validation, formatSize, linkData }: UploadValidationProps) {
  if (validation.valid && validation.warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Errors */}
      {validation.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-red-800">Cannot upload files</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-red-600 rounded-full flex-shrink-0 mt-2" />
                    {error}
                  </li>
                ))}
              </ul>
              
              {/* Help text */}
              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-xs text-red-600">
                  <strong>Upload limits:</strong> Max {linkData.maxFiles} files, 
                  {formatSize(Math.min(linkData.maxFileSize, linkData.subscription.maxFileSize))} per file
                  {linkData.allowedFileTypes && linkData.allowedFileTypes.length > 0 && (
                    <>. Allowed types: {(linkData.allowedFileTypes as string[]).join(', ')}</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-yellow-800">Upload warnings</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-yellow-600 rounded-full flex-shrink-0 mt-2" />
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function UploadStorageWarning({ remainingSpace, formatSize }: UploadStorageWarningProps) {
  if (remainingSpace <= 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800">Storage full</h4>
            <p className="text-sm text-red-700 mt-1">
              No storage space remaining. Please free up space before uploading more files.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (remainingSpace < 100 * 1024 * 1024) { // Less than 100MB
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Low storage space</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Only {formatSize(remainingSpace)} remaining. Consider upgrading your plan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}