'use client';

import { cn } from '@/lib/utils';
import { CloudUpload, MousePointer, Folder, X, Image, FileText, Music, Video, Archive, File } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

// Type definition moved from file-list.tsx
export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  retryCount?: number;
  maxRetries?: number;
}

interface FileUploadAreaProps {
  onFileSelect: (files: FileList | File[]) => void;
  isDragging: boolean;
  isUploading: boolean;
  isExceeded: boolean;
  className?: string;
  storageInfo: {
    remainingBytes: number;
    storageLimitBytes: number;
  };
  formatSize: (bytes: number) => string;
  files?: UploadFile[]; // Pass files from parent
  onRemoveFile?: (fileId: string) => void; // Pass remove handler from parent
}

// File type detection for icons
const getFileIcon = (file: File) => {
  const type = file.type;
  if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
  if (type.startsWith('video/')) return <Video className="w-4 h-4" />;
  if (type.startsWith('audio/')) return <Music className="w-4 h-4" />;
  if (type.includes('zip') || type.includes('rar')) return <Archive className="w-4 h-4" />;
  if (type.includes('pdf') || type.includes('doc')) return <FileText className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
};

const getFileIconColor = (file: File) => {
  const type = file.type;
  if (type.startsWith('image/')) return 'text-blue-600';
  if (type.startsWith('video/')) return 'text-purple-600';
  if (type.startsWith('audio/')) return 'text-pink-600';
  if (type.includes('zip') || type.includes('rar')) return 'text-yellow-600';
  if (type.includes('pdf') || type.includes('doc')) return 'text-red-600';
  return 'text-gray-600';
};

