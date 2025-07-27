import { cn } from '@/lib/utils/utils';
import { Upload, X } from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
}: {
  onChange?: (files: File[]) => void;
  files?: File[];
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
    // Single file upload - replace existing file
    const singleFile = newFiles[0];
    if (singleFile) {
      setFiles([singleFile]);
      onChange && onChange([singleFile]);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFiles([]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Notify parent for zustand store update
    onChange && onChange([]);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: error => {
      console.log(error);
    },
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.webp'],
    },
  });

  return (
    <div className='w-full' {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover='animate'
        className='p-10 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden'
      >
        <input
          ref={fileInputRef}
          id='file-upload-handle'
          type='file'
          accept='image/*'
          onChange={e => handleFileChange(Array.from(e.target.files || []))}
          className='hidden'
        />
        <div className='absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]'>
          <GridPattern />
        </div>
        <div className='flex flex-col items-center justify-center'>
          <p className='relative z-20 font-sans font-bold text-neutral-700 text-base'>
            Upload file
          </p>
          <p className='relative z-20 font-sans font-normal text-neutral-400 text-base mt-2'>
            Drag or drop your files here or click to upload
          </p>
          <div className='relative w-full mt-10 max-w-xl mx-auto'>
            {files.length > 0 &&
              files.map((file, idx) => (
                <motion.div
                  key={'file' + idx}
                  layoutId={idx === 0 ? 'file-upload' : 'file-upload-' + idx}
                  className={cn(
                    'relative overflow-hidden z-40 bg-white flex flex-col items-start justify-start md:h-28 p-5 mt-4 w-full mx-auto rounded-md',
                    'shadow-sm border border-neutral-200'
                  )}
                >
                  {/* Remove button */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleRemoveFile(idx);
                    }}
                    className='absolute top-2 right-2 w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 
                             flex items-center justify-center text-red-600 hover:text-red-700 
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
                      className='text-base text-neutral-700 truncate max-w-xs'
                    >
                      {file.name}
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className='rounded-lg px-2 py-1 w-fit shrink-0 text-sm text-neutral-600 bg-gray-100 shadow-sm'
                    >
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </motion.p>
                  </div>

                  <div className='flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-neutral-600 pr-8'>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className='px-1 py-0.5 rounded-md bg-gray-100'
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
                  'relative group-hover/file:shadow-2xl z-40 bg-white flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md',
                  'shadow-[0px_10px_50px_rgba(0,0,0,0.1)] border border-neutral-200'
                )}
              >
                {isDragActive ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className='text-neutral-600 flex flex-col items-center'
                  >
                    Drop it
                    <Upload className='h-4 w-4 text-neutral-600 mt-1' />
                  </motion.p>
                ) : (
                  <Upload className='h-4 w-4 text-neutral-600' />
                )}
              </motion.div>
            )}

            {!files.length && (
              <motion.div
                variants={secondaryVariant}
                className='absolute opacity-0 border border-dashed border-sky-400 inset-0 z-30 bg-transparent flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md'
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
    <div className='flex bg-gray-100 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105'>
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? 'bg-gray-50'
                  : 'bg-gray-50 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset]'
              }`}
            />
          );
        })
      )}
    </div>
  );
}
