"use client";

import { Upload, FolderOpen, FileCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Drag-to-Upload Overlay Props
 */
export interface DragToUploadOverlayProps {
  /** Whether the overlay should be visible */
  isVisible: boolean;
  /** Name of the folder where files will be uploaded */
  currentFolderName?: string;
  /** Maximum file size in MB */
  maxSizeMB?: number;
  /** Whether there's an error (triggers shake animation) */
  hasError?: boolean;
}

/**
 * Drag-to-Upload Overlay
 *
 * Full-screen overlay shown when user drags files from their OS file explorer
 * over the workspace. Provides visual feedback for drop target and upload constraints.
 *
 * Features:
 * - Glassmorphism effect (blur + semi-transparent)
 * - Upload icon and instruction text
 * - Displays target folder name
 * - Shows file size limit
 * - Smooth fade-in/out animation
 * - Pointer-events-none to allow drop event to reach parent
 *
 * @example
 * ```tsx
 * <DragToUploadOverlay
 *   isVisible={isDragging}
 *   currentFolderName="Documents"
 *   maxSizeMB={100}
 * />
 * ```
 */
export function DragToUploadOverlay({
  isVisible,
  currentFolderName = "Root",
  maxSizeMB = 100,
  hasError = false,
}: DragToUploadOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={
              hasError
                ? {
                    scale: 1,
                    opacity: 1,
                    x: [0, -10, 10, -10, 10, 0],
                  }
                : { scale: 1, opacity: 1 }
            }
            exit={{ scale: 0.9, opacity: 0 }}
            transition={
              hasError
                ? { duration: 0.5, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }
                : { duration: 0.2, delay: 0.05 }
            }
            className="flex flex-col items-center gap-6 rounded-2xl border-2 border-dashed border-primary/50 bg-background/90 px-12 py-16 shadow-2xl backdrop-blur-md"
          >
            {/* Upload Icon */}
            <div className="rounded-full bg-primary/10 p-6">
              <Upload className="size-12 text-primary" strokeWidth={2} />
            </div>

            {/* Instruction Text */}
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-semibold">Drop files to upload</h3>

              {/* Upload destination */}
              <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/50 px-4 py-2">
                <FolderOpen className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Uploading to: <span className="text-primary">{currentFolderName}</span>
                </p>
              </div>

              {/* File size limit */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <FileCheck className="size-3.5" />
                <p>Maximum {maxSizeMB}MB per file</p>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {hasError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive"
                  >
                    This item type is not supported
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
