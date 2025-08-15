'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDropzone } from 'react-dropzone';
import { 
  CloudUpload, 
  FileIcon, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  MousePointer,
  Folder,
  Image,
  FileText,
  Music,
  Video,
  Archive,
  File
} from 'lucide-react';
import type { LinkWithOwner } from '../../types';

interface FileWithProgress {
  file: File;
  id: string;
  progress: number;
  status: 'staged' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

interface LinkUploadAreaProps {
  onFileSelect: (files: FileList | File[]) => void;
  isDragging: boolean;
  isUploading: boolean;
  linkData: LinkWithOwner;
  formatSize: (bytes: number) => string;
  files: FileWithProgress[];
  onRemoveFile: (fileId: string) => void;
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

export function LinkUploadArea({
  onFileSelect,
  isDragging: externalIsDragging,
  isUploading,
  linkData,
  formatSize,
  files,
  onRemoveFile,
}: LinkUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localIsDragging, setLocalIsDragging] = useState(false);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  
  const isDragging = externalIsDragging || localIsDragging;
  const brandColor = linkData.branding?.enabled && linkData.branding?.color ? linkData.branding.color : '#3b82f6';

  // Generate thumbnails for image files
  useEffect(() => {
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
      Object.entries(thumbnails).forEach(([fileId, url]) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [files]);
  
  // Additional cleanup when component unmounts
  useEffect(() => {
    return () => {
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
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    multiple: true,
    noClick: true,
    disabled: isUploading,
    onDrop: (acceptedFiles) => {
      handleFileChange(acceptedFiles);
      setLocalIsDragging(false);
    },
    onDragEnter: () => setLocalIsDragging(true),
    onDragLeave: () => setLocalIsDragging(false),
    onDropRejected: () => {
      setLocalIsDragging(false);
    },
    accept: linkData.allowedFileTypes?.length 
      ? linkData.allowedFileTypes.reduce((acc, type) => {
          acc[type] = [];
          return acc;
        }, {} as Record<string, string[]>)
      : undefined,
  });

  return (
    <div className="relative" {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        className={cn(
          'relative overflow-hidden rounded-2xl transition-all duration-300',
          'group backdrop-blur-sm cursor-pointer',
          isDragging
            ? 'border-2 border-blue-500 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 scale-[1.02] shadow-2xl shadow-blue-500/20'
            : 'border-2 border-dashed border-gray-300 hover:border-gray-400 bg-gradient-to-br from-white/90 to-gray-50/50 hover:shadow-xl',
          isUploading && 'cursor-not-allowed opacity-60'
        )}
        style={{
          borderColor: isDragging && linkData.branding?.enabled ? `${brandColor}66` : undefined,
          backgroundColor: isDragging && linkData.branding?.enabled ? `${brandColor}0d` : undefined,
        }}
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
          disabled={isUploading}
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
              style={{
                backgroundColor: linkData.branding?.enabled && !isDragging 
                  ? `${brandColor}1a` 
                  : undefined
              }}
            >
              <CloudUpload
                className={cn(
                  'w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 transition-colors duration-300',
                  isDragging
                    ? 'text-blue-600'
                    : 'text-gray-600 group-hover:text-blue-600'
                )}
                style={{ 
                  color: linkData.branding?.enabled && !isDragging 
                    ? brandColor 
                    : undefined 
                }}
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
                style={{
                  borderColor: linkData.branding?.enabled ? `${brandColor}33` : undefined,
                  color: linkData.branding?.enabled ? brandColor : undefined,
                }}
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
              <div className="relative w-full mt-4 sm:mt-6 lg:mt-8 max-w-2xl mx-auto overflow-hidden">
                <h4 className="font-medium text-sm mb-3">
                  Selected files ({files.length})
                </h4>
                
                <div className="max-h-60 overflow-y-auto overflow-x-hidden space-y-2 pr-1">
                  {files.map((fileData, idx) => (
                    <motion.div
                      key={fileData.id}
                      layoutId={`file-${fileData.id}`}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20, scale: 0.95 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        delay: idx * 0.05 
                      }}
                      whileHover={{ scale: 1.002 }}
                      className={cn(
                        'relative overflow-hidden rounded-xl border transition-all duration-300',
                        'bg-white/80 backdrop-blur-sm',
                        fileData.status === 'failed' 
                          ? 'border-red-200/50 bg-gradient-to-r from-red-50/80 to-red-100/50' 
                          : fileData.status === 'completed'
                          ? 'border-green-200/50 bg-gradient-to-r from-green-50/80 to-emerald-50/50'
                          : 'border-gray-200/50',
                        'hover:shadow-md'
                      )}
                    >
                      <div className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                        {/* Thumbnail or Icon */}
                        <div className="shrink-0">
                          {fileData.file.type.startsWith('image/') && thumbnails[fileData.id] ? (
                            <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-lg overflow-hidden bg-gray-100">
                              <img 
                                src={thumbnails[fileData.id]} 
                                alt={fileData.file.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const thumbnailUrl = thumbnails[fileData.id];
                                  if (thumbnailUrl?.startsWith('blob:')) {
                                    URL.revokeObjectURL(thumbnailUrl);
                                  }
                                  setThumbnails(prev => {
                                    const next = { ...prev };
                                    delete next[fileData.id];
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
                              <span className={getFileIconColor(fileData.file)}>
                                {getFileIcon(fileData.file)}
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
                              {fileData.file.name}
                            </motion.p>
                            
                            {/* Status Icons */}
                            {fileData.status === 'uploading' && (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            )}
                            {fileData.status === 'completed' && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="p-1.5 rounded-lg bg-green-100"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                              </motion.div>
                            )}
                            {fileData.status === 'failed' && (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                            {!isUploading && fileData.status === 'staged' && onRemoveFile && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveFile(fileData.id);
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
                              {formatSize(fileData.file.size)}
                            </motion.span>
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              layout
                            >
                              {fileData.file.type || 'unknown'}
                            </motion.span>
                            {fileData.status !== 'staged' && (
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={cn(
                                  'capitalize',
                                  fileData.status === 'failed' && 'text-red-600',
                                  fileData.status === 'completed' && 'text-green-600',
                                  fileData.status === 'uploading' && 'text-blue-600'
                                )}
                              >
                                {fileData.status}
                              </motion.span>
                            )}
                          </div>

                          {/* Upload Progress */}
                          {fileData.status === 'uploading' && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2"
                            >
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                  animate={{ width: `${fileData.progress}%` }}
                                  transition={{ duration: 0.3 }}
                                />
                              </div>
                              <p className="text-[10px] text-blue-600 mt-1">
                                Uploading... {fileData.progress}%
                              </p>
                            </motion.div>
                          )}
                          
                          {/* Error State */}
                          {fileData.status === 'failed' && fileData.error && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="mt-1"
                            >
                              <p className="text-[10px] text-red-600">
                                {fileData.error}
                              </p>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
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
              Drop to upload instantly
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}