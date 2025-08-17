import { cn } from '@/lib/utils/utils';
import { Upload, X } from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

export const FileUpload = ({
  onChange,
  files: externalFiles,
  multiple = false,
  accept,
  disabled = false,
  className,
  showGrid = true,
  uploadText = 'Upload file',
  uploadDescription = 'Drag or drop your files here or click to upload',
  isDraggingExternal = false,
}: {
  onChange?: (files: File[]) => void;
  files?: File[];
  multiple?: boolean;
  accept?: Record<string, string[]>;
  disabled?: boolean;
  className?: string;
  showGrid?: boolean;
  uploadText?: string;
  uploadDescription?: string;
  isDraggingExternal?: boolean;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with external files prop for zustand store connection
  useEffect(() => {
    if (externalFiles) {
      setFiles(externalFiles);
    }
  }, [externalFiles]);

  const handleFileChange = (newFiles: File[]) => {
    if (multiple) {
      // Multiple file upload - append to existing files
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onChange && onChange(updatedFiles);
    } else {
      // Single file upload - replace existing file
      const singleFile = newFiles[0];
      if (singleFile) {
        setFiles([singleFile]);
        onChange && onChange([singleFile]);
      }
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const updatedFiles = files.filter((_, index) => index !== indexToRemove);
    setFiles(updatedFiles);

    // Reset file input if no files remain
    if (updatedFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Notify parent for zustand store update
    onChange && onChange(updatedFiles);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: error => {
      console.log(error);
    },
    ...(accept && { accept }),
    disabled,
  });

  return (
    <div className='w-full' {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover='animate'
        className={cn(
          'p-10 group/file block rounded-lg w-full relative overflow-hidden',
          !disabled && 'cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <input
          ref={fileInputRef}
          id='file-upload-handle'
          type='file'
          multiple={multiple}
          accept={accept ? Object.keys(accept).join(',') : undefined}
          onChange={e => handleFileChange(Array.from(e.target.files || []))}
          className='hidden'
          disabled={disabled}
        />
        {showGrid && (
          <div className='absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]'>
            <GridPattern />
          </div>
        )}
        <div className='flex flex-col items-center justify-center'>
          <p className='relative z-20 font-sans font-bold text-neutral-700 dark:text-neutral-200 text-base'>
            {uploadText}
          </p>
          <p className='relative z-20 font-sans font-normal text-neutral-400 dark:text-neutral-500 text-base mt-2'>
            {uploadDescription}
          </p>
          <div className='relative w-full mt-10 max-w-xl mx-auto'>
            {files.length > 0 &&
              files.map((file, idx) => (
                <motion.div
                  key={'file' + idx}
                  layoutId={idx === 0 ? 'file-upload' : 'file-upload-' + idx}
                  className={cn(
                    'relative overflow-hidden z-40 bg-white dark:bg-neutral-800 flex flex-col items-start justify-start md:h-28 p-5 mt-4 w-full mx-auto rounded-md',
                    'shadow-sm border border-neutral-200 dark:border-neutral-700'
                  )}
                >
                  {/* Remove button */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleRemoveFile(idx);
                    }}
                    className='absolute top-2 right-2 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 
                             flex items-center justify-center text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 
                             transition-colors cursor-pointer z-50'
                    title='Remove file'
                  >
                    <X className='w-3 h-3' />
                  </button>

                  <div className='flex justify-between w-full items-center gap-4 pr-8'>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className='text-base text-neutral-700 dark:text-neutral-200 truncate max-w-xs'
                    >
                      {file.name}
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className='rounded-lg px-2 py-1 w-fit shrink-0 text-sm text-neutral-600 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 shadow-sm'
                    >
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </motion.p>
                  </div>

                  <div className='flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-neutral-600 dark:text-neutral-400 pr-8'>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className='px-1 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-700'
                    >
                      {file.type}
                    </motion.p>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                    >
                      modified{' '}
                      {new Date(file.lastModified).toLocaleDateString()}
                    </motion.p>
                  </div>
                </motion.div>
              ))}
            {!files.length && (
              <motion.div
                layoutId='file-upload'
                variants={mainVariant}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
                className={cn(
                  'relative group-hover/file:shadow-2xl z-40 bg-white dark:bg-neutral-800 flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md',
                  'shadow-[0px_10px_50px_rgba(0,0,0,0.1)] dark:shadow-[0px_10px_50px_rgba(255,255,255,0.05)] border border-neutral-200 dark:border-neutral-700'
                )}
              >
                {(isDragActive || isDraggingExternal) ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className='text-neutral-600 dark:text-neutral-300 flex flex-col items-center'
                  >
                    Drop it
                    <Upload className='h-4 w-4 text-neutral-600 dark:text-neutral-300 mt-1' />
                  </motion.p>
                ) : (
                  <Upload className='h-4 w-4 text-neutral-600 dark:text-neutral-300' />
                )}
              </motion.div>
            )}

            {!files.length && (
              <motion.div
                variants={secondaryVariant}
                className='absolute opacity-0 border border-dashed border-sky-400 dark:border-sky-500 inset-0 z-30 bg-transparent flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md'
              ></motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className='flex bg-gray-100 dark:bg-neutral-800 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105'>
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? 'bg-gray-50 dark:bg-neutral-700'
                  : 'bg-gray-50 dark:bg-neutral-700 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,0.5)_inset]'
              }`}
            />
          );
        })
      )}
    </div>
  );
}
