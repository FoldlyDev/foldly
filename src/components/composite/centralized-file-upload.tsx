import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileIcon, ImageIcon, Folder, MousePointer, AlertCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import type { FileRejection, DropzoneOptions } from "react-dropzone";

// Removed unused variants

export interface FileWithPreview extends File {
  preview?: string;
}

// Remove custom type - use react-dropzone's FileRejection type instead

export interface CentralizedFileUploadProps {
  // File handling
  onChange?: (files: File[]) => void;
  onRemove?: (index: number) => void;
  files?: File[];
  
  // Constraints from database schema
  multiple?: boolean;
  maxFiles?: number; // from links.maxFiles
  maxFileSize?: number; // from links.maxFileSize (in bytes)
  allowedFileTypes?: string[]; // from links.allowedFileTypes (MIME types)
  
  // UI customization
  showGrid?: boolean;
  uploadText?: string;
  uploadDescription?: string;
  className?: string;
  disabled?: boolean;
  
  // Custom empty state UI
  customEmptyState?: React.ReactNode;
  
  // Display options
  showFileSize?: boolean;
  showFileType?: boolean;
  showModifiedDate?: boolean;
  
  // Error handling
  onError?: (error: { type: 'size' | 'type' | 'count'; message: string; files?: File[] }) => void;
}

