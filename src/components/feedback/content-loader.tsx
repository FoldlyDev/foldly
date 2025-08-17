'use client';

import '@/styles/components/ui/content-loader.css';

interface ContentLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ContentLoader: React.FC<ContentLoaderProps> = ({
  className = '',
  size = 'md',
}) => {
  return (
    <div className={`content-loader-container ${className}`}>
      <div className={`content-loader content-loader-${size}`}></div>
    </div>
  );
};
