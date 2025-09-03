'use client';

import React from 'react';
import '@/styles/components/feedback/upload-highlight.css';

interface UploadHighlightProps {
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
  multiple?: boolean;
}

export function UploadHighlight({ 
  onChange,
  accept,
  multiple = false
}: UploadHighlightProps) {
  return (
    <div className="input-div" style={{ position: 'relative' }}>
      <input 
        className="input" 
        name="file" 
        type="file"
        onChange={onChange}
        accept={accept}
        multiple={multiple}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'pointer',
          zIndex: 2
        }}
      />
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="1em" 
        height="1em" 
        strokeLinejoin="round" 
        strokeLinecap="round" 
        viewBox="0 0 24 24" 
        strokeWidth="2" 
        fill="none" 
        stroke="currentColor" 
        className="icon"
        style={{
          pointerEvents: 'none',
          zIndex: 1
        }}
      >
        <polyline points="16 16 12 12 8 16"></polyline>
        <line y2="21" x2="12" y1="12" x1="12"></line>
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
        <polyline points="16 16 12 12 8 16"></polyline>
      </svg>
    </div>
  );
}