export const CentralizedFileUpload: React.FC<CentralizedFileUploadProps> = ({
  onChange,
  onRemove,
  files: externalFiles = [],
  multiple = false,
  maxFiles,
  maxFileSize,
  allowedFileTypes,
  showGrid = true,
  uploadText = "Upload file",
  uploadDescription = "Drag or drop your files here or click to upload",
  className,
  disabled = false,
  customEmptyState,
  showFileSize = true,
  showFileType = true,
  showModifiedDate = true,
  onError,
}) => {
  const [internalFiles, setInternalFiles] = useState<FileWithPreview[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showError, setShowError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use external files if provided, otherwise use internal state
  const files = externalFiles.length > 0 ? externalFiles : internalFiles;

  // Check if we've reached max files
  const hasReachedMaxFiles = maxFiles ? files.length >= maxFiles : false;

  // Show error message with auto-dismiss
  const showErrorMessage = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
    setTimeout(() => {
      setShowError(false);
    }, 5000); // Auto-dismiss after 5 seconds
  };

  const handleFileChange = (newFiles: File[]) => {
    // Don't add files if we've reached the limit
    if (hasReachedMaxFiles) {
      const message = `Maximum file limit (${maxFiles}) reached`;
      console.warn(message);
      showErrorMessage(message);
      onError?.({ type: 'count', message, files: newFiles });
      return;
    }

    // Validate file constraints
    let validFiles = newFiles;
    
    // Check file size
    if (maxFileSize) {
      const oversizedFiles = newFiles.filter(file => file.size > maxFileSize);
      if (oversizedFiles.length > 0) {
        const firstFile = oversizedFiles[0];
        const message = oversizedFiles.length === 1 && firstFile
          ? `File "${firstFile.name}" is too large (${formatFileSize(firstFile.size)}). Max size: ${formatFileSize(maxFileSize)}`
          : `${oversizedFiles.length} files exceed size limit (${formatFileSize(maxFileSize)})`;
        console.warn(message);
        showErrorMessage(message);
        onError?.({ type: 'size', message, files: oversizedFiles });
      }
      validFiles = validFiles.filter(file => file.size <= maxFileSize);
    }
    
    // Check file types
    if (allowedFileTypes && allowedFileTypes.length > 0) {
      const invalidFiles = newFiles.filter(file => 
        !allowedFileTypes.includes(file.type) && 
        !allowedFileTypes.includes('*') &&
        !allowedFileTypes.some(type => file.type.startsWith(type.replace('*', '')))
      );
      if (invalidFiles.length > 0) {
        const fileTypeMap: Record<string, string> = {
          'image/png': 'PNG',
          'image/jpeg': 'JPG',
          'image/jpg': 'JPG',
          'image/svg+xml': 'SVG',
          'image/webp': 'WebP'
        };
        const allowedTypeNames = allowedFileTypes.map(t => fileTypeMap[t] || t).join(', ');
        const firstInvalidFile = invalidFiles[0];
        const message = invalidFiles.length === 1 && firstInvalidFile
          ? `File "${firstInvalidFile.name}" is not an allowed type. Please upload: ${allowedTypeNames}`
          : `${invalidFiles.length} files have invalid types. Please upload: ${allowedTypeNames}`;
        console.warn(message);
        showErrorMessage(message);
        onError?.({ type: 'type', message, files: invalidFiles });
      }
      validFiles = validFiles.filter(file => 
        allowedFileTypes.includes(file.type) || 
        allowedFileTypes.includes('*') ||
        allowedFileTypes.some(type => file.type.startsWith(type.replace('*', '')))
      );
    }
    
    if (validFiles.length === 0) {
      return;
    }
    
    // Handle multiple files
    if (multiple) {
      const currentFileCount = files.length;
      const remainingSlots = maxFiles ? Math.max(0, maxFiles - currentFileCount) : validFiles.length;
      validFiles = validFiles.slice(0, remainingSlots);
      
      if (validFiles.length === 0) {
        return;
      }
      
      // Create previews for image files
      const filesWithPreviews = validFiles.map(file => {
        if (file.type.startsWith('image/')) {
          const preview = URL.createObjectURL(file);
          return Object.assign(file, { preview });
        }
        return file;
      });
      
      const updatedFiles = [...files, ...filesWithPreviews];
      setInternalFiles(updatedFiles as FileWithPreview[]);
      onChange && onChange(updatedFiles);
    } else {
      // Single file mode - replace existing file
      if (validFiles.length > 0) {
        // Clean up previous preview if exists
        if (files.length > 0) {
          const firstFile = files[0];
          if (firstFile && 'preview' in firstFile) {
            const preview = (firstFile as FileWithPreview).preview;
            if (preview) {
              URL.revokeObjectURL(preview);
            }
          }
        }
        
        const file = validFiles[0];
        if (file) {
          const fileWithPreview = file.type.startsWith('image/') 
            ? Object.assign(file, { preview: URL.createObjectURL(file) })
            : file;
          
          setInternalFiles([fileWithPreview]);
          onChange && onChange([file]);
        }
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    const fileToRemove = files[index];
    
    if (fileToRemove) {
      // Revoke object URL if it's an image preview
      if ('preview' in fileToRemove) {
        const preview = (fileToRemove as FileWithPreview).preview;
        if (preview) {
          URL.revokeObjectURL(preview);
        }
      }
    }
    
    const newFiles = files.filter((_, i) => i !== index);
    setInternalFiles(newFiles as FileWithPreview[]);
    
    if (onRemove) {
      onRemove(index);
    } else if (onChange) {
      onChange(newFiles);
    }
  };

  const handleClick = () => {
    if (!disabled && !hasReachedMaxFiles) {
      fileInputRef.current?.click();
    }
  };

  const dropzoneOptions: DropzoneOptions = {
    multiple,
    noClick: true,
    disabled: disabled || hasReachedMaxFiles,
    onDrop: handleFileChange,
    onDropRejected: (fileRejections: FileRejection[]) => {
      console.error('Files rejected:', fileRejections);
      fileRejections.forEach(rejection => {
        rejection.errors.forEach((error) => {
          if (error.code === 'file-too-large') {
            const message = `File "${rejection.file.name}" is too large (${formatFileSize(rejection.file.size)}). Max size: ${formatFileSize(maxFileSize || 0)}`;
            console.warn(message);
            showErrorMessage(message);
            onError?.({ type: 'size', message, files: [rejection.file] });
          } else if (error.code === 'file-invalid-type') {
            const message = `File "${rejection.file.name}" has invalid type`;
            console.warn(message);
            showErrorMessage(message);
            onError?.({ type: 'type', message, files: [rejection.file] });
          } else if (error.code === 'too-many-files') {
            const message = `Too many files. Max allowed: ${maxFiles}`;
            console.warn(message);
            showErrorMessage(message);
            onError?.({ type: 'count', message });
          }
        });
      });
    },
    ...(maxFiles && { maxFiles: !multiple ? 1 : maxFiles }),
    ...(maxFileSize && { maxSize: maxFileSize }),
    ...(allowedFileTypes && allowedFileTypes.length > 0 && {
      accept: allowedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {} as Record<string, string[]>)
    })
  };

  const { getRootProps, isDragActive } = useDropzone(dropzoneOptions);
  
  // Clean up previews on unmount
  React.useEffect(() => {
    return () => {
      internalFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className={cn("w-full relative", className)} {...getRootProps()}>
      {/* Error message overlay */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute -top-2 left-0 right-0 z-50 mx-auto max-w-md"
          >
            <div className="bg-destructive/90 backdrop-blur-sm text-destructive-foreground rounded-lg px-4 py-3 shadow-lg border border-destructive flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div
        onClick={handleClick}
        className={cn(
          "relative overflow-hidden rounded-2xl transition-all duration-300",
          "group backdrop-blur-sm",
          !hasReachedMaxFiles && !disabled && "cursor-pointer",
          isDragActive
            ? "border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5 scale-[1.02] shadow-2xl shadow-primary/20"
            : "border-2 border-dashed border-border hover:border-border/80 bg-gradient-to-br from-background/90 to-muted/50 hover:shadow-xl",
          (disabled || hasReachedMaxFiles) && "opacity-50 cursor-not-allowed"
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={allowedFileTypes?.join(',')}
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
          disabled={disabled}
        />
        
        {/* Premium Animated Background Pattern */}
        <div className='absolute inset-0 pointer-events-none'>
          {/* Gradient orbs */}
          <motion.div 
            animate={{ 
              x: isDragActive ? [0, 20, 0] : 0,
              y: isDragActive ? [0, -10, 0] : 0,
              scale: isDragActive ? 1.2 : 1
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className='absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full -translate-x-32 -translate-y-32 blur-2xl' 
          />
          <motion.div 
            animate={{ 
              x: isDragActive ? [0, -20, 0] : 0,
              y: isDragActive ? [0, 10, 0] : 0,
              scale: isDragActive ? 1.2 : 1
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className='absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-purple-600/20 to-transparent rounded-full translate-x-32 translate-y-32 blur-2xl' 
          />
          
          {/* Grid pattern */}
          {showGrid && (
            <div className={cn(
              'absolute inset-0 opacity-[0.03]',
              isDragActive && 'opacity-[0.05]'
            )}
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
              }}
            />
          )}
        </div>
        
        {/* Upload Area Content */}
        <div className='relative p-6 sm:p-8 lg:p-12'>
          {/* File list or empty state */}
          {files.length > 0 ? (
          <div className="relative z-20">
            <AnimatePresence>
              {files.map((file, idx) => (
                <motion.div
                  key={`file-${idx}-${file.name}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  layoutId={idx === 0 ? "file-upload" : `file-upload-${idx}`}
                  className={cn(
                    "relative overflow-hidden z-40 mt-3 rounded-xl",
                    "bg-card/90 backdrop-blur-sm",
                    "border border-border/50 hover:border-border",
                    "shadow-sm hover:shadow-md",
                    "transition-all duration-200"
                  )}
                >
                  <div className="p-4 flex items-center gap-4">
                    {/* File icon or preview - properly aligned */}
                    <div className="shrink-0 flex items-center justify-center">
                      {file.type.startsWith('image/') && 'preview' in file && (file as FileWithPreview).preview ? (
                        <div className="relative">
                          <img 
                            src={(file as FileWithPreview).preview} 
                            alt={file.name}
                            className="w-12 h-12 rounded-lg object-cover ring-1 ring-border/10"
                          />
                          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                        </div>
                      ) : (
                        <div className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center",
                          "bg-gradient-to-br from-muted/50 to-muted/30",
                          "border border-border/50"
                        )}>
                          {file.type.startsWith('image/') ? (
                            <ImageIcon className="w-6 h-6 text-muted-foreground/70" />
                          ) : (
                            <FileIcon className="w-6 h-6 text-muted-foreground/70" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* File info - properly aligned with preview */}
                    <div className="flex-1 min-w-0">
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        layout
                        className="text-sm font-medium text-foreground truncate"
                      >
                        {file.name}
                      </motion.p>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {showFileSize && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            layout
                            className={cn(
                              "px-2 py-0.5 rounded-md text-xs font-medium",
                              "bg-secondary/10 text-secondary-foreground/70",
                              "border border-secondary/20"
                            )}
                          >
                            {formatFileSize(file.size)}
                          </motion.span>
                        )}
                        
                        {showFileType && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            layout
                            className="text-xs text-muted-foreground"
                          >
                            {file.type || 'unknown'}
                          </motion.span>
                        )}
                        
                        {showModifiedDate && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            layout
                            className="text-xs text-muted-foreground"
                          >
                            {new Date(file.lastModified).toLocaleDateString()}
                          </motion.span>
                        )}
                      </div>
                    </div>
                    
                    {/* Remove button - properly styled */}
                    {!disabled && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                        className={cn(
                          "p-2 rounded-lg transition-all duration-200 cursor-pointer",
                          "hover:bg-destructive/10 group",
                          "border border-transparent hover:border-destructive/20"
                        )}
                        type="button"
                        aria-label="Remove file"
                      >
                        <X className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center space-y-6'>
            {customEmptyState || (
              <>
                {/* Animated Icon */}
                <motion.div
                  animate={{
                    rotate: isDragActive ? [0, 5, -5, 0] : 0,
                    scale: isDragActive ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.5 }}
                  className={cn(
                    'p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl transition-all duration-300',
                    isDragActive
                      ? 'bg-gradient-to-br from-primary/20 to-primary/10 shadow-xl shadow-primary/20'
                      : 'bg-gradient-to-br from-muted to-muted/50 group-hover:from-primary/10 group-hover:to-primary/5 group-hover:shadow-lg'
                  )}
                >
                  <Upload
                    className={cn(
                      'w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 transition-colors duration-300',
                      isDragActive
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-primary'
                    )}
                  />
                </motion.div>

                {/* Text Content */}
                <div className='text-center space-y-1 sm:space-y-2'>
                  <h3
                    className={cn(
                      'text-base sm:text-lg font-semibold transition-colors duration-300',
                      isDragActive ? 'text-primary' : 'text-foreground'
                    )}
                  >
                    {isDragActive
                      ? 'Perfect! Drop them here'
                      : uploadText}
                  </h3>
                  <p className={cn(
                    'text-xs sm:text-sm transition-colors duration-300',
                    isDragActive ? 'text-primary/80' : 'text-muted-foreground'
                  )}>
                    {isDragActive
                      ? 'Release to start uploading'
                      : uploadDescription}
                  </p>
                </div>

                {/* Interactive Elements - matching workspace modal */}
                <div className='flex flex-col sm:flex-row items-center gap-3 sm:gap-6'>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className='flex items-center gap-2 px-3 sm:px-4 py-2 bg-card/80 rounded-lg sm:rounded-xl border border-border hover:border-primary/50 transition-all duration-200 cursor-pointer'
                  >
                    <Folder className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground' />
                    <span className='text-xs sm:text-sm font-medium text-foreground'>
                      Browse Files
                    </span>
                  </motion.div>

                  <div className='flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground'>
                    <MousePointer className='w-2.5 h-2.5 sm:w-3 sm:h-3' />
                    <span>or drag & drop</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-gray-100 dark:bg-neutral-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-gray-50 dark:bg-neutral-950"
                  : "bg-gray-50 dark:bg-neutral-950 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
              }`}
            />
          );
        })
      )}
    </div>
  );
}