export function FileUploadArea({
  onFileSelect,
  isDragging: externalIsDragging,
  isUploading,
  isExceeded,
  className,
  storageInfo,
  formatSize,
  files = [],
  onRemoveFile,
}: FileUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localIsDragging, setLocalIsDragging] = useState(false);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  
  const isDragging = externalIsDragging || localIsDragging;

  // Generate thumbnails for image files
  React.useEffect(() => {
    const newThumbnails: Record<string, string> = {};
    
    files.forEach(file => {
      if (file.file.type.startsWith('image/') && !thumbnails[file.id]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          newThumbnails[file.id] = result;
          setThumbnails(prev => ({
            ...prev,
            [file.id]: result
          }));
        };
        reader.readAsDataURL(file.file);
      }
    });
    
    // Cleanup function to revoke object URLs
    return () => {
      // Clean up any blob URLs that were created
      Object.entries(thumbnails).forEach(([fileId, url]) => {
        // Only revoke blob URLs, not data URLs
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [files]);
  
  // Additional cleanup when component unmounts
  React.useEffect(() => {
    return () => {
      // Clean up all thumbnails on unmount
      Object.values(thumbnails).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [thumbnails]);

  const handleFileChange = (newFiles: File[]) => {
    onFileSelect(newFiles);
  };

  const handleClick = () => {
    if (!isUploading && !isExceeded) {
      fileInputRef.current?.click();
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    multiple: true,
    noClick: true,
    disabled: isUploading || isExceeded,
    onDrop: (acceptedFiles) => {
      handleFileChange(acceptedFiles);
      setLocalIsDragging(false);
    },
    onDragEnter: () => setLocalIsDragging(true),
    onDragLeave: () => setLocalIsDragging(false),
    onDropRejected: (error) => {
      console.log(error);
      setLocalIsDragging(false);
    },
  });

  return (
    <div className={cn('relative', className)} {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        className={cn(
          'relative overflow-hidden rounded-2xl transition-all duration-300',
          'group backdrop-blur-sm cursor-pointer',
          isDragging
            ? 'border-2 border-blue-500 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 scale-[1.02] shadow-2xl shadow-blue-500/20'
            : 'border-2 border-dashed border-gray-300 hover:border-gray-400 bg-gradient-to-br from-white/90 to-gray-50/50 hover:shadow-xl',
          isExceeded && 'opacity-50 cursor-not-allowed'
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <input
          {...getInputProps()}
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          multiple
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
          disabled={isUploading || isExceeded}
        />

        {/* Premium Animated Background Pattern */}
        <div className='absolute inset-0 pointer-events-none'>
          {/* Gradient orbs */}
          <motion.div 
            animate={{ 
              x: isDragging ? [0, 20, 0] : 0,
              y: isDragging ? [0, -10, 0] : 0,
              scale: isDragging ? 1.2 : 1
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className='absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full -translate-x-32 -translate-y-32 blur-2xl' 
          />
          <motion.div 
            animate={{ 
              x: isDragging ? [0, -20, 0] : 0,
              y: isDragging ? [0, 10, 0] : 0,
              scale: isDragging ? 1.2 : 1
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className='absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-purple-400/20 to-transparent rounded-full translate-x-32 translate-y-32 blur-2xl' 
          />
          
          {/* Grid pattern */}
          <div className={cn(
            'absolute inset-0 opacity-[0.03]',
            isDragging && 'opacity-[0.05]'
          )}
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
            }}
          />
        </div>

        {/* Upload Area Content */}
        <div className='relative p-6 sm:p-8 lg:p-12'>
          <div className='flex flex-col items-center justify-center space-y-6'>
            {/* Animated Icon */}
            <motion.div
              animate={{
                rotate: isDragging ? [0, 5, -5, 0] : 0,
                scale: isDragging ? 1.1 : 1,
              }}
              transition={{ duration: 0.5 }}
              className={cn(
                'p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl transition-all duration-300',
                isDragging
                  ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 shadow-xl shadow-blue-500/20'
                  : 'bg-gradient-to-br from-gray-100 to-gray-200/50 group-hover:from-blue-50 group-hover:to-indigo-50 group-hover:shadow-lg'
              )}
            >
              <CloudUpload
                className={cn(
                  'w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 transition-colors duration-300',
                  isDragging
                    ? 'text-blue-600'
                    : 'text-gray-600 group-hover:text-blue-600'
                )}
              />
            </motion.div>

            {/* Text Content */}
            <div className='text-center space-y-1 sm:space-y-2'>
              <h3
                className={cn(
                  'text-base sm:text-lg font-semibold transition-colors duration-300',
                  isDragging ? 'text-blue-900' : 'text-gray-900'
                )}
              >
                {isDragging
                  ? 'Perfect! Drop them here'
                  : 'Add your files'}
              </h3>
              <p className={cn(
                'text-xs sm:text-sm transition-colors duration-300',
                isDragging ? 'text-blue-700' : 'text-gray-600'
              )}>
                {isDragging
                  ? 'Release to start uploading'
                  : 'Select multiple files or folders at once'
                }
              </p>
            </div>

            {/* Interactive Elements */}
            <div className='flex flex-col sm:flex-row items-center gap-3 sm:gap-6'>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/80 rounded-lg sm:rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 cursor-pointer'
              >
                <Folder className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600' />
                <span className='text-xs sm:text-sm font-medium text-gray-700'>
                  Browse Files
                </span>
              </motion.div>

              <div className='flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-500'>
                <MousePointer className='w-2.5 h-2.5 sm:w-3 sm:h-3' />
                <span>or drag & drop</span>
              </div>
            </div>
          </div>

          {/* File List - Integrated into upload area */}
          <AnimatePresence>
            {files.length > 0 && (
              <div className="relative w-full mt-4 sm:mt-6 lg:mt-8 max-w-2xl mx-auto">
                {files.map((file, idx) => (
                  <motion.div
                    key={file.id}
                    layoutId={`file-${file.id}`}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.95 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      delay: idx * 0.05 
                    }}
                    className={cn(
                      'relative overflow-hidden rounded-xl border transition-all duration-300',
                      'bg-white/80 backdrop-blur-sm mt-3',
                      file.status === 'error' 
                        ? 'border-red-200/50 bg-gradient-to-r from-red-50/80 to-red-100/50' 
                        : file.status === 'success'
                        ? 'border-green-200/50 bg-gradient-to-r from-green-50/80 to-emerald-50/50'
                        : 'border-gray-200/50',
                      'hover:shadow-md hover:scale-[1.01]'
                    )}
                  >
                    <div className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                      {/* Thumbnail or Icon */}
                      <div className="shrink-0">
                        {file.file.type.startsWith('image/') && thumbnails[file.id] ? (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-lg overflow-hidden bg-gray-100">
                            <img 
                              src={thumbnails[file.id]} 
                              alt={file.file.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Handle image load errors
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                // Clean up the failed thumbnail
                                if (thumbnails[file.id]?.startsWith('blob:')) {
                                  URL.revokeObjectURL(thumbnails[file.id]);
                                }
                                setThumbnails(prev => {
                                  const next = { ...prev };
                                  delete next[file.id];
                                  return next;
                                });
                              }}
                            />
                          </div>
                        ) : (
                          <div className={cn(
                            "w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-lg flex items-center justify-center",
                            "bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200"
                          )}>
                            <span className={getFileIconColor(file.file)}>
                              {getFileIcon(file.file)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            layout
                            className="text-xs sm:text-sm font-medium text-gray-900 truncate"
                          >
                            {file.file.name}
                          </motion.p>
                          {file.status === 'success' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="p-1.5 rounded-lg bg-green-100"
                            >
                              <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </motion.div>
                          )}
                          {!isUploading && file.status !== 'uploading' && file.status !== 'success' && onRemoveFile && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveFile(file.id);
                              }}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-50 transition-colors"
                            >
                              <X className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
                            </motion.button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 mt-1 text-[10px] sm:text-xs text-gray-600">
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            layout
                            className="px-1.5 sm:px-2 py-0.5 rounded-md bg-gray-100"
                          >
                            {formatSize(file.file.size)}
                          </motion.span>
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            layout
                          >
                            {file.file.type || 'unknown'}
                          </motion.span>
                        </div>

                        {/* Upload Progress */}
                        {file.status === 'uploading' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2"
                          >
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                animate={{ width: `${file.progress}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                            {file.retryCount && file.retryCount > 0 && (
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-[10px] text-blue-600 mt-1 flex items-center gap-1"
                              >
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Retry {file.retryCount} of {file.maxRetries}
                              </motion.p>
                            )}
                          </motion.div>
                        )}
                        
                        {/* Error State */}
                        {file.status === 'error' && file.error && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-1 space-y-1"
                          >
                            <p className="text-[10px] text-red-600">
                              {file.error}
                            </p>
                            {onRemoveFile && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Reset file status to pending for retry
                                  const resetFile = { ...file, status: 'pending' as const, progress: 0, error: undefined };
                                  onRemoveFile(file.id);
                                  // Re-add the file
                                  setTimeout(() => onFileSelect([file.file]), 100);
                                }}
                                className="text-[10px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Retry upload
                              </button>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Drag Indicator */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className='absolute inset-0 flex items-center justify-center pointer-events-none'
          >
            <div className='px-6 py-3 bg-blue-600 text-white rounded-2xl shadow-2xl shadow-blue-600/30 font-medium'>
              ✨ Drop to upload instantly
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}